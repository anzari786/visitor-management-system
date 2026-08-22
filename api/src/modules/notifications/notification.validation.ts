import { z } from 'zod';

const notificationTypeSchema = z.enum([
   'VISIT_SUBMITTED',
   'VISIT_APPROVAL_REQUEST',
   'VISIT_APPROVED',
   'VISIT_REJECTED',
   'VISIT_RESCHEDULED',
   'VISIT_CANCELLED',
   'VISITOR_ARRIVED',
   'VISITOR_CHECKED_OUT',
   'OVERDUE_VISIT',
   'INVITATION_SENT',
   'VISITOR_REGISTERED',
]);

const notificationChannelSchema = z.enum(['EMAIL', 'DASHBOARD']);

export const listNotificationsSchema = z.object({
   query: z.object({
      isRead: z.enum(['true', 'false']).optional(),
      type: notificationTypeSchema.optional(),
      channel: notificationChannelSchema.optional(),
      page: z.coerce.number().int().positive().optional().default(1),
      limit: z.coerce.number().int().positive().max(100).optional().default(20),
   }),
});

export const notificationIdParamSchema = z.object({
   params: z.object({
      id: z.coerce.number().int().positive(),
   }),
});
