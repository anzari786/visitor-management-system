import { z } from 'zod';

export const createUserSchema = z.object({
   body: z.object({
      externalSubject: z.string().trim().min(1).max(255),
      employeeId: z.coerce.number().int().positive().optional(),
      roleCodes: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
   }),
});

export const listUsersSchema = z.object({
   query: z.object({
      search: z.string().trim().min(1).optional(), // matches linked employee's name/email
      isActive: z.enum(['true', 'false']).optional(),
      roleCode: z.string().trim().min(1).optional(),
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
      roleCode: z.string().trim().min(1).max(50),
   }),
});

export const removeRoleParamSchema = z.object({
   params: z.object({
      id: z.coerce.number().int().positive(),
      roleCode: z.string().trim().min(1).max(50),
   }),
});
