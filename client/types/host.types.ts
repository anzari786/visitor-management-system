/** Host-portal visit lifecycle statuses. */
export type HostVisitStatus =
   | 'pending'
   | 'upcoming'
   | 'approved'
   | 'rescheduled'
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

export type RescheduleHostVisitPayload = {
   scheduleDates: Array<{
      date: Date;
      expectedStartTime: Date;
      expectedEndTime: Date;
   }>;
   floor?: string;
   room?: string;
   note?: string;
};

export type CancelHostVisitPayload = {
   note?: string;
};
