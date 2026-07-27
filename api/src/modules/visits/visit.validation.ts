import { z } from 'zod';

const groupTypeSchema = z.enum(['SINGLE', 'GROUP']);
const durationTypeSchema = z.enum(['SINGLE_DAY', 'MULTI_DAY']);

const identificationTypeSchema = z.enum([
   'NATIONAL_ID',
   'PASSPORT',
   'DRIVERS_LICENSE',
   'KEBELE_ID',
   'OTHER',
]);

const visitStatusSchema = z.enum([
   'PENDING_APPROVAL',
   'APPROVED',
   'REJECTED',
   'RESCHEDULED',
   'COMPLETED',
   'CANCELLED',
   'EXPIRED',
]);

const visitorInputSchema = z.object({
   firstName: z.string().trim().min(1).max(100),
   lastName: z.string().trim().min(1).max(100),
   phone: z.string().trim().min(7).max(20),
   email: z.string().trim().email().optional(),
   organization: z.string().trim().min(1).max(150).optional(),
   idType: identificationTypeSchema,
   idNumber: z.string().trim().min(1).max(50),
});

const scheduleDateInputSchema = z.object({
   date: z.coerce.date(),
   expectedStartTime: z.coerce.date().optional(),
   expectedEndTime: z.coerce.date().optional(),
});

const visitRequestBodySchema = z
   .object({
      groupType: groupTypeSchema,
      durationType: durationTypeSchema,
      purpose: z.string().trim().min(1).max(2000),
      hostEmployeeId: z.coerce.number().int().positive(),
      visitors: z.array(visitorInputSchema).min(1).max(50),
      scheduleDates: z.array(scheduleDateInputSchema).min(1).max(31),
   })
   .refine((body) => body.groupType === 'GROUP' || body.visitors.length === 1, {
      message: 'A SINGLE visit must have exactly one visitor',
      path: ['visitors'],
   })
   .refine(
      (body) =>
         body.durationType === 'MULTI_DAY' || body.scheduleDates.length === 1,
      {
         message: 'A SINGLE_DAY visit must have exactly one scheduled date',
         path: ['scheduleDates'],
      },
   );

/** Public self-service visitor request — same shape as the walk-in path. */
export const createVisitRequestSchema = z.object({
   body: visitRequestBodySchema,
});

/** Guard-assisted registration — same body shape, different actor/meta. */
export const createWalkInVisitSchema = z.object({
   body: visitRequestBodySchema,
});

export const listVisitsSchema = z.object({
   query: z.object({
      status: visitStatusSchema.optional(),
      hostEmployeeId: z.coerce.number().int().positive().optional(),
      durationType: durationTypeSchema.optional(),
      groupType: groupTypeSchema.optional(),
      search: z.string().trim().min(1).optional(),
      dateFrom: z.coerce.date().optional(),
      dateTo: z.coerce.date().optional(),
      page: z.coerce.number().int().positive().optional().default(1),
      limit: z.coerce.number().int().positive().max(100).optional().default(20),
   }),
});

export const visitIdParamSchema = z.object({
   params: z.object({
      id: z.coerce.number().int().positive(),
   }),
});

export const visitDecisionSchema = z.object({
   params: z.object({
      id: z.coerce.number().int().positive(),
   }),
   body: z.object({
      note: z.string().trim().max(1000).optional(),
   }),
});

export const rescheduleVisitSchema = z.object({
   params: z.object({
      id: z.coerce.number().int().positive(),
   }),
   body: z.object({
      scheduleDates: z.array(scheduleDateInputSchema).min(1).max(31),
      note: z.string().trim().max(1000).optional(),
   }),
});
