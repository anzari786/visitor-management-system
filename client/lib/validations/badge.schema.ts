import { z } from 'zod';

export const createBadgeSchema = z.object({
   badgeNumber: z
      .string()
      .trim()
      .min(1, 'Badge number is required')
      .max(32, 'Badge number must be 32 characters or fewer')
      .regex(
         /^[A-Za-z0-9\-]+$/,
         'Badge number may only contain letters, numbers, and hyphens',
      ),
});

export type CreateBadgeFormValues = z.infer<typeof createBadgeSchema>;
