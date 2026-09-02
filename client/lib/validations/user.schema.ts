import { z } from 'zod';
import { USER_ROLES } from '@/constants/user';

const firstNameSchema = z
   .string()
   .min(1, 'validation.firstNameRequired')
   .max(50, 'validation.firstNameMax');

const lastNameSchema = z
   .string()
   .min(1, 'validation.lastNameRequired')
   .max(50, 'validation.lastNameMax');

const usernameSchema = z
   .string()
   .min(3, 'validation.usernameMin')
   .max(30, 'validation.usernameMax30')
   .regex(
      /^[a-zA-Z0-9_]+$/,
      'validation.usernameChars',
   );

const emailSchema = z
   .string()
   .min(1, 'validation.emailRequired')
   .email('validation.emailInvalid')
   .max(255, 'validation.emailMax255');

export const createSsoUserSchema = z.object({
   employeeId: z.string().min(1, 'validation.selectEmployee'),
   role: z.enum(USER_ROLES, {
      message: 'validation.roleRequired',
   }),
});

export const createUserSchema = z.object({
   firstName: firstNameSchema,

   lastName: lastNameSchema,

   email: emailSchema,

   username: usernameSchema,

   role: z.enum(USER_ROLES, {
      message: 'validation.roleRequired',
   }),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;
export type CreateSsoUserFormValues = z.infer<typeof createSsoUserSchema>;
