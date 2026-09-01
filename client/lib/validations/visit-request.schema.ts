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
      .min(1, 'validation.firstNameRequired')
      .max(50, 'validation.firstNameMax'),
   lastName: z
      .string()
      .min(1, 'validation.lastNameRequired')
      .max(50, 'validation.lastNameMax'),
   email: z
      .string()
      .min(1, 'validation.emailRequired2')
      .email('validation.emailInvalid')
      .max(100, 'validation.emailMax100'),
   phone: z
      .string()
      .min(1, 'validation.phoneRequired')
      .refine((val) => isValidEthiopianPhone(val), {
         message: 'validation.phoneInvalid',
      }),
   organization: z
      .string()
      .max(100, 'validation.organizationMax')
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
   hostId: z.string().min(1, 'validation.selectHost'),
   hostName: z.string().optional(),
   departmentId: z.string().min(1, 'validation.selectDepartment'),
   departmentName: z.string().optional(),
   purpose: z.enum(purposeValues, {
      message: 'validation.selectPurpose',
   }),
   startDate: z.date({ error: 'validation.startDateRequired' }),
   endDate: z.date({ error: 'validation.endDateRequired' }),
   startTime: z.string().min(1, 'validation.startTimeRequired'),
   endTime: z.string().min(1, 'validation.endTimeRequired'),
});

function refineHostAndDepartment(
   data: { hostId?: string; departmentId?: string },
   ctx: z.RefinementCtx,
) {
   if (!data.hostId) {
      ctx.addIssue({
         code: 'custom',
         path: ['hostId'],
         message: 'validation.selectHost',
      });
      return;
   }

   if (!data.departmentId) {
      ctx.addIssue({
         code: 'custom',
         path: ['departmentId'],
         message: 'validation.selectDepartment',
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
            message: 'validation.endDateBeforeStart',
         });
      }
   }

   if (data.startTime && data.endTime && data.startTime >= data.endTime) {
      ctx.addIssue({
         code: 'custom',
         path: ['endTime'],
         message: 'validation.endTimeAfterStart',
      });
      ctx.addIssue({
         code: 'custom',
         path: ['startTime'],
         message: 'validation.startBeforeEnd',
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
         .min(1, 'validation.atLeastOneVisitor'),
   })
   .extend(visitDetailsFieldsSchema.shape)
   .superRefine(refineVisitDetails);

export type VisitorFormValues = z.output<typeof visitorSchema>;
export type VisitorFormInput = z.input<typeof visitorSchema>;

export type VisitRequestFormInput = z.input<typeof visitRequestSchema>;
export type VisitRequestFormValues = z.output<typeof visitRequestSchema>;
