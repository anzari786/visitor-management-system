import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';
import type { BadgePrintJob } from '@/types/print-job.types';

const BASE = '/visit-attendance';

export type CheckInRequest = {
   visitParticipantId: number;
   visitDayId: number;
   retainPersonalId?: boolean;
};

export type AttendanceDetail = {
   id: string;
   status: string;
   badgeToken?: string;
   badgePrintedAt?: string;
   checkInAt?: string;
   checkOutAt?: string;
   printJob?: BadgePrintJob;
   visitor?: {
      id: string;
      firstName: string;
      lastName: string;
      phone?: string;
      email?: string;
      organization?: string;
   };
   visit?: {
      id: string;
      visitCode: string;
      status: string;
      floor?: string;
      room?: string;
      hostName?: string;
   };
   visitDay?: {
      id: string;
      date: string;
   };
};

export type BadgeCheckOutLookupApi = {
   eligibleForCheckOut: boolean;
   reason?: string;
   badgeToken: string;
   attendance: AttendanceDetail | null;
};

export const visitAttendanceService = {
   checkIn(input: CheckInRequest) {
      return api.post<ApiResponse<AttendanceDetail>>(`${BASE}/check-in`, input);
   },

   checkOut(attendanceId: string | number) {
      return api.post<ApiResponse<AttendanceDetail>>(
         `${BASE}/${attendanceId}/check-out`,
      );
   },

   lookupVisit(code: string, date?: string) {
      return api.get<ApiResponse<unknown>>(`${BASE}/lookup/visit`, {
         params: { code: code.trim(), date },
      });
   },

   lookupBadge(code: string) {
      return api.get<ApiResponse<BadgeCheckOutLookupApi>>(
         `${BASE}/lookup/badge`,
         { params: { code: code.trim() } },
      );
   },

   getPrintStatus(attendanceId: string | number) {
      return api.get<ApiResponse<BadgePrintJob | null>>(
         `${BASE}/${attendanceId}/print-status`,
      );
   },

   retryPrint(attendanceId: string | number) {
      return api.post<ApiResponse<BadgePrintJob>>(
         `${BASE}/${attendanceId}/retry-print`,
      );
   },
};
