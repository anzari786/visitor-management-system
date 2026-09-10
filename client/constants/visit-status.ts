/** Keep these values synchronized with the VisitStatus enum in schema.prisma. */
export const VisitStatus = {
   PENDING_APPROVAL: 'PENDING_APPROVAL',
   APPROVED: 'APPROVED',
   REJECTED: 'REJECTED',
   EXPIRED: 'EXPIRED',
   RESCHEDULED: 'RESCHEDULED',
   CANCELLED: 'CANCELLED',
   PARTIALLY_CHECKED_IN: 'PARTIALLY_CHECKED_IN',
   CHECKED_IN: 'CHECKED_IN',
   PARTIALLY_CHECKED_OUT: 'PARTIALLY_CHECKED_OUT',
   CHECKED_OUT: 'CHECKED_OUT',
} as const;

export type VisitStatus = (typeof VisitStatus)[keyof typeof VisitStatus];

/** Schema statuses used internally but intentionally grouped in the filter UI. */
export const PARTIAL_CHECK_IN = VisitStatus.PARTIALLY_CHECKED_IN;
export const PARTIAL_CHECK_OUT = VisitStatus.PARTIALLY_CHECKED_OUT;

export const VISIT_STATUS_FILTER_OPTIONS = [
   { schemaStatus: VisitStatus.PENDING_APPROVAL, value: 'requested' },
   { schemaStatus: VisitStatus.APPROVED, value: 'approved' },
   { schemaStatus: VisitStatus.REJECTED, value: 'rejected' },
   { schemaStatus: VisitStatus.EXPIRED, value: 'expired' },
   { schemaStatus: VisitStatus.RESCHEDULED, value: 'rescheduled' },
   { schemaStatus: VisitStatus.CANCELLED, value: 'cancelled' },
   { schemaStatus: VisitStatus.CHECKED_IN, value: 'checked_in' },
   { schemaStatus: VisitStatus.CHECKED_OUT, value: 'checked_out' },
] as const;
