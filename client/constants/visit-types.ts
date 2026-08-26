export const VISIT_TYPE_OPTIONS = [
   { label: 'Visit', value: 'visit' },
   { label: 'Invitation', value: 'invitation' },
] as const;

export type VisitTypeValue = (typeof VISIT_TYPE_OPTIONS)[number]['value'];

export function getVisitTypeLabel(value: VisitTypeValue): string {
   return (
      VISIT_TYPE_OPTIONS.find((option) => option.value === value)?.label ??
      value
   );
}
