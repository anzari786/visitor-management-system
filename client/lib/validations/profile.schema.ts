import { z } from 'zod';
import { isValidEthiopianPhone } from '../phone';

export function splitFullName(fullName: string) {
   const parts = fullName.trim().split(/\s+/).filter(Boolean);
   return {
      firstName: parts[0] ?? '',
      lastName: parts.slice(1).join(' '),
   };
}

export const profileSchema = z.object({
   fullName: z
      .string()
      .trim()
      .min(1, 'validation.fullNameRequired')
      .refine((value) => value.split(/\s+/).filter(Boolean).length >= 2, {
         message: 'validation.enterFullName',
      })
      .refine(
         (value) => {
            const { firstName, lastName } = splitFullName(value);
            return firstName.length <= 50 && lastName.length <= 50;
         },
         { message: 'validation.namePartMax' },
      ),
   username: z
      .string()
      .min(3, 'validation.usernameMin')
      .max(50, 'validation.usernameMax50')
      .regex(
         /^[a-zA-Z0-9_]+$/,
         'validation.usernameChars',
      ),
   phone: z
      .string()
      .optional()
      .refine(
         (val) => {
            if (!val || val === '+251 ') return true;

            return isValidEthiopianPhone(val);
         },
         { message: 'validation.phoneInvalid' },
      ),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export const passwordSchema = z
   .string()
   .min(8, 'validation.passwordMin')
   .max(72, 'validation.passwordMax')
   .regex(/[A-Z]/, 'validation.passwordUppercase')
   .regex(/[0-9]/, 'validation.passwordNumber');

export const changePasswordSchema = z
   .object({
      currentPassword: z.string().min(1, 'validation.currentPasswordRequired'),

      newPassword: passwordSchema,

      confirmPassword: z.string().min(1, 'validation.confirmNewPassword'),
   })
   .refine((data) => data.newPassword === data.confirmPassword, {
      path: ['confirmPassword'],
      message: 'validation.passwordsMismatch',
   })
   .refine((data) => data.newPassword !== data.currentPassword, {
      path: ['newPassword'],
      message: 'validation.newPasswordDifferent',
   });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
