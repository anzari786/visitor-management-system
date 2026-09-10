export const VISIT_SOURCE_OPTIONS = [
   { labelKey: 'visitSource.public', value: 'PUBLIC' },
   { labelKey: 'visitSource.reception', value: 'RECEPTION' },
   { labelKey: 'visitSource.hostInvitation', value: 'HOST_INVITATION' },
] as const;

export type VisitSourceValue = (typeof VISIT_SOURCE_OPTIONS)[number]['value'];