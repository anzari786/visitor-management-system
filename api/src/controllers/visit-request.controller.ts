import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import {
   BadRequestError,
   ConflictError,
   NotFoundError,
   UnauthorizedError,
} from '../lib/errors.js';
import { Prisma } from '../generated/prisma/client.js';
import {
   dateRangeForVisitRequest,
   DEPARTMENT_CODE_TO_SHORT_NAME,
   toVisitRequestDTO,
   visitRequestInclude,
} from '../utils/visit-request.js';
import type {
   CreateVisitRequestBody,
   RejectVisitRequestBody,
   VisitRequestsQuery,
} from '../validations/visit-request.validation.js';

export const createVisitRequest = async (req: Request, res: Response) => {
   const body = (req.validatedBody ?? req.body) as CreateVisitRequestBody;

   const shortName =
      DEPARTMENT_CODE_TO_SHORT_NAME[body.departmentCode.toLowerCase()] ??
      body.departmentCode.toUpperCase();

   const department = await prisma.department.findFirst({
      where: {
         OR: [
            { shortName },
            { shortName: body.departmentCode },
            { name: { equals: body.departmentCode } },
         ],
         isActive: true,
      },
   });

   if (!department) {
      throw new NotFoundError('Department not found');
   }

   const request = await prisma.$transaction(async (tx) => {
      const visitorLinks: Array<{
         visitorId: number;
         email: string;
         organization?: string;
      }> = [];

      for (const visitorInput of body.visitors) {
         const fullName =
            `${visitorInput.firstName} ${visitorInput.lastName}`.trim();

         const existing = await tx.visitor.findUnique({
            where: {
               idType_idNumber: {
                  idType: visitorInput.idType,
                  idNumber: visitorInput.idNumber,
               },
            },
         });

         const visitor = existing
            ? await tx.visitor.update({
                 where: { id: existing.id },
                 data: {
                    fullName,
                    phone: visitorInput.phone,
                 },
              })
            : await tx.visitor.create({
                 data: {
                    fullName,
                    phone: visitorInput.phone,
                    idType: visitorInput.idType,
                    idNumber: visitorInput.idNumber,
                 },
              });

         visitorLinks.push({
            visitorId: visitor.id,
            email: visitorInput.email,
            organization: visitorInput.organization,
         });
      }

      return tx.visitRequest.create({
         data: {
            hostName: body.hostName,
            hostEmail: body.hostEmail,
            departmentId: department.id,
            purpose: body.purpose,
            startDate: new Date(body.startDate),
            endDate: new Date(body.endDate),
            startTime: body.startTime,
            endTime: body.endTime,
            visitors: {
               create: visitorLinks,
            },
         },
         include: visitRequestInclude,
      });
   });

   return res.status(201).json({
      success: true,
      message: 'Visit request submitted successfully.',
      data: {
         ...toVisitRequestDTO(request),
         requestId: `VR-${request.id}`,
         submittedAt: request.createdAt.toISOString(),
      },
   });
};

export const getVisitRequests = async (req: Request, res: Response) => {
   const { page, pageSize, search, status, dateFilter, departmentId } =
      req.validatedQuery as VisitRequestsQuery;

   const where: Prisma.VisitRequestWhereInput = {};

   if (departmentId) where.departmentId = departmentId;

   if (status && status !== 'all') {
      where.status = status;
   }

   const startDate = dateRangeForVisitRequest(dateFilter);
   if (startDate.gte || startDate.lte) {
      where.startDate = startDate;
   }

   if (search) {
      where.OR = [
         { hostName: { contains: search } },
         {
            visitors: {
               some: {
                  visitor: { fullName: { contains: search } },
               },
            },
         },
         {
            visitors: {
               some: {
                  organization: { contains: search },
               },
            },
         },
      ];
   }

   const [total, requests] = await Promise.all([
      prisma.visitRequest.count({ where }),
      prisma.visitRequest.findMany({
         where,
         include: visitRequestInclude,
         orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
         skip: (page - 1) * pageSize,
         take: pageSize,
      }),
   ]);

   return res.status(200).json({
      success: true,
      data: {
         data: requests.map(toVisitRequestDTO),
         total,
         page,
         pageSize,
         pageCount: Math.ceil(total / pageSize) || 1,
      },
   });
};

export const getVisitRequestById = async (req: Request, res: Response) => {
   const id = Number(req.params.id);

   const request = await prisma.visitRequest.findUnique({
      where: { id },
      include: visitRequestInclude,
   });

   if (!request) {
      throw new NotFoundError('Visit request not found');
   }

   return res.status(200).json({
      success: true,
      data: toVisitRequestDTO(request),
   });
};

export const approveVisitRequest = async (req: Request, res: Response) => {
   const id = Number(req.params.id);
   const userId = req.session.userId;

   if (!userId) {
      throw new UnauthorizedError('Not authenticated');
   }

   const existing = await prisma.visitRequest.findUnique({ where: { id } });

   if (!existing) {
      throw new NotFoundError('Visit request not found');
   }

   if (existing.status !== 'pending') {
      throw new ConflictError('Only pending visit requests can be approved');
   }

   // Email host notification can be wired here once email infrastructure exists.
   const updated = await prisma.visitRequest.update({
      where: { id },
      data: {
         status: 'approved',
         reviewedAt: new Date(),
         reviewedById: userId,
         rejectionReason: null,
      },
      include: visitRequestInclude,
   });

   return res.status(200).json({
      success: true,
      message: 'Visit request approved successfully.',
      data: toVisitRequestDTO(updated),
   });
};

export const rejectVisitRequest = async (req: Request, res: Response) => {
   const id = Number(req.params.id);
   const userId = req.session.userId;
   const { reason } = (req.validatedBody ?? req.body) as RejectVisitRequestBody;

   if (!userId) {
      throw new UnauthorizedError('Not authenticated');
   }

   const existing = await prisma.visitRequest.findUnique({ where: { id } });

   if (!existing) {
      throw new NotFoundError('Visit request not found');
   }

   if (existing.status !== 'pending') {
      throw new ConflictError('Only pending visit requests can be rejected');
   }

   if (reason !== undefined && reason.trim() === '') {
      throw new BadRequestError('Rejection reason cannot be empty');
   }

   // Email host notification can be wired here once email infrastructure exists.
   const updated = await prisma.visitRequest.update({
      where: { id },
      data: {
         status: 'rejected',
         reviewedAt: new Date(),
         reviewedById: userId,
         rejectionReason: reason?.trim() || null,
      },
      include: visitRequestInclude,
   });

   return res.status(200).json({
      success: true,
      message: 'Visit request rejected successfully.',
      data: toVisitRequestDTO(updated),
   });
};
