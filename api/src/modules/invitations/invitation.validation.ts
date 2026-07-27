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

const invitationStatusSchema = z.enum([
   'SENT',
   'APPROVED',
   'REJECTED',
   'CANCELLED',
   'EXPIRED',
   'CONVERTED',
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

export const createInvitationSchema = z.object({
   body: z
      .object({
         groupType: groupTypeSchema,
         durationType: durationTypeSchema,
         purpose: z.string().trim().min(1).max(2000),
         hostEmployeeId: z.coerce.number().int().positive(),
         expectedVisitorCount: z.coerce
            .number()
            .int()
            .positive()
            .max(50)
            .default(1),
         organization: z.string().trim().min(1).max(150).optional(),
         plannedStartDate: z.coerce.date(),
         plannedEndDate: z.coerce.date(),
      })
      .refine((body) => body.plannedEndDate >= body.plannedStartDate, {
         message: 'plannedEndDate cannot be before plannedStartDate',
         path: ['plannedEndDate'],
      })
      .refine(
         (body) =>
            body.durationType === 'MULTI_DAY' ||
            body.plannedStartDate.toDateString() ===
               body.plannedEndDate.toDateString(),
         {
            message: 'A SINGLE_DAY invitation must plan a single date',
            path: ['plannedEndDate'],
         },
      ),
});

export const listInvitationsSchema = z.object({
   query: z.object({
      status: invitationStatusSchema.optional(),
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

export const invitationIdParamSchema = z.object({
   params: z.object({
      id: z.coerce.number().int().positive(),
   }),
});

export const invitationDecisionSchema = z.object({
   params: z.object({
      id: z.coerce.number().int().positive(),
   }),
   body: z.object({
      note: z.string().trim().max(1000).optional(),
   }),
});

export const convertInvitationSchema = z.object({
   params: z.object({
      id: z.coerce.number().int().positive(),
   }),
   body: z.object({
      visitors: z.array(visitorInputSchema).min(1).max(50),
      scheduleDates: z.array(scheduleDateInputSchema).min(1).max(31),
      note: z.string().trim().max(1000).optional(),
   }),
});
