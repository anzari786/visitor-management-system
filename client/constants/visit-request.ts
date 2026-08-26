export const VISIT_PURPOSE_OPTIONS = [
   { label: 'Meeting', value: 'meeting' },
   { label: 'Interview', value: 'interview' },
   { label: 'Delivery', value: 'delivery' },
   { label: 'Official Visit', value: 'official_visit' },
   { label: 'Maintenance', value: 'maintenance' },
   { label: 'Other', value: 'other' },
] as const;

export type VisitPurposeValue = (typeof VISIT_PURPOSE_OPTIONS)[number]['value'];
