import { z } from 'zod';

const roleNameSchema = z.enum(['GUARD', 'RECEPTION', 'ADMIN', 'MANAGER']);

export const createUserSchema = z.object({
   body: z.object({
      firstName: z.string().trim().min(1).max(100),
      lastName: z.string().trim().min(1).max(100),
      email: z.string().trim().email().optional(),
      phone: z.string().trim().min(7).max(30).optional(),
      username: z.string().trim().min(3).max(50).optional(),
      externalSubject: z.string().trim().min(1).max(255).optional(),
      employeeId: z.coerce.number().int().positive().optional(),
      roles: z.array(roleNameSchema).max(4).optional(),
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
