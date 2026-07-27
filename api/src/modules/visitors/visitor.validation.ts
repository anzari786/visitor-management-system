import { z } from 'zod';

const identificationTypeSchema = z.enum([
   'NATIONAL_ID',
   'PASSPORT',
   'DRIVERS_LICENSE',
   'KEBELE_ID',
   'OTHER',
]);

export const listVisitorsSchema = z.object({
   query: z.object({
      search: z.string().trim().min(1).optional(), // matches first/last name
      phone: z.string().trim().min(3).optional(),
      idNumber: z.string().trim().min(1).optional(),
      page: z.coerce.number().int().positive().optional().default(1),
      limit: z.coerce.number().int().positive().max(100).optional().default(20),
   }),
});

export const visitorIdParamSchema = z.object({
   params: z.object({
      id: z.coerce.number().int().positive(),
   }),
});

export const createVisitorSchema = z.object({
   body: z.object({
      firstName: z.string().trim().min(1).max(100),
      lastName: z.string().trim().min(1).max(100),
      phone: z.string().trim().min(7).max(20),
      email: z.string().trim().email().optional(),
      organization: z.string().trim().min(1).max(150).optional(),
      idType: identificationTypeSchema,
      idNumber: z.string().trim().min(1).max(50),
   }),
});

export const updateVisitorSchema = z.object({
   params: z.object({
      id: z.coerce.number().int().positive(),
   }),
   body: z
      .object({
         firstName: z.string().trim().min(1).max(100).optional(),
         lastName: z.string().trim().min(1).max(100).optional(),
         phone: z.string().trim().min(7).max(20).optional(),
         email: z.string().trim().email().optional(),
         organization: z.string().trim().min(1).max(150).optional(),
      })
      .refine((body) => Object.keys(body).length > 0, {
         message: 'At least one field must be provided',
      }),
});

export const visitorHistoryQuerySchema = z.object({
   params: z.object({
      id: z.coerce.number().int().positive(),
   }),
   query: z.object({
      page: z.coerce.number().int().positive().optional().default(1),
      limit: z.coerce.number().int().positive().max(100).optional().default(20),
   }),
});
