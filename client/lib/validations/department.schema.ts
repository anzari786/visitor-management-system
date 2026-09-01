import { z } from 'zod';

export const createDepartmentSchema = z.object({
   name: z
      .string()
      .min(2, 'validation.departmentNameRequired')
      .max(100, 'validation.departmentNameMax'),
   shortName: z
      .string()
      .trim()
      .max(10, 'validation.shortNameMax')
      .regex(
         /^[A-Za-z0-9&/().,\- ]*$/,
         'validation.shortNameChars',
      )
      .optional(),
   color: z
      .string()
      .trim()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'validation.hexColor'),
});

export type CreateDepartmentFormValues = z.infer<typeof createDepartmentSchema>;
