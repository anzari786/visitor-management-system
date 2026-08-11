import { api } from '@/lib/axios';
import {
   canCheckIn,
   canCheckOut,
   getCheckInEligibleVisitors,
   getCheckOutEligibleVisitors,
} from '@/lib/visit-attendance';
import type { ApiResponse } from '@/types/api.types';
import type { ManagedVisit, ManagedVisitor } from '@/types/visit.types';
import {
   findMockBadge,
   normalizeBadgeCode,
   resolveAvailableBadges,
} from '@/data/mock-badges';
import { AxiosError } from 'axios';

/**
 * Lookup contracts mirror the v2 visit-attendance QR endpoints:
 * GET /visit-attendances/lookup/visit?code=
 * GET /visit-attendances/lookup/badge?code=
 * GET /badges?search= (availability)
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
   badgeNumber: string;
   eligibleForCheckOut: boolean;
   reason?: string;
};

export type BadgeAvailabilityLookupResult = {
   badgeNumber: string;
   qrCode?: string;
   available: boolean;
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
   badge: { id: string; badgeNumber: string; status: string };
   eligibleForCheckOut: boolean;
   reason?: string;
   attendance: null | {
      id: string;
      visit?: { id: string; visitCode?: string };
      visitor?: {
         firstName: string;
         lastName: string;
      };
      badge?: { badgeNumber: string };
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
   const badge = findMockBadge(code);
   const badgeNumber = badge?.number ?? normalizeBadgeCode(code);

   if (!badgeNumber) {
      throw new Error('Invalid badge QR code');
   }

   if (!badge) {
      throw new Error('Badge not found for the scanned QR code');
   }

   for (const visit of visits) {
      if (!canCheckOut(visit)) continue;
      const matched = getCheckOutEligibleVisitors(visit).filter(
         (visitor) =>
            visitor.assignedBadgeNumber &&
            normalizeBadgeCode(visitor.assignedBadgeNumber) === badgeNumber,
      );
      if (matched.length > 0) {
         return {
            visit,
            visitors: matched,
            badgeNumber,
            eligibleForCheckOut: true,
         };
      }
   }

   // Fallback: match by display badge derived from visit id (legacy desk flow).
   const digits = badgeNumber.replace(/\D/g, '').slice(-4);
   const legacy = visits.find((visit) => {
      if (!canCheckOut(visit)) return false;
      const visitDigits = visit.id.replace(/\D/g, '').slice(-4);
      return visitDigits === digits;
   });

   if (legacy) {
      return {
         visit: legacy,
         visitors: getCheckOutEligibleVisitors(legacy),
         badgeNumber,
         eligibleForCheckOut: true,
      };
   }

   return {
      visit: visits[0] ?? ({} as ManagedVisit),
      visitors: [],
      badgeNumber,
      eligibleForCheckOut: false,
      reason: 'No checked-in visitor is assigned to this badge',
   };
}

function mockLookupBadgeAvailability(
   code: string,
   visits: ManagedVisit[],
): BadgeAvailabilityLookupResult {
   const badge = findMockBadge(code);
   if (!badge) {
      return {
         badgeNumber: normalizeBadgeCode(code) || code.trim().toUpperCase(),
         available: false,
         reason: 'Badge not found in the available pool',
      };
   }

   const available = resolveAvailableBadges(visits).some(
      (item) => item.number === badge.number,
   );

   return {
      badgeNumber: badge.number,
      qrCode: badge.qrCode,
      available,
      reason: available
         ? undefined
         : badge.poolStatus === 'in_use'
           ? 'This badge is already in use'
           : 'This badge is already assigned',
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
            '/visit-attendances/lookup/visit',
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
            '/visit-attendances/lookup/badge',
            { params: { code: code.trim() } },
         );
         const payload = data.data;
         const badgeNumber = payload.badge.badgeNumber;
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
               badgeNumber,
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

         const visitors = getCheckOutEligibleVisitors(visit).filter(
            (visitor) =>
               !visitor.assignedBadgeNumber ||
               normalizeBadgeCode(visitor.assignedBadgeNumber) ===
                  normalizeBadgeCode(badgeNumber),
         );

         return {
            visit,
            visitors: visitors.length
               ? visitors
               : getCheckOutEligibleVisitors(visit),
            badgeNumber,
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

   async lookupBadgeAvailability(
      code: string,
      visits: ManagedVisit[],
   ): Promise<BadgeAvailabilityLookupResult> {
      try {
         const normalized = normalizeBadgeCode(code);
         const { data } = await api.get<
            ApiResponse<Array<{ badgeNumber: string; status: string; qrToken?: string }>>
         >('/badges', {
            params: { search: normalized || code.trim(), limit: 5 },
         });

         const match = data.data.find(
            (badge) =>
               normalizeBadgeCode(badge.badgeNumber) === normalized ||
               badge.qrToken === code.trim(),
         );

         if (!match) {
            return mockLookupBadgeAvailability(code, visits);
         }

         const available = match.status === 'AVAILABLE';
         return {
            badgeNumber: match.badgeNumber,
            qrCode: match.qrToken,
            available,
            reason: available
               ? undefined
               : `Badge is not available (status: ${match.status})`,
         };
      } catch (error) {
         if (isRouteMissing(error)) {
            return mockLookupBadgeAvailability(code, visits);
         }
         if (error instanceof AxiosError) {
            throw new Error(
               error.response?.data?.message ??
                  'Unable to validate badge from QR code',
            );
         }
         throw error;
      }
   },
};
