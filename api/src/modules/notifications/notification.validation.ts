import { z } from 'zod';

const notificationTypeSchema = z.enum([
   'VISIT_SUBMITTED',
   'VISIT_APPROVED',
   'VISIT_REJECTED',
   'VISIT_RESCHEDULED',
   'VISITOR_CHECKED_IN',
   'VISITOR_CHECKED_OUT',
   'OVERDUE_CHECKOUT',
   'INVITATION_SENT',
   'INVITATION_APPROVED',
   'INVITATION_REJECTED',
   'INVITATION_CANCELLED',
   'INVITATION_EXPIRED',
   'INVITATION_CONVERTED',
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
