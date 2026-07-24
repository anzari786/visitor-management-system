import { z } from 'zod';

export const ssoCallbackSchema = z.object({
   body: z.object({
      code: z.string().trim().min(1),
      redirectUri: z.string().trim().url(),
   }),
});

export const meQuerySchema = z.object({
   query: z.object({
      includeRoles: z.enum(['true', 'false']).optional().default('true'),
   }),
});
