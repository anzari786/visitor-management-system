/** Mirrors the Prisma AttendanceStatus enum for client-side use. */
export const AttendanceStatus = {
   EXPECTED: 'EXPECTED',
   CHECKED_IN: 'CHECKED_IN',
   CHECKED_OUT: 'CHECKED_OUT',
   NO_SHOW: 'NO_SHOW',
} as const;

export type AttendanceStatusValue =
   (typeof AttendanceStatus)[keyof typeof AttendanceStatus];