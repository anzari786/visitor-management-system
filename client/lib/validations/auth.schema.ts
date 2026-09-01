import { z } from 'zod';
import { passwordSchema } from './profile.schema';

export const loginSchema = z.object({
   username: z
      .string()
      .min(3, 'validation.usernameMin')
      .max(50, 'validation.usernameMax50'),

   password: z.string().min(1, 'validation.passwordRequired'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const forceChangePasswordSchema = z
   .object({
      newPassword: passwordSchema,

      confirmPassword: z.string().min(1, 'validation.confirmNewPassword'),
   })
   .refine((data) => data.newPassword === data.confirmPassword, {
      path: ['confirmPassword'],
      message: 'validation.passwordsMismatch',
   });

export type ForceChangePasswordFormValues = z.infer<
   typeof forceChangePasswordSchema
>;
