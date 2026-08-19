import { z } from 'zod';

const badgeStatusSchema = z.enum([
   'AVAILABLE',
   'ASSIGNED',
   'LOST',
   'DISABLED',
]);

export const createBadgeSchema = z.object({
   body: z.object({
      badgeNumber: z.string().trim().min(1).max(50),
      notes: z.string().trim().max(500).optional(),
   }),
});

export const listBadgesSchema = z.object({
   query: z.object({
      status: badgeStatusSchema.optional(),
      badgeNumber: z.string().trim().min(1).max(50).optional(),
      page: z.coerce.number().int().positive().optional().default(1),
      limit: z.coerce.number().int().positive().max(100).optional().default(20),
   }),
});

export const badgeIdParamSchema = z.object({
   params: z.object({
      id: z.coerce.number().int().positive(),
   }),
});

export const updateBadgeSchema = z.object({
   params: z.object({
      id: z.coerce.number().int().positive(),
   }),
   body: z
      .object({
         notes: z.string().trim().max(500).optional(),
      })
      .refine((body) => Object.keys(body).length > 0, {
         message: 'At least one field must be provided',
      }),
});

export const badgeActionSchema = z.object({
   params: z.object({
      id: z.coerce.number().int().positive(),
   }),
   body: z.object({
      note: z.string().trim().max(1000).optional(),
   }),
});
