/**
 * Translation keys for enum-ish domain labels (statuses, visit and meeting
 * types). The English source lives beside each enum (`constants/*`,
 * `lib/visit-attendance.ts`); this maps the same values onto dictionary keys
 * so components can render them in the active language:
 *
 *    const { t } = useTranslation();
 *    t(MANAGED_VISIT_STATUS_KEYS[visit.status])
 */
import type { MeetingTypeValue } from '@/constants/meeting-types';
import type { VisitPurposeValue } from '@/constants/visit-purpose';
import type { VisitTypeValue } from '@/constants/visit-types';
import type {
   IdType,
   ManagedVisitStatus,
   VisitorAttendanceStatus,
} from '@/types/visit.types';
import type { UserRole } from '@/types/user.types';
import type { TranslationKey } from './dictionaries';

export const USER_ROLE_KEYS: Record<UserRole, TranslationKey> = {
   GUARD: 'role.guard',
   RECEPTION: 'role.reception',
   ADMIN: 'role.admin',
   MANAGER: 'role.manager',
};

export const MANAGED_VISIT_STATUS_KEYS: Record<
   ManagedVisitStatus,
   TranslationKey
> = {
   requested: 'visitStatus.requested',
   approved: 'visitStatus.approved',
   rejected: 'visitStatus.rejected',
   rescheduled: 'visitStatus.rescheduled',
   partially_checked_in: 'visitStatus.partiallyCheckedIn',
   checked_in: 'visitStatus.checkedIn',
   partially_checked_out: 'visitStatus.partiallyCheckedOut',
   checked_out: 'visitStatus.checkedOut',
   cancelled: 'visitStatus.cancelled',
};

export const ATTENDANCE_STATUS_KEYS: Record<
   VisitorAttendanceStatus,
   TranslationKey
> = {
   pending: 'attendance.notCheckedIn',
   checked_in: 'attendance.checkedIn',
   checked_out: 'attendance.checkedOut',
};

/** "Pending" is reserved for visits still awaiting approval. */
export function getVisitorAttendanceLabelKey(
   status: VisitorAttendanceStatus,
   visitStatus: ManagedVisitStatus,
): TranslationKey {
   if (status === 'pending' && visitStatus === 'requested') {
      return 'attendance.pending';
   }
   return ATTENDANCE_STATUS_KEYS[status];
}

export const VISIT_TYPE_KEYS: Record<VisitTypeValue, TranslationKey> = {
   visit: 'visitType.visit',
   invitation: 'visitType.invitation',
};

export const ID_TYPE_KEYS: Record<IdType, TranslationKey> = {
   national_id: 'idType.nationalId',
   kebele_id: 'idType.kebeleId',
   passport: 'idType.passport',
   drivers_license: 'idType.driversLicense',
   other: 'idType.other',
};

/** Visit purposes reuse the meeting-type vocabulary. */
export const VISIT_PURPOSE_KEYS: Record<VisitPurposeValue, TranslationKey> = {
   meeting: 'meetingType.meeting',
   interview: 'meetingType.interview',
   delivery: 'meetingType.delivery',
   official_visit: 'meetingType.officialVisit',
   maintenance: 'meetingType.maintenance',
   other: 'meetingType.other',
};

export const MEETING_TYPE_KEYS: Record<MeetingTypeValue, TranslationKey> = {
   meeting: 'meetingType.meeting',
   interview: 'meetingType.interview',
   delivery: 'meetingType.delivery',
   official_visit: 'meetingType.officialVisit',
   maintenance: 'meetingType.maintenance',
   audit: 'meetingType.audit',
   site_visit: 'meetingType.siteVisit',
   vendor_review: 'meetingType.vendorReview',
   training: 'meetingType.training',
   other: 'meetingType.other',
};
