// TODO: Remove after SSO integration
import { z } from 'zod';

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
