import { z } from 'zod';

export const publicBadgeLookupSchema = z.object({
   query: z.object({
      token: z
         .string()
         .trim()
         .min(1, 'Badge QR token is required')
         .max(512, 'Badge QR token is too long'),
   }),
});
