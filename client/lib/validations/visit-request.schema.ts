import {
   VISIT_PURPOSE_OPTIONS,
   type VisitPurposeValue,
} from '@/constants/visit-request';
import { startOfDay } from 'date-fns';
import { z } from 'zod';
import { isValidEthiopianPhone } from '../phone';

export const visitorSchema = z.object({
   firstName: z
      .string()
      .min(1, 'First name is required')
      .max(50, 'First name must be 50 characters or fewer'),
   lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(50, 'Last name must be 50 characters or fewer'),
   email: z
      .string()
      .min(1, 'Email is required')
      .email('Enter a valid email address')
      .max(100, 'Email must be 100 characters or fewer'),
   phone: z
      .string()
      .min(1, 'Phone number is required')
      .refine((val) => isValidEthiopianPhone(val), {
         message: 'Enter a valid Ethiopian phone number',
      }),
   organization: z
      .string()
      .max(100, 'Organization must be 100 characters or fewer')
      .optional()
      .transform((val) => {
         const trimmed = val?.trim();
         return trimmed ? trimmed : undefined;
      }),
});

const purposeValues = VISIT_PURPOSE_OPTIONS.map((o) => o.value) as [
   VisitPurposeValue,
   ...VisitPurposeValue[],
];

export const emptyVisitorValues: {
   firstName: string;
   lastName: string;
   email: string;
   phone: string;
   organization: string;
} = {
   firstName: '',
   lastName: '',
   email: '',
   phone: '+251 ',
   organization: '',
};

const visitDetailsFieldsSchema = z.object({
   hostId: z.string().min(1, 'Please select a host employee'),
   hostName: z.string().optional(),
   departmentId: z.string().min(1, 'Please select a department'),
   departmentName: z.string().optional(),
   purpose: z.enum(purposeValues, {
      message: 'Please select a visit purpose',
   }),
   startDate: z.date({ error: 'Start date is required' }),
   endDate: z.date({ error: 'End date is required' }),
   startTime: z.string().min(1, 'Start time is required'),
   endTime: z.string().min(1, 'End time is required'),
});

function refineHostAndDepartment(
   data: { hostId?: string; departmentId?: string },
   ctx: z.RefinementCtx,
) {
   if (!data.hostId) {
      ctx.addIssue({
         code: 'custom',
         path: ['hostId'],
         message: 'Please select a host employee',
      });
      return;
   }

   if (!data.departmentId) {
      ctx.addIssue({
         code: 'custom',
         path: ['departmentId'],
         message: 'Please select a department',
      });
      return;
   }
}

function refineVisitSchedule(
   data: {
      startDate?: Date;
      endDate?: Date;
      startTime: string;
      endTime: string;
   },
   ctx: z.RefinementCtx,
) {
   if (data.startDate && data.endDate) {
      if (startOfDay(data.endDate) < startOfDay(data.startDate)) {
         ctx.addIssue({
            code: 'custom',
            path: ['endDate'],
            message: 'End date cannot be before start date',
         });
      }
   }

   if (data.startTime && data.endTime && data.startTime >= data.endTime) {
      ctx.addIssue({
         code: 'custom',
         path: ['endTime'],
         message: 'End time must be after start time',
      });
      ctx.addIssue({
         code: 'custom',
         path: ['startTime'],
         message: 'Start time must be before end time',
      });
   }
}

function refineVisitDetails(
   data: {
      hostId?: string;
      departmentId?: string;
      startDate?: Date;
      endDate?: Date;
      startTime: string;
      endTime: string;
   },
   ctx: z.RefinementCtx,
) {
   refineHostAndDepartment(data, ctx);
   refineVisitSchedule(data, ctx);
}

export const visitRequestSchema = z
   .object({
      visitors: z
         .array(visitorSchema)
         .min(1, 'At least one visitor is required'),
   })
   .extend(visitDetailsFieldsSchema.shape)
   .superRefine(refineVisitDetails);

export type VisitorFormValues = z.output<typeof visitorSchema>;
export type VisitorFormInput = z.input<typeof visitorSchema>;

export type VisitRequestFormInput = z.input<typeof visitRequestSchema>;
export type VisitRequestFormValues = z.output<typeof visitRequestSchema>;
