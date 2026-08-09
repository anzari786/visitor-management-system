/**
 * Canonical meeting / visit type options used across host filters,
 * invitations, and visit requests. Add new types here so they appear
 * automatically in Meeting Type filters.
 */
export const MEETING_TYPE_OPTIONS = [
   { label: 'Meeting', value: 'meeting' },
   { label: 'Interview', value: 'interview' },
   { label: 'Delivery', value: 'delivery' },
   { label: 'Official Visit', value: 'official_visit' },
   { label: 'Maintenance', value: 'maintenance' },
   { label: 'Audit', value: 'audit' },
   { label: 'Site Visit', value: 'site_visit' },
   { label: 'Vendor Review', value: 'vendor_review' },
   { label: 'Training', value: 'training' },
   { label: 'Other', value: 'other' },
] as const;

export type MeetingTypeValue = (typeof MEETING_TYPE_OPTIONS)[number]['value'];
export type MeetingTypeLabel = (typeof MEETING_TYPE_OPTIONS)[number]['label'];

export function getMeetingTypeLabel(value: MeetingTypeValue): string {
   return (
      MEETING_TYPE_OPTIONS.find((option) => option.value === value)?.label ??
      value
   );
}
