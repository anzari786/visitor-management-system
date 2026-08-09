import { z } from 'zod';
import { visitScheduleSchema } from '@/lib/validations/visit-schedule.schema';
import { visitLocationSchema } from '@/lib/validations/visit-location.schema';

/** Combined schedule + location schema for updating an approved visit. */
export const visitUpdateDetailsSchema = visitScheduleSchema.and(
   visitLocationSchema,
);

export type VisitUpdateDetailsInput = z.input<typeof visitUpdateDetailsSchema>;
export type VisitUpdateDetailsValues = z.output<
   typeof visitUpdateDetailsSchema
>;
