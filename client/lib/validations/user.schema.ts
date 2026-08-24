import { z } from 'zod';
import { USER_ROLES } from '@/constants/user';

const firstNameSchema = z
   .string()
   .min(1, 'First name is required')
   .max(50, 'First name must be 50 characters or fewer');

const lastNameSchema = z
   .string()
   .min(1, 'Last name is required')
   .max(50, 'Last name must be 50 characters or fewer');

const usernameSchema = z
   .string()
   .min(3, 'Username must be at least 3 characters')
   .max(30, 'Username must be 30 characters or fewer')
   .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username may only contain letters, numbers, and underscores',
   );

const emailSchema = z
   .string()
   .min(1, 'Email address is required')
   .email('Enter a valid email address')
   .max(255, 'Email must be 255 characters or fewer');

export const createSsoUserSchema = z.object({
   employeeId: z.string().min(1, 'Please select an employee'),
   role: z.enum(USER_ROLES, {
      message: 'Role is required',
   }),
});

export const createUserSchema = z.object({
   firstName: firstNameSchema,

   lastName: lastNameSchema,

   email: emailSchema,

   username: usernameSchema,

   role: z.enum(USER_ROLES, {
      message: 'Role is required',
   }),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;
export type CreateSsoUserFormValues = z.infer<typeof createSsoUserSchema>;
