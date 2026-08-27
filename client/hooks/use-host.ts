import { hostService } from '@/services/host.service';
import type { ApiErrorResponse } from '@/types/api.types';
import type {
   ApproveHostVisitPayload,
   CancelHostVisitPayload,
   HostVisit,
   HostVisitsParams,
   RejectHostVisitPayload,
   RescheduleHostVisitPayload,
} from '@/types/host.types';
import {
   keepPreviousData,
   useMutation,
   useQuery,
   useQueryClient,
} from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { format, parseISO } from 'date-fns';

type ApiError = AxiosError<ApiErrorResponse>;

export const hostQueryKeys = {
   all: ['host'] as const,
   visits: () => [...hostQueryKeys.all, 'visits'] as const,
   pendingVisits: (params?: HostVisitsParams) =>
      [...hostQueryKeys.visits(), 'pending', params ?? {}] as const,
   upcomingVisits: (params?: HostVisitsParams) =>
      [...hostQueryKeys.visits(), 'upcoming', params ?? {}] as const,
   visitList: (params?: HostVisitsParams) =>
      [...hostQueryKeys.visits(), 'list', params ?? {}] as const,
   visitDetail: (id: string) =>
      [...hostQueryKeys.visits(), 'detail', id] as const,
} as const;

function invalidateHostVisits(queryClient: ReturnType<typeof useQueryClient>) {
   queryClient.invalidateQueries({ queryKey: hostQueryKeys.visits() });
}

function normalizeMeetingType(value?: string): string {
   const normalized = (value ?? '').trim();
   if (!normalized) return 'Meeting';

   const mapping: Record<string, string> = {
      MEETING: 'Meeting',
      INTERVIEW: 'Interview',
      DELIVERY: 'Delivery',
      OFFICIAL_VISIT: 'Official Visit',
      OFFICIALVISIT: 'Official Visit',
      MAINTENANCE: 'Maintenance',
      OTHER: 'Other',
      SITE_VISIT: 'Site Visit',
      AUDIT: 'Audit',
      TRAINING: 'Training',
      VENDOR_REVIEW: 'Vendor Review',
   };

   return mapping[normalized.toUpperCase()] ?? normalized;
}

function normalizeStatus(value?: string): HostVisit['status'] {
   const normalized = (value ?? '').toUpperCase();

   if (normalized.includes('PENDING')) return 'pending';
   if (normalized.includes('APPROVED')) return 'approved';
   if (normalized.includes('RESCHEDULED')) return 'rescheduled';
   if (normalized.includes('REJECTED')) return 'rejected';
   if (normalized.includes('CANCEL')) return 'cancelled';
   if (normalized.includes('CHECKED_OUT')) return 'completed';
   if (normalized.includes('CHECKED_IN')) return 'upcoming';
   if (normalized.includes('UPCOMING')) return 'upcoming';

   return 'pending';
}

function mapVisitToHostCard(visit: any): HostVisit {
   const scheduleDates = Array.isArray(visit.scheduleDates)
      ? visit.scheduleDates
      : visit.startDate
        ? [visit.startDate]
        : [];
   const parsedStartDate = scheduleDates[0] ?? visit.startDate;
   const parsedEndDate = Array.isArray(visit.scheduleDates)
      ? visit.scheduleDates[visit.scheduleDates.length - 1]
      : visit.endDate;

   const visitorNames = Array.isArray(visit.visitors)
      ? visit.visitors
           .map((visitor: any) =>
              `${visitor.firstName ?? ''} ${visitor.lastName ?? ''}`.trim(),
           )
           .filter(Boolean)
      : Array.isArray(visit.visitorNames)
        ? visit.visitorNames
        : [];

   const startTime = visit.startTime ?? visit.expectedStartTime;
   const endTime = visit.endTime ?? visit.expectedEndTime;

   const startDateValue = parsedStartDate ? format(parseISO(parsedStartDate), 'd MMM yyyy') : '—';
   const endDateValue = parsedEndDate
      ? format(parseISO(parsedEndDate), 'd MMM yyyy')
      : undefined;

   return {
      id: String(visit.id),
      visitorName: visitorNames.join(', ') || 'Visitor',
      isGroup: visit.groupType === 'GROUP' || visit.groupType === 'group',
      groupSize: visit.expectedVisitorCount ?? visit.groupSize,
      orgName: visit.organization ?? visit.orgName,
      meetingType: normalizeMeetingType(visit.purpose ?? visit.meetingType),
      purpose: normalizeMeetingType(visit.purpose ?? visit.meetingType),
      startDate: startDateValue,
      endDate: endDateValue,
      time: String(startTime ?? '').slice(0, 5),
      endTime: String(endTime ?? '').slice(0, 5),
      isMultiDay:
         visit.durationType === 'MULTI_DAY' ||
         visit.isMultiDay ||
         (Array.isArray(visit.scheduleDates) && visit.scheduleDates.length > 1),
      floor: visit.floor,
      room: visit.room,
      status: normalizeStatus(visit.status),
   };
}

export function useHostPendingVisits(params?: HostVisitsParams) {
   return useQuery({
      queryKey: hostQueryKeys.pendingVisits(params),
      queryFn: async () =>
         (await hostService.getPendingVisits(params)).data.data.map(
            mapVisitToHostCard,
         ),
      placeholderData: keepPreviousData,
   });
}

export function useHostUpcomingVisits(params?: HostVisitsParams) {
   return useQuery({
      queryKey: hostQueryKeys.upcomingVisits(params),
      queryFn: async () =>
         (await hostService.getUpcomingVisits(params)).data.data.map(
            mapVisitToHostCard,
         ),
      placeholderData: keepPreviousData,
   });
}

export function useApproveHostVisit() {
   const queryClient = useQueryClient();
   return useMutation<
      HostVisit,
      ApiError,
      { id: string; payload: ApproveHostVisitPayload }
   >({
      mutationFn: async ({ id, payload }) =>
         (await hostService.approveVisit(id, payload)).data.data,
      onSuccess: (updated) => {
         invalidateHostVisits(queryClient);
         queryClient.setQueryData(
            hostQueryKeys.visitDetail(updated.id),
            updated,
         );
      },
   });
}

export function useRejectHostVisit() {
   const queryClient = useQueryClient();
   return useMutation<
      HostVisit,
      ApiError,
      { id: string; payload?: RejectHostVisitPayload }
   >({
      mutationFn: async ({ id, payload }) =>
         (await hostService.rejectVisit(id, payload)).data.data,
      onSuccess: () => invalidateHostVisits(queryClient),
   });
}

export function useRescheduleHostVisit() {
   const queryClient = useQueryClient();
   return useMutation<
      HostVisit,
      ApiError,
      { id: string; payload: RescheduleHostVisitPayload }
   >({
      mutationFn: async ({ id, payload }) =>
         (await hostService.rescheduleVisit(id, payload)).data.data,
      onSuccess: (updated) => {
         invalidateHostVisits(queryClient);
         queryClient.setQueryData(
            hostQueryKeys.visitDetail(updated.id),
            updated,
         );
      },
   });
}

export function useCancelHostVisit() {
   const queryClient = useQueryClient();
   return useMutation<
      HostVisit,
      ApiError,
      { id: string; payload?: CancelHostVisitPayload }
   >({
      mutationFn: async ({ id, payload }) =>
         (await hostService.cancelVisit(id, payload)).data.data,
      onSuccess: () => invalidateHostVisits(queryClient),
   });
}

