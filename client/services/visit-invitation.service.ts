import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';
import type { CreateHostInvitationApiPayload } from '@/lib/map-host-invitation';

export type VisitRegistrationProgress = {
   expectedVisitorCount: number;
   registeredCount: number;
   remainingSlots: number;
   isFull: boolean;
   participants: Array<{
      participantId: string;
      visitor: {
         firstName: string;
         lastName: string;
         organization?: string;
      };
   }>;
};

export type InvitationPreview = {
   visitCode: string;
   purpose: string;
   organization?: string;
   expectedVisitorCount: number;
   registeredCount: number;
   remainingSlots: number;
   isFull: boolean;
   isActive: boolean;
   hostName?: string;
   departmentName?: string;
   floor?: string;
   room?: string;
   startDate: string;
   endDate: string;
   startTime: string;
   endTime: string;
   scheduleDates: string[];
};

export type HostInvitationCreated = {
   id: string;
   visitCode: string;
   expectedVisitorCount: number;
   registeredCount: number;
   remainingSlots: number;
   organization?: string;
   registration?: {
      registrationUrl: string;
      expiresAt?: string;
      registrationToken?: string;
   };
};

export type RegisterVisitorPayload = {
   firstName: string;
   lastName: string;
   phone: string;
   email?: string;
   organization?: string;
   idType: string;
   idNumber: string;
};

export type RegistrationResult = {
   participantId: string;
   visitorId: string;
   visitId: string;
   progress: VisitRegistrationProgress;
};

export const visitInvitationService = {
   createHostInvitation(payload: CreateHostInvitationApiPayload) {
      return api.post<ApiResponse<HostInvitationCreated>>('/visits/invite', payload);
   },

   getInvitationPreview(token: string) {
      return api.get<ApiResponse<InvitationPreview>>(
         `/visits/invitations/${token}`,
      );
   },

   registerViaInvitation(token: string, payload: RegisterVisitorPayload) {
      return api.post<ApiResponse<RegistrationResult>>(
         `/visits/invitations/${token}/register`,
         payload,
      );
   },

   registerVisitorAtVisit(visitId: string, payload: RegisterVisitorPayload) {
      return api.post<ApiResponse<RegistrationResult>>(
         `/visits/${visitId}/register-visitor`,
         payload,
      );
   },

   getRegistrationProgress(visitId: string) {
      return api.get<ApiResponse<VisitRegistrationProgress>>(
         `/visits/${visitId}/registration-progress`,
      );
   },
};
