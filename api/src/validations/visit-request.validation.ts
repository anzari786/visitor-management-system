import { z } from 'zod';
import { IdType, VisitPurpose, VisitRequestStatus } from '../generated/prisma/enums.js';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const visitorPayloadSchema = z.object({
   firstName: z.string().trim().min(1, 'First name is required').max(50),
   lastName: z.string().trim().min(1, 'Last name is required').max(50),
   email: z.string().trim().email('Enter a valid email address').max(100),
   phone: z.string().trim().min(1, 'Phone number is required').max(30),
   idType: z.enum(IdType),
   idNumber: z.string().trim().min(1, 'ID number is required').max(50),
   organization: z
      .string()
      .trim()
      .max(100)
      .optional()
      .transform((val) => (val ? val : undefined)),
});

export const createVisitRequestSchema = z.object({
   body: z
      .object({
         visitors: z
            .array(visitorPayloadSchema)
            .min(1, 'At least one visitor is required'),
         hostName: z.string().trim().min(1, 'Host name is required').max(100),
         hostEmail: z
            .string()
            .trim()
            .email('Enter a valid host email')
            .max(100)
            .optional(),
         departmentCode: z
            .string()
            .trim()
            .min(1, 'Department is required')
            .max(20),
         purpose: z.enum(VisitPurpose),
         startDate: z.string().trim().min(1, 'Start date is required'),
         endDate: z.string().trim().min(1, 'End date is required'),
         startTime: z
            .string()
            .trim()
            .regex(timeRegex, 'Start time must be in HH:mm format'),
         endTime: z
            .string()
            .trim()
            .regex(timeRegex, 'End time must be in HH:mm format'),
      })
      .superRefine((data, ctx) => {
         const start = new Date(data.startDate);
         const end = new Date(data.endDate);

         if (Number.isNaN(start.getTime())) {
            ctx.addIssue({
               code: 'custom',
               path: ['startDate'],
               message: 'Start date is invalid',
            });
         }

         if (Number.isNaN(end.getTime())) {
            ctx.addIssue({
               code: 'custom',
               path: ['endDate'],
               message: 'End date is invalid',
            });
         }

         if (
            !Number.isNaN(start.getTime()) &&
            !Number.isNaN(end.getTime()) &&
            end < start
         ) {
            ctx.addIssue({
               code: 'custom',
               path: ['endDate'],
               message: 'End date cannot be before start date',
            });
         }

         if (data.startTime >= data.endTime) {
            ctx.addIssue({
               code: 'custom',
               path: ['endTime'],
               message: 'End time must be after start time',
            });
         }
      }),
});

export const visitRequestsQuerySchema = z.object({
   query: z.object({
      page: z.coerce.number().int().positive().default(1),
      pageSize: z.coerce.number().int().positive().max(100).default(20),
      search: z.string().trim().optional(),
      status: z
         .enum(['pending', 'approved', 'rejected', 'all'])
         .optional(),
      dateFilter: z
         .enum(['all', 'today', 'yesterday', 'last7days', 'last30days'])
         .optional(),
      departmentId: z.coerce.number().int().positive().optional(),
   }),
});

export const visitRequestIdParamSchema = z.object({
   params: z.object({
      id: z.coerce.number().int().positive(),
   }),
});

export const approveVisitRequestSchema = z.object({
   params: z.object({
      id: z.coerce.number().int().positive(),
   }),
});

export const rejectVisitRequestSchema = z.object({
   params: z.object({
      id: z.coerce.number().int().positive(),
   }),
   body: z.object({
      reason: z
         .string()
         .trim()
         .max(500, 'Rejection reason must be 500 characters or fewer')
         .optional(),
   }),
});

export type CreateVisitRequestBody = z.infer<
   typeof createVisitRequestSchema
>['body'];
export type VisitRequestsQuery = z.infer<
   typeof visitRequestsQuerySchema
>['query'];
export type RejectVisitRequestBody = z.infer<
   typeof rejectVisitRequestSchema
>['body'];

export { VisitRequestStatus };
