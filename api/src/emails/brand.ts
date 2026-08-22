/** Shared VMS / ATI brand tokens for transactional emails. */
export const emailBrand = {
   orgName: 'Ethiopian Agricultural Transformation Institute',
   productName: 'ATI Visitor Management',
   shortName: 'ATI VMS',
   primary: '#0F766E',
   primaryDark: '#115E59',
   text: '#1F2937',
   muted: '#6B7280',
   border: '#E5E7EB',
   background: '#F3F4F6',
   card: '#FFFFFF',
   success: '#15803D',
   danger: '#B91C1C',
   warning: '#B45309',
   info: '#1D4ED8',
} as const;

export type VisitEmailStatus =
   | 'PENDING'
   | 'APPROVED'
   | 'REJECTED'
   | 'RESCHEDULED'
   | 'CANCELLED'
   | 'ARRIVED'
   | 'CHECKED_OUT';

export const statusBadgeStyles: Record<
   VisitEmailStatus,
   { label: string; background: string; color: string }
> = {
   PENDING: {
      label: 'Pending approval',
      background: '#FEF3C7',
      color: '#B45309',
   },
   APPROVED: {
      label: 'Approved',
      background: '#DCFCE7',
      color: '#15803D',
   },
   REJECTED: {
      label: 'Rejected',
      background: '#FEE2E2',
      color: '#B91C1C',
   },
   RESCHEDULED: {
      label: 'Rescheduled',
      background: '#DBEAFE',
      color: '#1D4ED8',
   },
   CANCELLED: {
      label: 'Cancelled',
      background: '#F3F4F6',
      color: '#4B5563',
   },
   ARRIVED: {
      label: 'Arrived',
      background: '#DCFCE7',
      color: '#15803D',
   },
   CHECKED_OUT: {
      label: 'Checked out',
      background: '#E0E7FF',
      color: '#3730A3',
   },
};
