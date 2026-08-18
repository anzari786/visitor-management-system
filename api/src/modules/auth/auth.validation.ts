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
            .min(8, 'Password must be at least 8 characters')
            .max(72, 'Password must be 72 characters or fewer'),
      })
      .refine((data) => data.currentPassword !== data.newPassword, {
         message: 'New password must be different from the current password',
         path: ['newPassword'],
      }),
});

export const forceChangePasswordSchema = z.object({
   body: z.object({
      newPassword: z
         .string()
         .min(8, 'Password must be at least 8 characters')
         .max(72, 'Password must be 72 characters or fewer'),
   }),
});

export const updateProfileSchema = z.object({
   body: z
      .object({
         firstName: z.string().trim().min(1).max(100).optional(),
         lastName: z.string().trim().min(1).max(100).optional(),
         username: z
            .string()
            .trim()
            .min(3)
            .max(50)
            .regex(
               /^[a-zA-Z0-9_]+$/,
               'Username may only contain letters, numbers, and underscores',
            )
            .optional(),
         phone: z.string().trim().min(7).max(30).nullable().optional(),
      })
      .refine((body) => Object.keys(body).length > 0, {
         message: 'At least one field must be provided',
      }),
});

export const checkUsernameSchema = z.object({
   query: z.object({
      username: z.string().trim().min(3).max(50),
   }),
});

export const meQuerySchema = z.object({
   query: z.object({
      includeRoles: z.enum(['true', 'false']).optional().default('true'),
   }),
});
