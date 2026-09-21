import type {
   BackendVisitSummary,
   ManagedVisit,
   ManagedVisitStatus,
   ManagedVisitor,
   VisitorAttendanceStatus,
} from '@/types/visit.types';
import type { MeetingTypeValue } from '@/constants/meeting-types';
import type { VisitTypeValue } from '@/constants/visit-types';
import type { VisitSourceValue } from '@/constants/visit-sources';
import { VisitStatus } from '@/constants/visit-status';
import { AttendanceStatus } from '@/lib/attendance-status';
import { format } from 'date-fns';

const STATUS_MAP: Record<string, ManagedVisitStatus> = {
   [VisitStatus.PENDING_APPROVAL]: 'requested',
   [VisitStatus.APPROVED]: 'approved',
   [VisitStatus.REJECTED]: 'rejected',
   [VisitStatus.EXPIRED]: 'expired',
   [VisitStatus.RESCHEDULED]: 'rescheduled',
   [VisitStatus.PARTIALLY_CHECKED_IN]: 'partially_checked_in',
   [VisitStatus.CHECKED_IN]: 'checked_in',
   [VisitStatus.PARTIALLY_CHECKED_OUT]: 'partially_checked_out',
   [VisitStatus.CHECKED_OUT]: 'checked_out',
   [VisitStatus.CANCELLED]: 'cancelled',
};

const PURPOSE_MAP: Record<string, MeetingTypeValue> = {
   MEETING: 'meeting',
   INTERVIEW: 'interview',
   DELIVERY: 'delivery',
   OFFICIAL_VISIT: 'official_visit',
   MAINTENANCE: 'maintenance',
};

function toDate(value: string | undefined) {
   return value?.slice(0, 10) ?? '';
}

function getAttendanceStatus(status: ManagedVisitStatus): VisitorAttendanceStatus {
   if (status === 'checked_in' || status === 'partially_checked_in') {
      return AttendanceStatus.CHECKED_IN;
   }
   if (status === 'checked_out' || status === 'partially_checked_out') {
      return AttendanceStatus.CHECKED_OUT;
   }
   return AttendanceStatus.EXPECTED;
}

export function mapBackendVisit(visit: BackendVisitSummary): ManagedVisit {
   const status = STATUS_MAP[visit.status] ?? 'requested';
   const scheduleDates = visit.scheduleDates.map(toDate).filter(Boolean);
   const startDate = toDate(visit.startDate) || scheduleDates[0] || '';
   const endDate = toDate(visit.endDate ?? undefined) || undefined;
   const today = format(new Date(), 'yyyy-MM-dd');
   const activeScheduleDay =
      visit.scheduleDays?.find((day) => toDate(day.date) === today) ??
      visit.scheduleDays?.find((day) => toDate(day.date) === startDate);
   const attendanceStatus = getAttendanceStatus(status);
   const visitors: ManagedVisitor[] = visit.visitorNames.map((name, index) => {
      const detail = visit.visitorDetails?.[index];
      const attendances = detail?.attendances ?? [];
      const attendanceByDate = Object.fromEntries(
         attendances.map((attendance) => [
            toDate(attendance.date),
            {
               date: toDate(attendance.date),
               status:
                           attendance.status === AttendanceStatus.CHECKED_IN
                               ? AttendanceStatus.CHECKED_IN
                               : attendance.status === AttendanceStatus.CHECKED_OUT
                                  ? AttendanceStatus.CHECKED_OUT
                                  : attendance.status === AttendanceStatus.NO_SHOW
                                     ? AttendanceStatus.NO_SHOW
                                     : AttendanceStatus.EXPECTED,
               checkedInAt: attendance.checkInAt,
            },
         ]),
      );
      const activeAttendance =
         attendances.find(
            (attendance) => toDate(attendance.date) === today,
         ) ??
         attendances.find(
            (attendance) =>
               attendance.status === AttendanceStatus.CHECKED_IN,
         ) ??
         attendances.find(
            (attendance) => toDate(attendance.date) === startDate,
         );

      return {
         id: `${visit.id}-visitor-${index + 1}`,
         name,
         attendanceStatus,
         phone: detail?.phone,
         nationality: detail?.nationality,
         organization: visit.organization,
         visitParticipantId: detail?.participantId
            ? Number(detail.participantId)
            : undefined,
         visitDayId: activeAttendance?.visitDayId
            ? Number(activeAttendance.visitDayId)
                  : activeScheduleDay?.id
                     ? Number(activeScheduleDay.id)
            : undefined,
         attendanceId: activeAttendance?.id,
         checkedInAt: activeAttendance?.checkInAt,
         attendanceByDate:
            Object.keys(attendanceByDate).length > 0
               ? attendanceByDate
               : {
                    [startDate]: { date: startDate, status: attendanceStatus },
                 },
      };
   });

   return {
      id: visit.visitCode || visit.id,
      backendId: Number(visit.id),
      visitorName: visit.visitorNames[0] ?? visit.organization ?? '',
      visitors,
      visitorCount: visit.expectedVisitorCount || visit.registeredCount,
      organization: visit.organization,
      host: visit.host
         ? `${visit.host.firstName} ${visit.host.lastName}`.trim()
         : '',
      department: visit.host?.departmentName ?? '',
      source: visit.source as VisitSourceValue,
      visitType: (visit.source === 'HOST_INVITATION'
         ? 'invitation'
         : 'visit') as VisitTypeValue,
      meetingType: PURPOSE_MAP[visit.purpose] ?? 'other',
      startDate,
      endDate,
      startTime: visit.startTime,
      endTime: visit.endTime,
      floor: visit.floor,
      room: visit.room,
      status,
      isMultiDay: visit.durationType === 'MULTI_DAY' || Boolean(endDate),
   };
}
