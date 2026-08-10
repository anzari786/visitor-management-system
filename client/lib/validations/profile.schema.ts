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
      .min(1, 'Full name is required')
      .refine((value) => value.split(/\s+/).filter(Boolean).length >= 2, {
         message: 'Enter your first and last name',
      })
      .refine(
         (value) => {
            const { firstName, lastName } = splitFullName(value);
            return firstName.length <= 50 && lastName.length <= 50;
         },
         { message: 'Name must be 50 characters or fewer per part' },
      ),
   username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username must be 50 characters or fewer')
      .regex(
         /^[a-zA-Z0-9_]+$/,
         'Username may only contain letters, numbers, and underscores',
      ),
   phone: z
      .string()
      .optional()
      .refine(
         (val) => {
            if (!val || val === '+251 ') return true;

            return isValidEthiopianPhone(val);
         },
         { message: 'Enter a valid Ethiopian phone number' },
      ),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export const passwordSchema = z
   .string()
   .min(8, 'Password must be at least 8 characters')
   .max(72, 'Password must be 72 characters or fewer')
   .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
   .regex(/[0-9]/, 'Password must contain at least one number');

export const changePasswordSchema = z
   .object({
      currentPassword: z.string().min(1, 'Current password is required'),

      newPassword: passwordSchema,

      confirmPassword: z.string().min(1, 'Please confirm your new password'),
   })
   .refine((data) => data.newPassword === data.confirmPassword, {
      path: ['confirmPassword'],
      message: 'Passwords do not match',
   })
   .refine((data) => data.newPassword !== data.currentPassword, {
      path: ['newPassword'],
      message: 'New password must be different from your current password',
   });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
