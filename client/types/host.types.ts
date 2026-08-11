import type { HostInvitationFormValues } from '@/lib/validations/host-invitation.schema';
import type { VisitUpdateDetailsValues } from '@/lib/validations/visit-update-details.schema';

/** Host-portal visit lifecycle statuses. */
export type HostVisitStatus =
   | 'pending'
   | 'upcoming'
   | 'approved'
   | 'rejected'
   | 'cancelled'
   | 'completed';

/**
 * Visit card / list item shape used by the Host Portal UI.
 * Display dates currently use `d MMM yyyy`; API may return ISO — map at the UI boundary.
 */
export type HostVisit = {
   id: string;
   visitorName: string;
   isGroup?: boolean;
   groupSize?: number;
   orgName?: string;
   meetingType: string;
   purpose?: string;
   startDate: string;
   endDate?: string;
   time: string;
   endTime: string;
   isMultiDay: boolean;
   floor?: string;
   room?: string;
   status?: HostVisitStatus;
};

/** @deprecated Prefer `HostVisit` — alias kept for gradual UI migration. */
export type HostVisitCardData = HostVisit;

export type HostProfile = {
   id: number;
   firstName: string;
   lastName: string;
   username: string;
   email?: string;
   phone?: string;
   departmentId?: number | string;
   departmentName?: string;
   title?: string;
};

export type HostVisitsParams = {
   search?: string;
   meetingType?: string | string[];
   status?: HostVisitStatus | HostVisitStatus[];
};

export type ApproveHostVisitPayload = {
   floor: string;
   room: string;
};

export type RejectHostVisitPayload = {
   reason?: string;
};

export type RescheduleHostVisitPayload = VisitUpdateDetailsValues;

export type CancelHostVisitPayload = {
   reason?: string;
};

export type CreateHostInvitationPayload = HostInvitationFormValues;

export type HostInvitation = {
   id: string;
   status: 'pending' | 'accepted' | 'expired' | 'cancelled';
   purpose: string;
   knowsVisitorInfo: 'yes' | 'no';
   visitorCount: number;
   visitors?: Array<{
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      organization?: string;
   }>;
   visitorOrganization?: string;
   scheduleType: 'single_day' | 'multi_day';
   startDate: string;
   endDate?: string;
   startTime: string;
   endTime: string;
   floor: string;
   room: string;
   createdAt: string;
};

export type HostRoom = {
   id: string;
   name: string;
   floor: string;
   capacity?: number;
   isAvailable?: boolean;
};

export type HostAvailableBadge = {
   id: number;
   badgeNumber: number;
   status: string;
};

export type HostNotification = {
   id: string;
   title: string;
   message: string;
   type?: string;
   visitId?: string;
   isRead: boolean;
   createdAt: string;
};

export type MarkNotificationsReadPayload = {
   ids?: string[];
};

export type ResendApprovalEmailPayload = {
   visitId: string;
};

export type ResendApprovalEmailData = {
   body?: string;
   sentAt: string;
};
