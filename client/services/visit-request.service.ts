import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';
import type { VisitRequestFormValues } from '@/lib/validations/visit-request.schema';
import {
   HOST_EMPLOYEES,
   VISIT_PURPOSE_OPTIONS,
   VISIT_REQUEST_DEPARTMENTS,
} from '@/constants/visit-request';
import { ID_TYPE_OPTIONS } from '@/constants/visit';
import { format, isSameDay } from 'date-fns';
import type {
   RejectVisitRequestPayload,
   SubmitVisitRequestApiPayload,
   SubmitVisitRequestResponse,
   VisitRequest,
   VisitRequestsPaginatedData,
   VisitRequestsParams,
} from '@/types/visit-request.types';

export type SubmitVisitRequestPayload = VisitRequestFormValues;

function toApiPayload(
   payload: SubmitVisitRequestPayload,
): SubmitVisitRequestApiPayload {
   const host = HOST_EMPLOYEES.find((h) => h.id === payload.hostId);
   const department = VISIT_REQUEST_DEPARTMENTS.find(
      (d) => d.id === payload.departmentId,
   );

   if (!host) {
      throw new Error(
         'The selected host employee could not be found. Please go back and choose a host.',
      );
   }

   if (!department) {
      throw new Error(
         'A valid department is required. Please go back and select a department.',
      );
   }

   if (!host.departmentId) {
      throw new Error(
         'The selected host does not have a department assigned. Please choose another host.',
      );
   }

   if (host.departmentId !== payload.departmentId) {
      throw new Error(
         'The selected host is not part of the selected department. Please choose a valid host or update the department.',
      );
   }

   if (payload.endDate < payload.startDate) {
      throw new Error(
         'End date cannot be before start date. Please update the visit schedule.',
      );
   }

   return {
      visitors: payload.visitors.map((visitor) => ({
         firstName: visitor.firstName,
         lastName: visitor.lastName,
         email: visitor.email,
         phone: visitor.phone,
         idType: visitor.idType,
         idNumber: visitor.idNumber,
         organization: visitor.organization,
      })),
      hostName: host.name,
      departmentCode: department.id,
      purpose: payload.purpose,
      startDate: format(payload.startDate, 'yyyy-MM-dd'),
      endDate: format(payload.endDate, 'yyyy-MM-dd'),
      startTime: payload.startTime,
      endTime: payload.endTime,
   };
}

export async function submitVisitRequest(
   payload: SubmitVisitRequestPayload,
): Promise<SubmitVisitRequestResponse> {
   if (!payload.visitors?.length) {
      throw new Error('At least one visitor is required to submit a request.');
   }

   const body = toApiPayload(payload);
   const { data } = await api.post<
      ApiResponse<SubmitVisitRequestResponse & VisitRequest>
   >('/visit-requests', body);

   return {
      requestId: data.data.requestId,
      id: data.data.id,
      submittedAt: data.data.submittedAt,
   };
}

export const visitRequestsService = {
   getAll(params: VisitRequestsParams) {
      return api.get<ApiResponse<VisitRequestsPaginatedData>>(
         '/visit-requests',
         { params },
      );
   },

   getById(id: number) {
      return api.get<ApiResponse<VisitRequest>>(`/visit-requests/${id}`);
   },

   approve(id: number) {
      return api.patch<ApiResponse<VisitRequest>>(
         `/visit-requests/${id}/approve`,
      );
   },

   reject({ id, reason }: RejectVisitRequestPayload) {
      return api.patch<ApiResponse<VisitRequest>>(
         `/visit-requests/${id}/reject`,
         { reason },
      );
   },
};

export function getIdTypeLabel(value: string) {
   return ID_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function getPurposeLabel(value: string) {
   return VISIT_PURPOSE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function getHostName(hostId: string) {
   return HOST_EMPLOYEES.find((h) => h.id === hostId)?.name;
}

export function getDepartmentName(departmentId: string) {
   return VISIT_REQUEST_DEPARTMENTS.find((d) => d.id === departmentId)?.name;
}

export function formatVisitTime(time: string) {
   if (!time) return '';
   const [hours, minutes] = time.split(':').map(Number);
   if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;

   const period = hours >= 12 ? 'PM' : 'AM';
   const hour12 = hours % 12 || 12;
   return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

export function formatVisitDateRange(startDate: Date, endDate: Date) {
   if (isSameDay(startDate, endDate)) {
      return format(startDate, 'PPP');
   }
   return `${format(startDate, 'PPP')} – ${format(endDate, 'PPP')}`;
}
