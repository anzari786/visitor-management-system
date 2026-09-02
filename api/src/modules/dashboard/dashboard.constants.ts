import type { VisitPurpose, VisitStatus } from '../../generated/prisma/client.js';

export const GROWTH_MONTHS = {
   '3m': 3,
   '6m': 6,
   '12m': 12,
} as const;

export const CHART_RANGES = {
   '7days': 7,
   '30days': 30,
   '90days': 90,
} as const;

/** Stable palette for pie/legend charts — index by order. */
export const CHART_COLORS = [
   '#35b9e9',
   '#6e3ff3',
   '#375dfb',
   '#e255f2',
   '#00d084',
   '#ff6900',
   '#eb144c',
   '#f7c948',
] as const;

export const VISIT_PURPOSE_LABELS: Record<VisitPurpose, string> = {
   MEETING: 'Meeting',
   INTERVIEW: 'Interview',
   DELIVERY: 'Delivery',
   OFFICIAL_VISIT: 'Official Visit',
   MAINTENANCE: 'Maintenance',
   OTHER: 'Other',
};

export const VISIT_STATUS_LABELS: Record<VisitStatus, string> = {
   PENDING_APPROVAL: 'Pending Approval',
   APPROVED: 'Approved',
   REJECTED: 'Rejected',
   EXPIRED: 'Expired',
   RESCHEDULED: 'Rescheduled',
   CANCELLED: 'Cancelled',
   PARTIALLY_CHECKED_IN: 'Partially Checked In',
   CHECKED_IN: 'Checked In',
   PARTIALLY_CHECKED_OUT: 'Partially Checked Out',
   CHECKED_OUT: 'Checked Out',
};

/** Visit statuses that count as upcoming (approved schedule, not yet on site). */
export const UPCOMING_VISIT_STATUSES: VisitStatus[] = [
   'APPROVED',
   'RESCHEDULED',
];
