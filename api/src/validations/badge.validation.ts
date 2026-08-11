import { z } from 'zod';

export const createBadgeSchema = z.object({
   body: z.object({
      badgeNumber: z
         .string()
         .trim()
         .min(1, 'Badge number is required')
         .max(32, 'Badge number must be 32 characters or fewer')
         .regex(
            /^[A-Za-z0-9\-]+$/,
            'Badge number may only contain letters, numbers, and hyphens',
         ),
      qrToken: z
         .string()
         .trim()
         .min(1, 'Badge QR code is required')
         .max(256, 'Badge QR code must be 256 characters or fewer'),
      notes: z.string().trim().max(500).optional(),
   }),
});

export const listBadgesSchema = z.object({
   query: z.object({
      status: z
         .enum(['available', 'assigned', 'lost', 'inactive'])
         .optional(),
      badgeNumber: z.string().trim().min(1).max(32).optional(),
      page: z.coerce.number().int().positive().optional().default(1),
      limit: z.coerce.number().int().positive().max(100).optional().default(20),
   }),
});

export const badgeIdParamSchema = z.object({
   params: z.object({
      id: z.coerce.number().int().positive(),
   }),
});

export const badgeStatusActionSchema = z.object({
   params: z.object({
      id: z.coerce.number().int().positive(),
   }),
   body: z.object({
      reason: z.string().trim().max(1000).optional(),
   }),
});

export type CreateBadgeBody = z.infer<typeof createBadgeSchema>['body'];
