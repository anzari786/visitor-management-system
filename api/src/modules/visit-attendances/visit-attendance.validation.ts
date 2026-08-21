import { z } from 'zod';

const visitAttendanceStatusSchema = z.enum([
   'EXPECTED',
   'CHECKED_IN',
   'CHECKED_OUT',
   'NO_SHOW',
]);

export const checkInSchema = z.object({
   body: z.object({
      visitParticipantId: z.coerce.number().int().positive(),
      visitDayId: z.coerce.number().int().positive(),
      retainPersonalId: z.boolean().optional().default(true),
   }),
});

export const listAttendancesSchema = z.object({
   query: z.object({
      visitId: z.coerce.number().int().positive().optional(),
      visitDayId: z.coerce.number().int().positive().optional(),
      visitParticipantId: z.coerce.number().int().positive().optional(),
      status: visitAttendanceStatusSchema.optional(),
      date: z.coerce.date().optional(),
      search: z.string().trim().min(1).optional(),
      page: z.coerce.number().int().positive().optional().default(1),
      limit: z.coerce.number().int().positive().max(100).optional().default(20),
   }),
});

/** "Daily attendance" board — defaults to today when no date is given. */
export const dailyAttendanceSchema = z.object({
   query: z.object({
      date: z.coerce.date().optional(),
      page: z.coerce.number().int().positive().optional().default(1),
      limit: z.coerce.number().int().positive().max(200).optional().default(50),
   }),
});

export const attendanceIdParamSchema = z.object({
   params: z.object({
      id: z.coerce.number().int().positive(),
   }),
});

/** Lookup by visit QR token or human-readable visit code. */
export const lookupVisitByCodeSchema = z.object({
   query: z.object({
      code: z.string().trim().min(1),
      date: z.coerce.date().optional(),
   }),
});

/** Lookup by printed badge opaque token (QR). */
export const lookupBadgeByCodeSchema = z.object({
   query: z.object({
      code: z.string().trim().min(1),
   }),
});
