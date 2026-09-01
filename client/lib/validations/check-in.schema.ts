import { z } from 'zod';
import { isValidEthiopianPhone } from '../phone';
import { ID_TYPE_OPTIONS } from '@/constants/visit';
import { IdTypeValue } from '@/types/visit.types';

export const visitorInfoSchema = z.object({
   fullName: z
      .string()
      .min(1, 'validation.fullNameRequired')
      .max(100, 'validation.fullNameMax'),
   phone: z
      .string()
      .optional()
      .refine(
         (val) => {
            if (!val || val === '+251 ') return true;

            return isValidEthiopianPhone(val);
         },
         { message: 'validation.phoneInvalid' },
      ),
   idType: z.enum(
      ID_TYPE_OPTIONS.map((o) => o.value) as [IdTypeValue, ...IdTypeValue[]],
      { message: 'validation.idTypeRequired' },
   ),
   idNumber: z
      .string()
      .min(1, 'validation.idNumberRequired')
      .max(50, 'validation.idNumberMax'),
   host: z
      .string()
      .min(1, 'validation.hostNameRequired')
      .max(100, 'validation.hostNameMax'),
   departmentId: z.coerce.number().min(1, 'validation.departmentRequired').optional(),
});

export const badgeAssignmentSchema = z.object({
   badgeNumber: z
      .string()
      .length(3, 'validation.badgeExactly3')
      .regex(/^\d{3}$/, 'validation.badgeDigitsOnly'),
});

// Full schema — merge of both steps
export const checkInSchema = visitorInfoSchema.extend(
   badgeAssignmentSchema.shape,
);

export type VisitorInfoValues = z.output<typeof visitorInfoSchema>;
export type BadgeAssignmentValues = z.output<typeof badgeAssignmentSchema>;
export type CheckInFormInput = z.input<typeof checkInSchema>;
export type CheckInFormValues = z.output<typeof checkInSchema>;
