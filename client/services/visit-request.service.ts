import type { VisitRequestFormValues } from '@/lib/validations/visit-request.schema';
import {
   HOST_EMPLOYEES,
   VISIT_PURPOSE_OPTIONS,
   VISIT_REQUEST_DEPARTMENTS,
} from '@/constants/visit-request';
import { ID_TYPE_OPTIONS } from '@/constants/visit';
import { format, isSameDay } from 'date-fns';

export type SubmitVisitRequestResponse = {
   requestId: string;
   submittedAt: string;
};

export type SubmitVisitRequestPayload = VisitRequestFormValues;

/** Temporary client-side submission until a public visit-request API exists. */
export async function submitVisitRequest(
   payload: SubmitVisitRequestPayload,
): Promise<SubmitVisitRequestResponse> {
   await new Promise((resolve) => setTimeout(resolve, 1200));

   if (!payload.visitors?.length) {
      throw new Error('At least one visitor is required to submit a request.');
   }

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
      requestId: `VR-${Date.now().toString(36).toUpperCase()}`,
      submittedAt: new Date().toISOString(),
   };
}

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
