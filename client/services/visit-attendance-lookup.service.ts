import { api } from '@/lib/axios';
import {
   canCheckIn,
   canCheckOut,
   getCheckInEligibleVisitors,
   getCheckOutEligibleVisitors,
} from '@/lib/visit-attendance';
import type { ApiResponse } from '@/types/api.types';
import type { ManagedVisit, ManagedVisitor } from '@/types/visit.types';
import { AxiosError } from 'axios';

/**
 * Lookup contracts mirror visit-attendance QR endpoints:
 * GET /visit-attendance/lookup/visit?code=
 * GET /visit-attendance/lookup/badge?code=
 */

export type VisitCheckInLookupResult = {
   visit: ManagedVisit;
   eligibleVisitors: ManagedVisitor[];
   eligibleForCheckIn: boolean;
   reason?: string;
};

export type BadgeCheckOutLookupResult = {
   visit: ManagedVisit;
   visitors: ManagedVisitor[];
   badgeToken: string;
   attendanceId?: string;
   eligibleForCheckOut: boolean;
   reason?: string;
};

type ApiVisitLookup = {
   visit: {
      id: string;
      visitCode: string;
      status: string;
      purpose?: string;
   };
   eligibleForCheckIn: boolean;
   reason?: string;
   visitors: Array<{
      participantId: string;
      canCheckIn: boolean;
      visitor: {
         id: string;
         firstName: string;
         lastName: string;
         phone?: string;
         email?: string;
         organization?: string;
         idType?: string;
         idNumber?: string;
      };
   }>;
};

type ApiBadgeLookup = {
   eligibleForCheckOut: boolean;
   reason?: string;
   badgeToken: string;
   attendance: null | {
      id: string;
      badgeToken?: string;
      visit?: { id: string; visitCode?: string };
      visitor?: {
         id?: string;
         firstName: string;
         lastName: string;
      };
   };
};

function normalizeVisitCode(code: string) {
   return code.trim().toUpperCase();
}

function isRouteMissing(error: unknown) {
   if (!(error instanceof AxiosError)) return false;
   const status = error.response?.status;
   // Unimplemented route or gateway miss — fall back to mock desk data.
   return status === 404 || status === 501 || status === 502 || !error.response;
}

function mockLookupVisitForCheckIn(
   code: string,
   visits: ManagedVisit[],
): VisitCheckInLookupResult {
   const normalized = normalizeVisitCode(code);
   const visit =
      visits.find((item) => {
         const id = item.id.toUpperCase();
         const token = item.qrToken?.toUpperCase();
         return (
            id === normalized ||
            token === normalized ||
            token === code.trim() ||
            `QR-${id}` === normalized
         );
      }) ?? null;

   if (!visit) {
      throw new Error('Visit not found for the scanned QR code');
   }

   const eligibleVisitors = getCheckInEligibleVisitors(visit);
   const eligibleForCheckIn = canCheckIn(visit);

   return {
      visit,
      eligibleVisitors,
      eligibleForCheckIn,
      reason: eligibleForCheckIn
         ? undefined
         : eligibleVisitors.length === 0
           ? 'No visitors are eligible for check-in on this visit right now'
           : 'Visit is not eligible for check-in',
   };
}

function mockLookupBadgeForCheckOut(
   code: string,
   visits: ManagedVisit[],
): BadgeCheckOutLookupResult {
   const token = code.trim();
   if (!token) {
      throw new Error('Invalid badge QR code');
   }

   for (const visit of visits) {
      if (!canCheckOut(visit)) continue;
      const matched = getCheckOutEligibleVisitors(visit).filter(
         (visitor) =>
            visitor.badgeToken &&
            visitor.badgeToken.trim() === token,
      );
      if (matched.length > 0) {
         return {
            visit,
            visitors: matched,
            badgeToken: token,
            attendanceId: matched[0]?.attendanceId,
            eligibleForCheckOut: true,
         };
      }
   }

   return {
      visit: visits[0] ?? ({} as ManagedVisit),
      visitors: [],
      badgeToken: token,
      eligibleForCheckOut: false,
      reason: 'No checked-in visitor found for this badge token',
   };
}

function mapApiVisitLookup(
   payload: ApiVisitLookup,
   fallbackVisits: ManagedVisit[],
): VisitCheckInLookupResult {
   const existing =
      fallbackVisits.find(
         (visit) =>
            visit.id === payload.visit.visitCode ||
            visit.id === payload.visit.id,
      ) ?? null;

   if (existing) {
      const eligibleVisitors = getCheckInEligibleVisitors(existing);
      return {
         visit: existing,
         eligibleVisitors,
         eligibleForCheckIn: payload.eligibleForCheckIn && canCheckIn(existing),
         reason: payload.reason,
      };
   }

   throw new Error(
      'Visit found by QR, but it is not loaded in the desk visit list yet',
   );
}

export const visitAttendanceLookupService = {
   async lookupVisitForCheckIn(
      code: string,
      visits: ManagedVisit[],
   ): Promise<VisitCheckInLookupResult> {
      try {
         const { data } = await api.get<ApiResponse<ApiVisitLookup>>(
            '/visit-attendance/lookup/visit',
            { params: { code: code.trim() } },
         );
         return mapApiVisitLookup(data.data, visits);
      } catch (error) {
         if (isRouteMissing(error)) {
            return mockLookupVisitForCheckIn(code, visits);
         }
         if (error instanceof AxiosError) {
            throw new Error(
               error.response?.data?.message ??
                  'Unable to look up visit from QR code',
            );
         }
         throw error;
      }
   },

   async lookupBadgeForCheckOut(
      code: string,
      visits: ManagedVisit[],
   ): Promise<BadgeCheckOutLookupResult> {
      try {
         const { data } = await api.get<ApiResponse<ApiBadgeLookup>>(
            '/visit-attendance/lookup/badge',
            { params: { code: code.trim() } },
         );
         const payload = data.data;
         const badgeToken = payload.badgeToken;

         if (!payload.eligibleForCheckOut || !payload.attendance) {
            if (!visits.length) {
               throw new Error(
                  payload.reason ??
                     'No checked-in visitor found for this badge',
               );
            }
            return {
               visit: visits[0]!,
               visitors: [],
               badgeToken,
               eligibleForCheckOut: false,
               reason: payload.reason,
            };
         }

         const visitCode =
            payload.attendance.visit?.visitCode ??
            payload.attendance.visit?.id;
         const visit =
            visits.find(
               (item) => item.id === visitCode || item.id === String(visitCode),
            ) ?? null;

         if (!visit) {
            return mockLookupBadgeForCheckOut(code, visits);
         }

         const visitorName = payload.attendance.visitor
            ? `${payload.attendance.visitor.firstName} ${payload.attendance.visitor.lastName}`.trim()
            : null;

         const visitors = getCheckOutEligibleVisitors(visit).filter(
            (visitor) => {
               if (
                  visitor.badgeToken &&
                  visitor.badgeToken === badgeToken
               ) {
                  return true;
               }
               if (
                  visitor.attendanceId &&
                  visitor.attendanceId === payload.attendance!.id
               ) {
                  return true;
               }
               if (visitorName && visitor.name === visitorName) {
                  return true;
               }
               return false;
            },
         );

         return {
            visit,
            visitors: visitors.length
               ? visitors
               : getCheckOutEligibleVisitors(visit),
            badgeToken,
            attendanceId: payload.attendance.id,
            eligibleForCheckOut: true,
         };
      } catch (error) {
         if (isRouteMissing(error)) {
            return mockLookupBadgeForCheckOut(code, visits);
         }
         if (error instanceof AxiosError) {
            throw new Error(
               error.response?.data?.message ??
                  'Unable to look up badge from QR code',
            );
         }
         throw error;
      }
   },
};
