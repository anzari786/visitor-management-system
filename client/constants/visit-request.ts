export const VISIT_PURPOSE_OPTIONS = [
   { label: 'Meeting', value: 'meeting' },
   { label: 'Interview', value: 'interview' },
   { label: 'Delivery', value: 'delivery' },
   { label: 'Official Visit', value: 'official_visit' },
   { label: 'Maintenance', value: 'maintenance' },
   { label: 'Other', value: 'other' },
] as const;

export type VisitPurposeValue =
   (typeof VISIT_PURPOSE_OPTIONS)[number]['value'];

/** Temporary host directory for self-service until a public host API exists. */
export const VISIT_REQUEST_DEPARTMENTS = [
   { id: 'hr', name: 'Human Resources' },
   { id: 'fin', name: 'Finance' },
   { id: 'it', name: 'Information Technology' },
   { id: 'rd', name: 'Research & Development' },
   { id: 'proc', name: 'Procurement' },
   { id: 'legal', name: 'Legal Affairs' },
] as const;

export type VisitRequestDepartmentId =
   (typeof VISIT_REQUEST_DEPARTMENTS)[number]['id'];

export type HostEmployee = {
   id: string;
   name: string;
   title: string;
   departmentId: VisitRequestDepartmentId;
   departmentName: string;
};

export const HOST_EMPLOYEES: HostEmployee[] = [
   {
      id: 'host-abebe-kebede',
      name: 'Abebe Kebede',
      title: 'HR Manager',
      departmentId: 'hr',
      departmentName: 'Human Resources',
   },
   {
      id: 'host-helen-tesfaye',
      name: 'Helen Tesfaye',
      title: 'Recruitment Officer',
      departmentId: 'hr',
      departmentName: 'Human Resources',
   },
   {
      id: 'host-dawit-mengistu',
      name: 'Dawit Mengistu',
      title: 'Finance Director',
      departmentId: 'fin',
      departmentName: 'Finance',
   },
   {
      id: 'host-selam-awoke',
      name: 'Selam Awoke',
      title: 'Senior Accountant',
      departmentId: 'fin',
      departmentName: 'Finance',
   },
   {
      id: 'host-yonas-hailu',
      name: 'Yonas Hailu',
      title: 'IT Manager',
      departmentId: 'it',
      departmentName: 'Information Technology',
   },
   {
      id: 'host-liya-girma',
      name: 'Liya Girma',
      title: 'Systems Administrator',
      departmentId: 'it',
      departmentName: 'Information Technology',
   },
   {
      id: 'host-kidus-berhanu',
      name: 'Kidus Berhanu',
      title: 'Research Lead',
      departmentId: 'rd',
      departmentName: 'Research & Development',
   },
   {
      id: 'host-marta-asfaw',
      name: 'Marta Asfaw',
      title: 'Research Analyst',
      departmentId: 'rd',
      departmentName: 'Research & Development',
   },
   {
      id: 'host-samuel-tadesse',
      name: 'Samuel Tadesse',
      title: 'Procurement Officer',
      departmentId: 'proc',
      departmentName: 'Procurement',
   },
   {
      id: 'host-beten-wolde',
      name: 'Beten Wolde',
      title: 'Supply Chain Coordinator',
      departmentId: 'proc',
      departmentName: 'Procurement',
   },
   {
      id: 'host-nahom-desta',
      name: 'Nahom Desta',
      title: 'Legal Counsel',
      departmentId: 'legal',
      departmentName: 'Legal Affairs',
   },
   {
      id: 'host-rahel-fikru',
      name: 'Rahel Fikru',
      title: 'Compliance Officer',
      departmentId: 'legal',
      departmentName: 'Legal Affairs',
   },
];

export const HOST_DEPARTMENT_ORDER = VISIT_REQUEST_DEPARTMENTS.map(
   (d) => d.name,
);
