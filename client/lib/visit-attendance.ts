import {
   addDays,
   differenceInMinutes,
   format,
   isAfter,
   isBefore,
   isSameDay,
   parseISO,
   startOfDay,
} from 'date-fns';
import type {
   ManagedVisit,
   ManagedVisitStatus,
   ManagedVisitor,
   VisitorAttendanceStatus,
   VisitorDayAttendance,
} from '@/types/visit.types';
import { AttendanceStatus } from '@/lib/attendance-status';

/** Attendance labels keyed by the database AttendanceStatus enum. */
export const ATTENDANCE_STATUS_LABELS: Record<
   VisitorAttendanceStatus,
   string
> = {
   [AttendanceStatus.EXPECTED]: 'Expected',
   [AttendanceStatus.CHECKED_IN]: 'Checked In',
   [AttendanceStatus.CHECKED_OUT]: 'Checked Out',
   [AttendanceStatus.NO_SHOW]: 'No Show',
};

export function isGroupVisit(visit: ManagedVisit) {
   return visit.visitors.length > 1;
}

/** All calendar dates in the visit schedule (inclusive). */
export function getVisitScheduleDates(visit: ManagedVisit): string[] {
   const start = startOfDay(parseISO(visit.startDate));
   const end = startOfDay(parseISO(visit.endDate ?? visit.startDate));
   const dates: string[] = [];
   let cursor = start;
   while (!isAfter(cursor, end)) {
      dates.push(format(cursor, 'yyyy-MM-dd'));
      cursor = addDays(cursor, 1);
   }
   return dates;
}

function combineDateAndTime(date: string, time: string) {
   return new Date(`${date}T${time}:00`);
}

/** Whether attendance is allowed right now for any scheduled visit day. */
export function isVisitAttendanceWindowOpen(
   visit: ManagedVisit,
   now: Date = new Date(),
) {
   if (
      visit.status === 'cancelled' ||
      visit.status === 'rejected' ||
      visit.status === 'requested'
   ) {
      return false;
   }

   const dates = getVisitScheduleDates(visit);
   return dates.some((date) => {
      const dayStart = combineDateAndTime(date, visit.startTime);
      const dayEnd = combineDateAndTime(date, visit.endTime);
      return now >= dayStart && now <= dayEnd;
   });
}

/** Active schedule day for `now`, if inside that day's start/end window. */
export function getActiveVisitDay(
   visit: ManagedVisit,
   now: Date = new Date(),
): string | null {
   const dates = getVisitScheduleDates(visit);
   for (const date of dates) {
      const dayStart = combineDateAndTime(date, visit.startTime);
      const dayEnd = combineDateAndTime(date, visit.endTime);
      if (!isBefore(now, dayStart) && !isAfter(now, dayEnd)) {
         return date;
      }
   }
   return null;
}

/**
 * Latest schedule day that has started (for display when outside the window).
 * Falls back to the first schedule day.
 */
export function getRelevantVisitDay(
   visit: ManagedVisit,
   now: Date = new Date(),
): string {
   const active = getActiveVisitDay(visit, now);
   if (active) return active;

   const dates = getVisitScheduleDates(visit);
   const started = [...dates]
      .reverse()
      .find((date) => !isBefore(now, combineDateAndTime(date, visit.startTime)));
   return started ?? dates[0] ?? visit.startDate;
}

export function getVisitorDayAttendance(
   visitor: ManagedVisitor,
   date: string,
): VisitorDayAttendance {
   const existing = visitor.attendanceByDate?.[date];
   if (existing) return existing;
   return { date, status: AttendanceStatus.EXPECTED };
}

export function getVisitorAttendanceStatusForDay(
   visitor: ManagedVisitor,
   date: string,
): VisitorAttendanceStatus {
   return getVisitorDayAttendance(visitor, date).status;
}

function withSyncedCurrentAttendance(
   visitor: ManagedVisitor,
   date: string,
): ManagedVisitor {
   const day = getVisitorDayAttendance(visitor, date);
   return {
      ...visitor,
      attendanceStatus: day.status,
      checkedInAt: day.checkedInAt,
   };
}

export function syncVisitAttendanceForDay(
   visit: ManagedVisit,
   date: string = getRelevantVisitDay(visit),
): ManagedVisit {
   const visitors = visit.visitors.map((visitor) =>
      withSyncedCurrentAttendance(visitor, date),
   );
   return {
      ...visit,
      visitors,
      status: deriveAttendanceStatus(visitors, visit.status),
   };
}

export function canAttemptCheckIn(status: ManagedVisitStatus) {
   return (
      status === 'approved' ||
      status === 'rescheduled' ||
      status === 'partially_checked_in' ||
      status === 'checked_in' ||
      status === 'partially_checked_out' ||
      // Multi-day: a prior day may have finished as checked_out while later days remain open.
      status === 'checked_out'
   );
}

export function canAttemptCheckOut(status: ManagedVisitStatus) {
   return (
      status === 'checked_in' ||
      status === 'partially_checked_in' ||
      status === 'partially_checked_out'
   );
}

export function getCheckInEligibleVisitors(
   visit: ManagedVisit,
   now: Date = new Date(),
) {
   // Includes approved, partially_checked_in, partially_checked_out, etc.
   // Remaining not-checked-in guests stay eligible throughout today's schedule day.
   if (!canAttemptCheckIn(visit.status)) {
      return [];
   }

   const day = getVisitScheduleDates(visit).find((date) =>
      isSameDay(parseISO(date), now),
   );
   if (!day) return [];

   return visit.visitors.filter(
      (v) =>
         getVisitorAttendanceStatusForDay(v, day) === AttendanceStatus.EXPECTED,
   );
}

export function getCheckOutEligibleVisitors(
   visit: ManagedVisit,
   now: Date = new Date(),
) {
   // Remaining checked-in guests stay eligible on partially_checked_out
   // (and related) statuses until they check out.
   if (
      visit.status === 'cancelled' ||
      visit.status === 'rejected' ||
      visit.status === 'requested'
   ) {
      return [];
   }

   const day = getActiveVisitDay(visit, now) ?? getRelevantVisitDay(visit, now);

   return visit.visitors.filter(
      (v) =>
         getVisitorAttendanceStatusForDay(v, day) === AttendanceStatus.CHECKED_IN,
   );
}

export function canCheckIn(visit: ManagedVisit, now: Date = new Date()) {
   return getCheckInEligibleVisitors(visit, now).length > 0;
}

export function canCheckOut(visit: ManagedVisit, now: Date = new Date()) {
   return getCheckOutEligibleVisitors(visit, now).length > 0;
}

export function canCancel(status: ManagedVisitStatus) {
   return (
      status === 'requested' ||
      status === 'approved' ||
      status === 'rescheduled' ||
      status === 'partially_checked_in' ||
      status === 'checked_in' ||
      status === 'partially_checked_out'
   );
}

function deriveAttendanceStatus(
   visitors: ManagedVisitor[],
   previousStatus: ManagedVisitStatus,
): ManagedVisitStatus {
   if (
      previousStatus === 'requested' ||
      previousStatus === 'rejected' ||
      previousStatus === 'cancelled'
   ) {
      return previousStatus;
   }

   const checkedIn = visitors.filter(
      (v) => v.attendanceStatus === AttendanceStatus.CHECKED_IN,
   ).length;
   const checkedOut = visitors.filter(
      (v) => v.attendanceStatus === AttendanceStatus.CHECKED_OUT,
   ).length;
   const pending = visitors.filter(
      (v) => v.attendanceStatus === AttendanceStatus.EXPECTED,
   ).length;
   const total = visitors.length;

   if (checkedOut === total) return 'checked_out';
   if (checkedOut > 0 && checkedIn > 0) return 'partially_checked_out';
   // Some checked out, others still pending (and none currently in)
   if (checkedOut > 0 && pending > 0) return 'partially_checked_out';
   if (checkedIn === total) return 'checked_in';
   if (checkedIn > 0 && pending > 0) return 'partially_checked_in';
   if (checkedIn > 0) return 'checked_in';

   return previousStatus === 'rescheduled' ? 'rescheduled' : 'approved';
}

export function applyVisitorAttendance(
   visit: ManagedVisit,
   visitorIds: string[],
   nextAttendance: Extract<
      VisitorAttendanceStatus,
      typeof AttendanceStatus.CHECKED_IN | typeof AttendanceStatus.CHECKED_OUT
   >,
   now: Date = new Date(),
): ManagedVisit {
   const day =
      getActiveVisitDay(visit, now) ?? getRelevantVisitDay(visit, now);

   const idSet = new Set(visitorIds);
   const nowIso = now.toISOString();

   const visitors = visit.visitors.map((visitor) => {
      if (!idSet.has(visitor.id)) {
         return withSyncedCurrentAttendance(visitor, day);
      }

      const current = getVisitorAttendanceStatusForDay(visitor, day);

      if (
         nextAttendance === AttendanceStatus.CHECKED_IN &&
         current !== AttendanceStatus.EXPECTED
      ) {
         return withSyncedCurrentAttendance(visitor, day);
      }
      if (
         nextAttendance === AttendanceStatus.CHECKED_OUT &&
         current !== AttendanceStatus.CHECKED_IN
      ) {
         return withSyncedCurrentAttendance(visitor, day);
      }

      const previousDay = getVisitorDayAttendance(visitor, day);
      const dayRecord: VisitorDayAttendance = {
         date: day,
         status: nextAttendance,
         checkedInAt:
            nextAttendance === AttendanceStatus.CHECKED_IN
               ? nowIso
               : previousDay.checkedInAt,
      };

      return withSyncedCurrentAttendance(
         {
            ...visitor,
            ...(nextAttendance === AttendanceStatus.CHECKED_IN
               ? {
                    badgeToken:
                       visitor.badgeToken ??
                       `tok-${visitor.id}-${day}`,
                    attendanceId:
                       visitor.attendanceId ??
                       `mock-${visitor.id}-${day}`,
                    printJobStatus: 'QUEUED' as const,
                 }
               : {
                    printJobStatus: undefined,
                 }),
            attendanceByDate: {
               ...visitor.attendanceByDate,
               [day]: dayRecord,
            },
         },
         day,
      );
   });

   return {
      ...visit,
      visitors,
      visitorCount: visitors.length,
      status: deriveAttendanceStatus(visitors, visit.status),
   };
}

export function getVisitCheckInReference(
   visit: ManagedVisit,
   visitorIds?: string[],
) {
   const day = getRelevantVisitDay(visit);
   const candidates = visitorIds?.length
      ? visit.visitors.filter((v) => visitorIds.includes(v.id))
      : visit.visitors;

   const checkedInVisitor = candidates.find((v) => {
      const dayStatus = getVisitorDayAttendance(v, day);
      return (
         dayStatus.status === AttendanceStatus.CHECKED_IN &&
         dayStatus.checkedInAt
      );
   });

   if (checkedInVisitor) {
      const record = getVisitorDayAttendance(checkedInVisitor, day);
      if (record.checkedInAt) return new Date(record.checkedInAt);
   }

   const anyCheckedIn = candidates.find((v) => v.checkedInAt);
   if (anyCheckedIn?.checkedInAt) return new Date(anyCheckedIn.checkedInAt);

   return combineDateAndTime(day, visit.startTime);
}

export function formatVisitDuration(start: Date, end: Date = new Date()) {
   const totalMinutes = Math.max(0, differenceInMinutes(end, start));
   const hours = Math.floor(totalMinutes / 60);
   const minutes = totalMinutes % 60;
   if (hours === 0) return `${minutes}m`;
   if (minutes === 0) return `${hours}h`;
   return `${hours}h ${minutes}m`;
}

export function checkInAllEligible(
   visit: ManagedVisit,
   now: Date = new Date(),
): ManagedVisit {
   const ids = getCheckInEligibleVisitors(visit, now).map((v) => v.id);
   return applyVisitorAttendance(
      visit,
      ids,
      AttendanceStatus.CHECKED_IN,
      now,
   );
}

export function checkOutAllEligible(
   visit: ManagedVisit,
   now: Date = new Date(),
): ManagedVisit {
   const ids = getCheckOutEligibleVisitors(visit, now).map((v) => v.id);
   return applyVisitorAttendance(
      visit,
      ids,
      AttendanceStatus.CHECKED_OUT,
      now,
   );
}

export function getVisitorInitials(name: string) {
   return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
}
