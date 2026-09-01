import { z } from 'zod';
import { isValidEthiopianPhone } from '@/lib/phone';
import {
   VISIT_PURPOSE_OPTIONS,
   type VisitPurposeValue,
} from '@/constants/visit-purpose';
import {
   FLOOR_OPTIONS,
   type FloorOption,
} from '@/constants/visit-location';
import { startOfDay } from 'date-fns';

const purposeValues = VISIT_PURPOSE_OPTIONS.map((o) => o.value) as [
   VisitPurposeValue,
   ...VisitPurposeValue[],
];

const floorValues = FLOOR_OPTIONS as unknown as [
   FloorOption,
   ...FloorOption[],
];

/**
 * Known visitor contact details collected when the host selects
 * "Yes, I know the visitor(s)".
 */
export const invitationVisitorSchema = z.object({
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

const invitationVisitorInputSchema = z.object({
   firstName: z.string(),
   lastName: z.string(),
   email: z.string(),
   phone: z.string(),
   organization: z.string().optional(),
});

/**
 * Invitation created by a logged-in host for external visitor(s).
 * Host identity comes from the authenticated session — not from this form.
 *
 * knowsVisitorInfo:
 * - "yes" → collect one or more known visitor contact details
 * - "no"  → unknown identity; require visitor count only
 */
const baseInvitationSchema = z.object({
   knowsVisitorInfo: z.enum(['yes', 'no']),
   scheduleType: z.enum(['single_day', 'multi_day']),
   purpose: z.enum(purposeValues, {
      message: 'validation.selectPurpose',
   }),
   visitors: z.array(invitationVisitorInputSchema).default([]),
   visitorCount: z.coerce
      .number()
      .int('validation.visitorCountInt')
      .min(1, 'validation.visitorCountMin')
      .max(50, 'validation.visitorCountMax')
      .default(1),
   visitorOrganization: z
      .string()
      .trim()
      .max(150, 'validation.organizationMax150')
      .optional()
      .transform((val) => (val?.trim() ? val.trim() : undefined)),
   visitDate: z.date().optional(),
   startDate: z.date().optional(),
   endDate: z.date().optional(),
   startTime: z.string().min(1, 'validation.startTimeRequired'),
   endTime: z.string().min(1, 'validation.endTimeRequired'),
   floor: z.enum(floorValues, {
      message: 'validation.selectFloor',
   }),
   room: z
      .string()
      .trim()
      .min(1, 'validation.roomRequired')
      .max(100, 'validation.roomMax'),
});

export const hostInvitationSchema = baseInvitationSchema.superRefine(
   (data, ctx) => {
      if (data.knowsVisitorInfo === 'yes') {
         if (!data.visitors.length) {
            ctx.addIssue({
               code: 'custom',
               path: ['visitors'],
               message: 'validation.atLeastOneVisitor',
            });
         } else {
            data.visitors.forEach((visitor, index) => {
               const result = invitationVisitorSchema.safeParse(visitor);
               if (!result.success) {
                  result.error.issues.forEach((issue) => {
                     ctx.addIssue({
                        ...issue,
                        path: ['visitors', index, ...issue.path],
                     });
                  });
               }
            });
         }
      }

      if (data.knowsVisitorInfo === 'no') {
         if (!data.visitorCount) {
            ctx.addIssue({
               code: 'custom',
               path: ['visitorCount'],
               message: 'validation.visitorCountRequired',
            });
         }
      }

      if (data.scheduleType === 'single_day') {
         if (!data.visitDate) {
            ctx.addIssue({
               code: 'custom',
               path: ['visitDate'],
               message: 'validation.visitDateRequired',
            });
         }
      }

      if (data.scheduleType === 'multi_day') {
         if (!data.startDate) {
            ctx.addIssue({
               code: 'custom',
               path: ['startDate'],
               message: 'validation.startDateRequired',
            });
         }
         if (!data.endDate) {
            ctx.addIssue({
               code: 'custom',
               path: ['endDate'],
               message: 'validation.endDateRequired',
            });
         }
         if (
            data.startDate &&
            data.endDate &&
            startOfDay(data.endDate) < startOfDay(data.startDate)
         ) {
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
            message: 'validation.endTimeBeforeStart',
         });
         ctx.addIssue({
            code: 'custom',
            path: ['startTime'],
            message: 'validation.startBeforeEnd',
         });
      }
   },
);

export type InvitationVisitorInput = z.input<typeof invitationVisitorSchema>;
export type InvitationVisitorValues = z.output<typeof invitationVisitorSchema>;
export type HostInvitationFormInput = z.input<typeof hostInvitationSchema>;
export type HostInvitationFormValues = z.output<typeof hostInvitationSchema>;

export const emptyInvitationVisitorValues: InvitationVisitorInput = {
   firstName: '',
   lastName: '',
   email: '',
   phone: '+251 ',
   organization: '',
};

export const hostInvitationDefaultValues = {
   knowsVisitorInfo: 'yes' as const,
   scheduleType: 'single_day' as const,
   purpose: undefined as HostInvitationFormValues['purpose'] | undefined,
   visitors: [{ ...emptyInvitationVisitorValues }],
   visitorCount: 1,
   visitorOrganization: '',
   visitDate: undefined as Date | undefined,
   startDate: undefined as Date | undefined,
   endDate: undefined as Date | undefined,
   startTime: '',
   endTime: '',
   floor: undefined as FloorOption | undefined,
   room: '',
};
