import type { VisitRequestFormValues } from '@/lib/validations/visit-request.schema';
import type {
   HostEmployee,
   VisitPurposeValue,
   VisitRequestDepartmentId,
} from '@/constants/visit-request';

/** Public employee search result (host autocomplete). */
export type EmployeeSearchResult = HostEmployee;

export type EmployeeSearchParams = {
   q?: string;
   departmentId?: string;
   limit?: number;
};

export type SelfServiceDepartment = {
   id: VisitRequestDepartmentId | string;
   name: string;
};

export type SelfServicePurposeOption = {
   label: string;
   value: VisitPurposeValue | string;
};

export type SubmitVisitRequestPayload = VisitRequestFormValues;

export type SubmitVisitRequestResponse = {
   requestId: string;
   submittedAt: string;
   status?: 'pending' | 'submitted';
   message?: string;
};

export type SelfServiceVisitRequest = {
   requestId: string;
   status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired';
   submittedAt: string;
   purpose: string;
   hostId: string;
   hostName?: string;
   departmentId: string;
   departmentName?: string;
   startDate: string;
   endDate: string;
   startTime: string;
   endTime: string;
   visitors: Array<{
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      organization?: string;
   }>;
};
