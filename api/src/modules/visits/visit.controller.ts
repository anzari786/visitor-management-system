import type { Request, Response } from 'express';
import type { z } from 'zod';
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
   listVisitsSchema,
   visitIdParamSchema,
   visitDecisionSchema,
   rescheduleVisitSchema,
} from './visit.validation.js';

type CreateVisitRequestBody = z.infer<typeof createVisitRequestSchema>['body'];
type CreateWalkInVisitBody = z.infer<typeof createWalkInVisitSchema>['body'];
type ListVisitsQuery = z.infer<typeof listVisitsSchema>['query'];
type VisitIdParams = z.infer<typeof visitIdParamSchema>['params'];
type VisitDecisionParams = z.infer<typeof visitDecisionSchema>['params'];
type VisitDecisionBody = z.infer<typeof visitDecisionSchema>['body'];
type RescheduleVisitParams = z.infer<typeof rescheduleVisitSchema>['params'];
type RescheduleVisitBody = z.infer<typeof rescheduleVisitSchema>['body'];

/** Public — no session exists yet at this point in the flow. */
export const submitVisitorRequest = async (req: Request, res: Response) => {
   const input = req.validatedBody as CreateVisitRequestBody;

   const visit = await createVisit(input, { isAssisted: false });

   return res.status(201).json({
      success: true,
      message: 'Visit request submitted successfully',
      data: formatVisitDetail(visit),
   });
};

export const submitWalkInVisit = async (req: Request, res: Response) => {
   const input = req.validatedBody as CreateWalkInVisitBody;

   const visit = await createVisit(input, {
      isAssisted: true,
      createdById: req.session.userId,
   });

   return res.status(201).json({
      success: true,
      message: 'Walk-in visit registered successfully',
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
   const { note } = req.validatedBody as VisitDecisionBody;

   const visit = await approveVisit(id, req.session.userId!, note);

   return res.status(200).json({
      success: true,
      message: 'Visit approved successfully',
      data: formatVisitDetail(visit),
   });
};

export const decideRejectVisit = async (req: Request, res: Response) => {
   const { id } = req.validatedParams as VisitDecisionParams;
   const { note } = req.validatedBody as VisitDecisionBody;

   const visit = await rejectVisit(id, req.session.userId!, note);

   return res.status(200).json({
      success: true,
      message: 'Visit rejected successfully',
      data: formatVisitDetail(visit),
   });
};

export const rescheduleVisitHandler = async (req: Request, res: Response) => {
   const { id } = req.validatedParams as RescheduleVisitParams;
   const { scheduleDates, note } = req.validatedBody as RescheduleVisitBody;

   const visit = await rescheduleVisit(
      id,
      scheduleDates,
      req.session.userId!,
      note,
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

   const visit = await cancelVisit(id, req.session.userId!, note);

   return res.status(200).json({
      success: true,
      message: 'Visit cancelled successfully',
      data: formatVisitDetail(visit),
   });
};
