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
      search: z.string().trim().min(1).optional(),
      page: z.coerce.number().int().positive().optional().default(1),
      limit: z.coerce.number().int().positive().max(100).optional().default(20),
   }),
});

export const attendanceIdParamSchema = z.object({
   params: z.object({
      id: z.coerce.number().int().positive(),
   }),
});

/** Lookup by printed badge opaque token (QR). */
export const lookupBadgeByCodeSchema = z.object({
   query: z.object({
      code: z.string().trim().min(1),
   }),
});
