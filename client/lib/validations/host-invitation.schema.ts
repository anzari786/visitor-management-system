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
      message: 'Please select a visit purpose',
   }),
   visitors: z.array(invitationVisitorInputSchema).default([]),
   visitorCount: z.coerce
      .number()
      .int('Visitor count must be a whole number')
      .min(1, 'Visitor count must be at least 1')
      .max(50, 'Visitor count must be 50 or fewer')
      .default(1),
   visitorOrganization: z
      .string()
      .trim()
      .max(150, 'Organization must be 150 characters or fewer')
      .optional()
      .transform((val) => (val?.trim() ? val.trim() : undefined)),
   visitDate: z.date().optional(),
   startDate: z.date().optional(),
   endDate: z.date().optional(),
   startTime: z.string().min(1, 'Start time is required'),
   endTime: z.string().min(1, 'End time is required'),
   floor: z.enum(floorValues, {
      message: 'Please select a floor',
   }),
   room: z
      .string()
      .trim()
      .min(1, 'Room is required')
      .max(100, 'Room must be 100 characters or fewer'),
});

export const hostInvitationSchema = baseInvitationSchema.superRefine(
   (data, ctx) => {
      if (data.knowsVisitorInfo === 'yes') {
         if (!data.visitors.length) {
            ctx.addIssue({
               code: 'custom',
               path: ['visitors'],
               message: 'At least one visitor is required',
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
               message: 'Visitor count is required',
            });
         }
      }

      if (data.scheduleType === 'single_day') {
         if (!data.visitDate) {
            ctx.addIssue({
               code: 'custom',
               path: ['visitDate'],
               message: 'Visit date is required',
            });
         }
      }

      if (data.scheduleType === 'multi_day') {
         if (!data.startDate) {
            ctx.addIssue({
               code: 'custom',
               path: ['startDate'],
               message: 'Start date is required',
            });
         }
         if (!data.endDate) {
            ctx.addIssue({
               code: 'custom',
               path: ['endDate'],
               message: 'End date is required',
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
               message: 'End date cannot be before start date',
            });
         }
      }

      if (data.startTime && data.endTime && data.startTime >= data.endTime) {
         ctx.addIssue({
            code: 'custom',
            path: ['endTime'],
            message: 'End time cannot be before start time',
         });
         ctx.addIssue({
            code: 'custom',
            path: ['startTime'],
            message: 'Start time must be before end time',
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
