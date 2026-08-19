import { z } from 'zod';

const roleNameSchema = z.enum(['GUARD', 'RECEPTION', 'ADMIN', 'MANAGER']);

const usernameSchema = z
   .string()
   .trim()
   .min(3)
   .max(50)
   .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username may only contain letters, numbers, and underscores',
   );

const passwordSchema = z
   .string()
   .min(8, 'Password must be at least 8 characters')
   .max(72, 'Password must be 72 characters or fewer');

export const createUserSchema = z.object({
   body: z
      .object({
         firstName: z.string().trim().min(1).max(100),
         lastName: z.string().trim().min(1).max(100),
         email: z.string().trim().email().optional(),
         phone: z.string().trim().min(7).max(30).optional(),
         username: usernameSchema.optional(),
         password: passwordSchema.optional(),
         externalSubject: z.string().trim().min(1).max(255).optional(),
         employeeId: z.coerce.number().int().positive().optional(),
         roles: z.array(roleNameSchema).max(4).optional(),
      })
      .superRefine((body, ctx) => {
         const hasUsername = Boolean(body.username);
         const hasPassword = Boolean(body.password);

         if (hasUsername !== hasPassword) {
            ctx.addIssue({
               code: 'custom',
               message: 'Local accounts require both username and password',
               path: hasUsername ? ['password'] : ['username'],
            });
         }

         if (hasPassword && (!body.roles || body.roles.length === 0)) {
            ctx.addIssue({
               code: 'custom',
               message: 'Local accounts require at least one role',
               path: ['roles'],
            });
         }

         if (!hasUsername && !body.externalSubject) {
            ctx.addIssue({
               code: 'custom',
               message:
                  'Provide local credentials (username and password) or an SSO subject',
               path: ['username'],
            });
         }
      }),
});

export const listUsersSchema = z.object({
   query: z.object({
      search: z.string().trim().min(1).optional(),
      isActive: z.enum(['true', 'false']).optional(),
      role: roleNameSchema.optional(),
      page: z.coerce.number().int().positive().optional().default(1),
      limit: z.coerce.number().int().positive().max(100).optional().default(20),
   }),
});

export const userIdParamSchema = z.object({
   params: z.object({
      id: z.coerce.number().int().positive(),
   }),
});

export const updateUserSchema = z.object({
   params: z.object({
      id: z.coerce.number().int().positive(),
   }),
   body: z
      .object({
         firstName: z.string().trim().min(1).max(100).optional(),
         lastName: z.string().trim().min(1).max(100).optional(),
         email: z.string().trim().email().nullable().optional(),
         phone: z.string().trim().min(7).max(30).nullable().optional(),
         employeeId: z.coerce.number().int().positive().nullable().optional(),
         isActive: z.boolean().optional(),
      })
      .refine((body) => Object.keys(body).length > 0, {
         message: 'At least one field must be provided',
      }),
});

export const assignRoleSchema = z.object({
   params: z.object({
      id: z.coerce.number().int().positive(),
   }),
   body: z.object({
      role: roleNameSchema,
   }),
});

export const removeRoleParamSchema = z.object({
   params: z.object({
      id: z.coerce.number().int().positive(),
      role: roleNameSchema,
   }),
});

export const resetPasswordParamSchema = z.object({
   params: z.object({
      id: z.coerce.number().int().positive(),
   }),
});
