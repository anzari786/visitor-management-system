import type { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import {
   ConflictError,
   NotFoundError,
   UnauthorizedError,
} from '../lib/errors.js';
import {
   computeStatus,
   dateRangeFor,
   formatBadge,
   getSettings,
   toVisitDTO,
   visitInclude,
} from '../utils/visit.js';
import { Prisma } from '../generated/prisma/client.js';
import { BadgeParams, VisitsQuery } from '../validations/visit.validation.js';

export const getVisits = async (req: Request, res: Response) => {
   const { page, pageSize, search, status, dateFilter, departmentId } =
      req.validatedQuery as VisitsQuery;

   const where: Prisma.VisitWhereInput = {};

   if (departmentId) where.departmentId = departmentId;

   const checkedInAt = dateRangeFor(dateFilter);
   if (checkedInAt.gte || checkedInAt.lte) where.checkedInAt = checkedInAt;

   if (search) {
      where.OR = [{ visitor: { fullName: { contains: search } } }];
   }

   if (status && status !== 'all' && status !== 'overstay') {
      where.status = status;
   }

   const settings = await getSettings();

   if (status === 'overstay') {
      const activeVisits = await prisma.visit.findMany({
         where: { ...where, status: 'active' },
         include: visitInclude,
         orderBy: { checkedInAt: 'desc' },
      });

      const overstayVisits = activeVisits.filter(
         (v) => computeStatus(v, settings) === 'overstay',
      );

      const total = overstayVisits.length;
      const start = (page - 1) * pageSize;
      const pageItems = overstayVisits.slice(start, start + pageSize);

      return res.status(200).json({
         success: true,
         data: {
            data: pageItems.map((v) => toVisitDTO(v, settings)),
            total,
            page,
            pageSize,
            pageCount: Math.ceil(total / pageSize) || 1,
         },
      });
   }

   const [total, visits] = await Promise.all([
      prisma.visit.count({ where }),
      prisma.visit.findMany({
         where,
         include: visitInclude,
         orderBy: { checkedInAt: 'desc' },
         skip: (page - 1) * pageSize,
         take: pageSize,
      }),
   ]);

   return res.status(200).json({
      success: true,
      data: {
         data: visits.map((v) => toVisitDTO(v, settings)),
         total,
         page,
         pageSize,
         pageCount: Math.ceil(total / pageSize) || 1,
      },
   });
};

export const getVisitById = async (req: Request, res: Response) => {
   const id = Number(req.params.id);

   const [visit, settings] = await Promise.all([
      prisma.visit.findUnique({ where: { id }, include: visitInclude }),
      getSettings(),
   ]);

   if (!visit) {
      throw new NotFoundError('Visit not found');
   }

   return res.status(200).json({
      success: true,
      data: toVisitDTO(visit, settings),
   });
};

export const getActiveVisitByBadge = async (req: Request, res: Response) => {
   const { badgeNumber } = req.validatedParams as BadgeParams;

   const [visit, settings] = await Promise.all([
      prisma.visit.findFirst({
         where: { badgeNumber, status: 'active' },
         include: visitInclude,
      }),
      getSettings(),
   ]);

   if (!visit) {
      throw new NotFoundError('No active visit found for this badge');
   }

   return res.status(200).json({
      success: true,
      data: {
         id: visit.id,
         badge: formatBadge(settings.badgePrefix, visit.badgeNumber),
         visitorName: visit.visitor.fullName,
         host: visit.hostName,
         department: visit.department?.name ?? '',
         checkInTime: visit.checkedInAt.toISOString(),
      },
   });
};

export const getActiveVisitorsCount = async (_req: Request, res: Response) => {
   const activeCount = await prisma.visit.count({
      where: { status: 'active' },
   });

   return res.status(200).json({
      success: true,
      data: {
         activeCount,
      },
   });
};

export async function checkInVisitor(req: Request, res: Response) {
   const {
      fullName,
      phone,
      idType,
      idNumber,
      host,
      departmentId,
      badgeNumber,
   } = req.body;
   const userId = req.session.userId;

   if (!userId) {
      throw new UnauthorizedError('Not authenticated');
   }

   const visit = await prisma.$transaction(async (tx) => {
      const department = await tx.department.findUnique({
         where: { id: departmentId },
      });

      if (!department) {
         throw new NotFoundError('Department not found');
      }

      if (!department.isActive) {
         throw new ConflictError(
            'This department is inactive and cannot be checked into',
         );
      }

      const existingVisitor = await tx.visitor.findUnique({
         where: { idType_idNumber: { idType, idNumber } },
      });

      const visitor = existingVisitor
         ? await tx.visitor.update({
              where: { id: existingVisitor.id },
              data: { fullName, phone },
           })
         : await tx.visitor.create({
              data: { fullName, phone, idType, idNumber },
           });

      if (existingVisitor) {
         const activeVisit = await tx.visit.findFirst({
            where: { visitorId: visitor.id, status: 'active' },
         });

         if (activeVisit) {
            throw new ConflictError('This visitor already has an active visit');
         }
      }

      const badgeInUse = await tx.visit.findFirst({
         where: { badgeNumber, status: 'active' },
      });

      if (badgeInUse) {
         throw new ConflictError(
            'Badge is already assigned to an active visit',
         );
      }

      return tx.visit.create({
         data: {
            visitorId: visitor.id,
            badgeNumber,
            departmentId,
            hostName: host,
            checkedInById: userId,
         },
         include: visitInclude,
      });
   });

   const settings = await getSettings();

   return res.status(201).json({
      success: true,
      message: 'Visitor checked in successfully.',
      data: {
         id: visit.id,
         badge: formatBadge(settings.badgePrefix, visit.badgeNumber),
         visitorName: visit.visitor.fullName,
         host: visit.hostName,
         department: visit.department ?? null,
         checkInTime: visit.checkedInAt.toISOString(),
      },
   });
}

export const checkOutVisitor = async (req: Request, res: Response) => {
   const { badgeNumber, notes } = req.body;
   const userId = req.session.userId;

   const visit = await prisma.visit.findFirst({
      where: { badgeNumber, status: 'active' },
   });

   if (!visit) {
      throw new NotFoundError('No active visit found for this badge');
   }

   const [updated, settings] = await Promise.all([
      prisma.visit.update({
         where: { id: visit.id },
         data: {
            status: 'completed',
            checkedOutAt: new Date(),
            checkedOutById: userId,
            checkoutNote: notes,
         },
         include: visitInclude,
      }),
      getSettings(),
   ]);

   return res.status(200).json({
      success: true,
      message: 'Visitor checked out successfully.',
      data: {
         id: updated.id,
         badge: formatBadge(settings.badgePrefix, visit.badgeNumber),
         visitorName: updated.visitor.fullName,
         host: updated.hostName,
         department: updated.department?.name ?? '',
         checkInTime: updated.checkedInAt.toISOString(),
         checkOutTime: updated.checkedOutAt!.toISOString(),
      },
   });
};

export const checkOutVisitById = async (req: Request, res: Response) => {
   const id = Number(req.params.id);
   const userId = req.session.userId;

   const visit = await prisma.visit.findUnique({ where: { id } });

   if (!visit) throw new NotFoundError('Visit not found');
   if (visit.status !== 'active') {
      throw new ConflictError('Only active visits can be checked out');
   }

   const [updated, settings] = await Promise.all([
      prisma.visit.update({
         where: { id },
         data: {
            status: 'completed',
            checkedOutAt: new Date(),
            checkedOutById: userId,
         },
         include: visitInclude,
      }),
      getSettings(),
   ]);

   return res.status(200).json({
      success: true,
      message: 'Visitor checked out successfully.',
      data: toVisitDTO(updated, settings),
   });
};

export const cancelVisit = async (req: Request, res: Response) => {
   const id = Number(req.params.id);
   const userId = req.session.userId;

   const existing = await prisma.visit.findUnique({ where: { id } });

   if (!existing) throw new NotFoundError('Visit not found');
   if (existing.status !== 'active') {
      throw new ConflictError('Only active visits can be cancelled');
   }

   const [updated, settings] = await Promise.all([
      prisma.visit.update({
         where: { id },
         data: {
            status: 'cancelled',
            checkedOutAt: new Date(),
            checkedOutById: userId,
         },
         include: visitInclude,
      }),
      getSettings(),
   ]);

   return res.status(200).json({
      success: true,
      message: 'Visit cancelled successfully.',
      data: toVisitDTO(updated, settings),
   });
};
