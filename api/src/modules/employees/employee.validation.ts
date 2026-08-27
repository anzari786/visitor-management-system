import { z } from 'zod';

export const listEmployeesSchema = z.object({
   query: z.object({
      search: z.string().trim().min(1).optional(),
      departmentName: z.string().trim().min(1).optional(),
      isActive: z.enum(['true', 'false']).optional(),
      page: z.coerce.number().int().positive().optional().default(1),
      limit: z.coerce.number().int().positive().max(100).optional().default(20),
   }),
});

export const searchHostSchema = z.object({
   query: z.object({
      q: z.string().trim().min(1),
      limit: z.coerce.number().int().positive().max(25).optional().default(10),
   }),
});

export const employeeIdParamSchema = z.object({
   params: z.object({
      id: z.coerce.number().int().positive(),
   }),
});

export const listMyVisitsSchema = z.object({
   query: z.object({
      page: z.coerce.number().int().positive().optional().default(1),
      limit: z.coerce.number().int().positive().max(100).optional().default(20),
   }),
});

export const syncEmployeesSchema = z.object({
   body: z.object({
      employees: z
         .array(
            z.object({
               externalEmployeeId: z.string().trim().min(1),
               firstName: z.string().trim().min(1),
               lastName: z.string().trim().min(1),
               email: z.string().trim().email(),
               phone: z.string().trim().min(7).max(20).optional(),
               departmentName: z.string().trim().min(1),
               departmentCode: z.string().trim().min(1).optional(),
               position: z.string().trim().min(1).optional(),
            }),
         )
         .min(1)
         .max(500),
   }),
});
