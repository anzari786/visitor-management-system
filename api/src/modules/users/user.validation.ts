import { z } from 'zod';

const roleNameSchema = z.enum(['GUARD', 'RECEPTION', 'ADMIN', 'MANAGER']);
const rolesSchema = z.array(roleNameSchema).min(1).max(4);
const authProviderSchema = z.enum(['SSO', 'LOCAL']);

const createSsoUserBodySchema = z
   .object({
      authProvider: z.literal('SSO'),
      employeeId: z.coerce.number().int().positive(),
      roles: rolesSchema,
   })
   .strict();

const createLocalUserBodySchema = z
   .object({
      authProvider: z.literal('LOCAL'),
      firstName: z.string().trim().min(1).max(100),
      lastName: z.string().trim().min(1).max(100),
      email: z.string().trim().email().optional(),
      phone: z.string().trim().min(7).max(30).optional(),
      username: z.string().trim().min(3).max(50),
      roles: rolesSchema,
   })
   .strict();

export const createUserSchema = z.object({
   body: z.discriminatedUnion('authProvider', [
      createSsoUserBodySchema,
      createLocalUserBodySchema,
   ]),
});

export const listUsersSchema = z.object({
   query: z.object({
      search: z.string().trim().min(1).optional(),
      isActive: z.enum(['true', 'false']).optional(),
      role: roleNameSchema.optional(),
      authProvider: authProviderSchema.optional(),
      passwordSetupPending: z.enum(['true', 'false']).optional(),
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
         isActive: z.boolean().optional(),
      })
      .strict()
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

export const passwordSetupSchema = z.object({
   params: z.object({
      id: z.coerce.number().int().positive(),
   }),
});
