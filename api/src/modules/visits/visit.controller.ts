import type { Request, Response } from 'express';
import type { z } from 'zod';
import type { RoleName } from '../../generated/prisma/client.js';
import { ForbiddenError } from '../../lib/errors.js';
import { prisma } from '../../config/prisma.js';
import {
   createVisit,
   listVisits,
   getVisitById,
   approveVisit,
   rejectVisit,
   rescheduleVisit,
   cancelVisit,
   formatVisitDetail,
   formatVisitSummary,
} from './visit.service.js';
import type {
   createVisitRequestSchema,
   createWalkInVisitSchema,
   createHostInvitationSchema,
   listVisitsSchema,
   visitIdParamSchema,
   visitDecisionSchema,
   approveVisitSchema,
   rescheduleVisitSchema,
} from './visit.validation.js';

type CreateVisitRequestBody = z.infer<typeof createVisitRequestSchema>['body'];
type CreateWalkInVisitBody = z.infer<typeof createWalkInVisitSchema>['body'];
type CreateHostInvitationBody = z.infer<
   typeof createHostInvitationSchema
>['body'];
type ListVisitsQuery = z.infer<typeof listVisitsSchema>['query'];
type VisitIdParams = z.infer<typeof visitIdParamSchema>['params'];
type VisitDecisionParams = z.infer<typeof visitDecisionSchema>['params'];
type VisitDecisionBody = z.infer<typeof visitDecisionSchema>['body'];
type ApproveVisitBody = z.infer<typeof approveVisitSchema>['body'];
type RescheduleVisitParams = z.infer<typeof rescheduleVisitSchema>['params'];
type RescheduleVisitBody = z.infer<typeof rescheduleVisitSchema>['body'];

const INVITE_STAFF_ROLES: RoleName[] = ['RECEPTION', 'ADMIN', 'MANAGER'];

const sessionRoles = (req: Request): RoleName[] =>
   (req.session.roleCodes ?? []) as RoleName[];

const assertCanCreateInvitation = async (
   actorId: number,
   actorRoles: RoleName[],
   hostEmployeeId: number,
) => {
   if (actorRoles.some((role) => INVITE_STAFF_ROLES.includes(role))) {
      return;
   }

   const actor = await prisma.user.findUnique({
      where: { id: actorId },
      select: { employeeId: true },
   });

   if (actor?.employeeId === hostEmployeeId) {
      return;
   }

   throw new ForbiddenError(
      'You can only create invitations for yourself, or need a staff role',
   );
};

/** Public — no session exists yet at this point in the flow. */
export const submitVisitorRequest = async (req: Request, res: Response) => {
   const input = req.validatedBody as CreateVisitRequestBody;

   const visit = await createVisit(input, { source: 'PUBLIC' });

   return res.status(201).json({
      success: true,
      message: 'Visit request submitted successfully',
      data: formatVisitDetail(visit),
   });
};

export const submitWalkInVisit = async (req: Request, res: Response) => {
   const input = req.validatedBody as CreateWalkInVisitBody;

   const visit = await createVisit(input, {
      source: 'RECEPTION',
      createdById: req.session.userId,
   });

   return res.status(201).json({
      success: true,
      message: 'Walk-in visit registered successfully',
      data: formatVisitDetail(visit),
   });
};

/** Host or staff creates a pre-approved invitation visit. */
export const submitHostInvitation = async (req: Request, res: Response) => {
   const input = req.validatedBody as CreateHostInvitationBody;

   await assertCanCreateInvitation(
      req.session.userId!,
      sessionRoles(req),
      input.hostEmployeeId,
   );

   const visit = await createVisit(input, {
      source: 'HOST_INVITATION',
      createdById: req.session.userId,
   });

   return res.status(201).json({
      success: true,
      message: 'Host invitation created successfully',
      data: formatVisitDetail(visit),
   });
};

export const getVisits = async (req: Request, res: Response) => {
   const {
      status,
      hostEmployeeId,
      durationType,
      groupType,
      search,
      dateFrom,
      dateTo,
      page,
      limit,
   } = req.validatedQuery as ListVisitsQuery;

   const { visits, meta } = await listVisits({
      status,
      hostEmployeeId,
      durationType,
      groupType,
      search,
      dateFrom,
      dateTo,
      page,
      limit,
   });

   return res.status(200).json({
      success: true,
      data: visits.map(formatVisitSummary),
      pagination: meta,
   });
};

export const getVisit = async (req: Request, res: Response) => {
   const { id } = req.validatedParams as VisitIdParams;

   const visit = await getVisitById(id);

   return res.status(200).json({
      success: true,
      data: formatVisitDetail(visit),
   });
};

export const decideApproveVisit = async (req: Request, res: Response) => {
   const { id } = req.validatedParams as VisitDecisionParams;
   const body = req.validatedBody as ApproveVisitBody;

   const visit = await approveVisit(
      id,
      req.session.userId!,
      sessionRoles(req),
      body,
   );

   return res.status(200).json({
      success: true,
      message: 'Visit approved successfully',
      data: formatVisitDetail(visit),
   });
};

export const decideRejectVisit = async (req: Request, res: Response) => {
   const { id } = req.validatedParams as VisitDecisionParams;
   const { note } = req.validatedBody as VisitDecisionBody;

   const visit = await rejectVisit(
      id,
      req.session.userId!,
      sessionRoles(req),
      note,
   );

   return res.status(200).json({
      success: true,
      message: 'Visit rejected successfully',
      data: formatVisitDetail(visit),
   });
};

export const rescheduleVisitHandler = async (req: Request, res: Response) => {
   const { id } = req.validatedParams as RescheduleVisitParams;
   const body = req.validatedBody as RescheduleVisitBody;

   const visit = await rescheduleVisit(
      id,
      body,
      req.session.userId!,
      sessionRoles(req),
   );

   return res.status(200).json({
      success: true,
      message: 'Visit rescheduled successfully',
      data: formatVisitDetail(visit),
   });
};

export const cancelVisitHandler = async (req: Request, res: Response) => {
   const { id } = req.validatedParams as VisitDecisionParams;
   const { note } = req.validatedBody as VisitDecisionBody;

   const visit = await cancelVisit(
      id,
      req.session.userId!,
      sessionRoles(req),
      note,
   );

   return res.status(200).json({
      success: true,
      message: 'Visit cancelled successfully',
      data: formatVisitDetail(visit),
   });
};
