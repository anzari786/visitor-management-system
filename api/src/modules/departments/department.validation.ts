import { z } from 'zod';

export const listDepartmentsSchema = z.object({
   query: z.object({
      search: z.string().trim().min(1).optional(),
      activeOnly: z
         .enum(['true', 'false'])
         .optional()
         .transform((value) => value === 'true'),
      page: z.coerce.number().int().positive().optional().default(1),
      limit: z.coerce.number().int().positive().max(100).optional().default(20),
   }),
});

export const syncDepartmentsSchema = z.object({
   body: z.object({
      departments: z
         .array(
            z.object({
               externalDepartmentId: z.string().trim().min(1),
               name: z.string().trim().min(1),
               code: z.string().trim().min(1).optional(),
            }),
         )
         .min(1)
         .max(500),
   }),
});