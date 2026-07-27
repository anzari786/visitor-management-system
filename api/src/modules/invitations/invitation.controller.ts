import type { Request, Response } from 'express';
import type { z } from 'zod';
import {
   createInvitation,
   listInvitations,
   getInvitationById,
   recordInvitationArrival,
   rejectInvitation,
   cancelInvitation,
   convertInvitation,
   formatInvitationDetail,
   formatInvitationSummary,
} from './invitation.service.js';
import type {
   createInvitationSchema,
   listInvitationsSchema,
   invitationIdParamSchema,
   invitationDecisionSchema,
   convertInvitationSchema,
} from './invitation.validation.js';

type CreateInvitationBody = z.infer<typeof createInvitationSchema>['body'];
type ListInvitationsQuery = z.infer<typeof listInvitationsSchema>['query'];
type InvitationIdParams = z.infer<typeof invitationIdParamSchema>['params'];
type InvitationDecisionParams = z.infer<
   typeof invitationDecisionSchema
>['params'];
type InvitationDecisionBody = z.infer<typeof invitationDecisionSchema>['body'];
type ConvertInvitationParams = z.infer<
   typeof convertInvitationSchema
>['params'];
type ConvertInvitationBody = z.infer<typeof convertInvitationSchema>['body'];

export const submitInvitation = async (req: Request, res: Response) => {
   const input = req.validatedBody as CreateInvitationBody;

   const invitation = await createInvitation(input, {
      createdById: req.session.userId!,
   });

   return res.status(201).json({
      success: true,
      message: 'Invitation created successfully',
      data: formatInvitationDetail(invitation),
   });
};

export const getInvitations = async (req: Request, res: Response) => {
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
   } = req.validatedQuery as ListInvitationsQuery;

   const { invitations, meta } = await listInvitations({
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
      data: invitations.map(formatInvitationSummary),
      pagination: meta,
   });
};

export const getInvitation = async (req: Request, res: Response) => {
   const { id } = req.validatedParams as InvitationIdParams;

   const invitation = await getInvitationById(id);

   return res.status(200).json({
      success: true,
      data: formatInvitationDetail(invitation),
   });
};

export const markInvitationArrived = async (req: Request, res: Response) => {
   const { id } = req.validatedParams as InvitationIdParams;

   const invitation = await recordInvitationArrival(id);

   return res.status(200).json({
      success: true,
      message: 'Arrival recorded successfully',
      data: formatInvitationDetail(invitation),
   });
};

export const convertInvitationHandler = async (req: Request, res: Response) => {
   const { id } = req.validatedParams as ConvertInvitationParams;
   const { visitors, scheduleDates, note } =
      req.validatedBody as ConvertInvitationBody;

   const invitation = await convertInvitation(
      id,
      visitors,
      scheduleDates,
      req.session.userId!,
      note,
   );

   return res.status(200).json({
      success: true,
      message: 'Invitation converted to a visit successfully',
      data: formatInvitationDetail(invitation),
   });
};

export const rejectInvitationHandler = async (req: Request, res: Response) => {
   const { id } = req.validatedParams as InvitationDecisionParams;
   const { note } = req.validatedBody as InvitationDecisionBody;

   const invitation = await rejectInvitation(id, req.session.userId!, note);

   return res.status(200).json({
      success: true,
      message: 'Invitation rejected successfully',
      data: formatInvitationDetail(invitation),
   });
};

export const cancelInvitationHandler = async (req: Request, res: Response) => {
   const { id } = req.validatedParams as InvitationDecisionParams;
   const { note } = req.validatedBody as InvitationDecisionBody;

   const invitation = await cancelInvitation(id, req.session.userId!, note);

   return res.status(200).json({
      success: true,
      message: 'Invitation cancelled successfully',
      data: formatInvitationDetail(invitation),
   });
};
