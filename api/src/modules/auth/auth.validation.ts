import { z } from 'zod';

export const ssoCallbackSchema = z.object({
   body: z.object({
      code: z.string().trim().min(1),
      redirectUri: z.string().trim().url(),
   }),
});

export const localLoginSchema = z.object({
   body: z.object({
      username: z.string().trim().min(1),
      password: z.string().min(1),
   }),
});

export const changePasswordSchema = z.object({
   body: z
      .object({
         currentPassword: z.string().min(1),
         newPassword: z
            .string()
            .min(8, 'Password must be at least 8 characters'),
      })
      .refine((data) => data.currentPassword !== data.newPassword, {
         message: 'New password must be different from the current password',
         path: ['newPassword'],
      }),
});

export const meQuerySchema = z.object({
   query: z.object({
      includeRoles: z.enum(['true', 'false']).optional().default('true'),
   }),
});
