import { ID_TYPE_OPTIONS } from '@/constants/visit';
import type { MeetingTypeValue } from '@/constants/meeting-types';
import type { Department } from './department.types';

export type IdTypeValue = (typeof ID_TYPE_OPTIONS)[number]['value'];

/** Legacy check-in session status (walk-in / badge flow). */
export type VisitStatus = 'active' | 'overstay' | 'completed' | 'cancelled';

export type VisitorAttendanceStatus =
   | 'pending'
   | 'checked_in'
   | 'checked_out';

/**
 * Visit request lifecycle status.
 * Requested → Approved / Rejected / Rescheduled →
 * Partially Checked In → Checked In →
 * Partially Checked Out → Checked Out / Cancelled
 */
export type ManagedVisitStatus =
   | 'requested'
   | 'approved'
   | 'rejected'
   | 'rescheduled'
   | 'partially_checked_in'
   | 'checked_in'
   | 'partially_checked_out'
   | 'checked_out'
   | 'cancelled';

export type IdType =
   | 'national_id'
   | 'kebele_id'
   | 'passport'
   | 'drivers_license'
   | 'other';

/** Legacy check-in session record. */
export type Visit = {
   id: number;
   badge: string;
   visitorName: string;
   phone: string;
   idType: IdType;
   idNumber: string;
   host?: string;
   department?: Department | null;
   checkInTime: string;
   checkOutTime?: string;
   cancelledAt?: string;
   status: VisitStatus;
   note?: string;
};

export type VisitorDayAttendance = {
   date: string;
   status: VisitorAttendanceStatus;
   checkedInAt?: string;
};

export type ManagedVisitor = {
   id: string;
   name: string;
   /** Convenience mirror of today's / active-day attendance for table UI. */
   attendanceStatus: VisitorAttendanceStatus;
   phone?: string;
   email?: string;
   organization?: string;
   idType?: IdType;
   idNumber?: string;
   /** ISO timestamp when the visitor checked in (active day). */
   checkedInAt?: string;
   /** Per-day attendance for multi-day visits. */
   attendanceByDate?: Record<string, VisitorDayAttendance>;
   /** Physical badge assigned at check-in (public badge number, not DB id). */
   assignedBadgeNumber?: string;
   /** Opaque badge QR token paired with the assigned badge. */
   assignedBadgeQr?: string;
};

/**
 * Managed visit from the Visit Request Form lifecycle.
 * Shape mirrors the intended backend visit list payload.
 */
export type ManagedVisit = {
   /** Public visit identifier sent to the visitor by email (e.g. VMS-2026-0042). */
   id: string;
   /**
    * Opaque QR token encoded in the visitor approval email.
    * Prefer scanning this over the human-readable visit id.
    */
   qrToken?: string;
   /** Primary visitor display name (first guest / group lead). */
   visitorName: string;
   visitors: ManagedVisitor[];
   visitorCount: number;
   organization?: string;
   host: string;
   department: string;
   meetingType: MeetingTypeValue;
   purpose: string;
   /** ISO date string (yyyy-MM-dd) */
   startDate: string;
   /** ISO date string for multi-day visits */
   endDate?: string;
   /** 24h time string HH:mm */
   startTime: string;
   /** 24h time string HH:mm */
   endTime: string;
   floor?: string;
   room?: string;
   status: ManagedVisitStatus;
   isMultiDay: boolean;
};

export type DateFilter =
   | 'all'
   | 'today'
   | 'yesterday'
   | 'last7days'
   | 'last30days';

export type VisitsParams = {
   page: number;
   pageSize: number;
   search?: string;
   status?: VisitStatus | 'all';
   dateFilter?: DateFilter;
   departmentId?: string;
};

export type ManagedVisitsParams = {
   page: number;
   pageSize: number;
   search?: string;
   status?: ManagedVisitStatus | 'all';
   department?: string | 'all';
   meetingType?: MeetingTypeValue | 'all';
};

export type VisitsPaginatedData = {
   data: Visit[];
   total: number;
   page: number;
   pageSize: number;
   pageCount: number;
};

export type CheckInPayload = {
   fullName: string;
   phone?: string;
   idType: IdTypeValue;
   idNumber: string;
   host: string;
   department?: string | null;
   badgeNumber: number;
};

export type CheckInData = {
   id: number;
   badge: string;
   visitorName: string;
   host: string;
   department?: Department | null;
   checkInTime: string;
};

export type CheckOutPayload = {
   badgeNumber: number;
   notes?: string;
};

export type CheckOutData = {
   id: number;
   badge: string;
   visitorName: string;
   host: string;
   department: string;
   checkInTime: string;
   checkOutTime: string;
};

export type BadgeLookupData = {
   id: number;
   badge: string;
   visitorName: string;
   host: string;
   department: string;
   checkInTime: string;
};

export type ActiveVisitorsCountData = {
   activeCount: number;
};

export type CheckInResponse = CheckInData;
export type CheckOutResponse = CheckOutData;
export type BadgeLookupResponse = BadgeLookupData;
