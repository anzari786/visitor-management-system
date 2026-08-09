import { z } from 'zod';
import { isValidEthiopianPhone } from '../phone';
import { ID_TYPE_OPTIONS } from '@/constants/visit';
import {
   HOST_EMPLOYEES,
   VISIT_PURPOSE_OPTIONS,
   VISIT_REQUEST_DEPARTMENTS,
   type VisitPurposeValue,
   type VisitRequestDepartmentId,
} from '@/constants/visit-request';
import { IdTypeValue } from '@/types/visit.types';
import { startOfDay } from 'date-fns';

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
   idType: z.enum(
      ID_TYPE_OPTIONS.map((o) => o.value) as [IdTypeValue, ...IdTypeValue[]],
      { message: 'ID type is required' },
   ),
   idNumber: z
      .string()
      .min(1, 'ID number is required')
      .max(50, 'ID number must be 50 characters or fewer'),
   organization: z
      .string()
      .max(100, 'Organization must be 100 characters or fewer')
      .optional()
      .transform((val) => {
         const trimmed = val?.trim();
         return trimmed ? trimmed : undefined;
      }),
});

const hostIds = HOST_EMPLOYEES.map((h) => h.id) as [string, ...string[]];

const departmentIds = VISIT_REQUEST_DEPARTMENTS.map((d) => d.id) as [
   VisitRequestDepartmentId,
   ...VisitRequestDepartmentId[],
];

const purposeValues = VISIT_PURPOSE_OPTIONS.map((o) => o.value) as [
   VisitPurposeValue,
   ...VisitPurposeValue[],
];

export const emptyVisitorValues: {
   firstName: string;
   lastName: string;
   email: string;
   phone: string;
   idType: undefined;
   idNumber: string;
   organization: string;
} = {
   firstName: '',
   lastName: '',
   email: '',
   phone: '+251 ',
   idType: undefined,
   idNumber: '',
   organization: '',
};

const visitDetailsFieldsSchema = z.object({
   hostId: z.enum(hostIds, { message: 'Please select a host employee' }),
   departmentId: z.enum(departmentIds, {
      message: 'Please select a department',
   }),
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

   const host = HOST_EMPLOYEES.find((h) => h.id === data.hostId);

   if (!host) {
      ctx.addIssue({
         code: 'custom',
         path: ['hostId'],
         message: 'Please select a valid host employee',
      });
      return;
   }

   if (!host.departmentId) {
      ctx.addIssue({
         code: 'custom',
         path: ['hostId'],
         message:
            'Selected host does not have a department assigned. Please choose another host.',
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

   if (host.departmentId !== data.departmentId) {
      const message =
         'The selected host is not part of the selected department. Please choose a valid host or update the department.';
      ctx.addIssue({ code: 'custom', path: ['hostId'], message });
      ctx.addIssue({ code: 'custom', path: ['departmentId'], message });
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

export const visitorsStepSchema = z.object({
   visitors: z
      .array(visitorSchema)
      .min(1, 'At least one visitor is required'),
});

export const visitDetailsSchema =
   visitDetailsFieldsSchema.superRefine(refineVisitDetails);

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
