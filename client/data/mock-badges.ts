import type { ManagedVisit, ManagedVisitor } from '@/types/visit.types';

export type MockBadge = {
   number: string;
   qrCode: string;
   poolStatus: 'available' | 'in_use';
};

/** Desk badge inventory used until the badges API is wired. */
export const MOCK_BADGE_POOL: MockBadge[] = [
   { number: 'B-1021', qrCode: 'QR-B-1021', poolStatus: 'available' },
   { number: 'B-1022', qrCode: 'QR-B-1022', poolStatus: 'available' },
   { number: 'B-1023', qrCode: 'QR-B-1023', poolStatus: 'available' },
   { number: 'B-1024', qrCode: 'QR-B-1024', poolStatus: 'available' },
   { number: 'B-1025', qrCode: 'QR-B-1025', poolStatus: 'available' },
   { number: 'B-1026', qrCode: 'QR-B-1026', poolStatus: 'available' },
   { number: 'B-1027', qrCode: 'QR-B-1027', poolStatus: 'in_use' },
   { number: 'B-1028', qrCode: 'QR-B-1028', poolStatus: 'in_use' },
   { number: 'B-1029', qrCode: 'QR-B-1029', poolStatus: 'available' },
   { number: 'B-1030', qrCode: 'QR-B-1030', poolStatus: 'available' },
];

export function normalizeBadgeCode(value: string) {
   const trimmed = value.trim().toUpperCase();
   if (!trimmed) return '';

   const fromQr = trimmed.match(/^QR[-_]?B[-_]?(\d+)$/i);
   if (fromQr?.[1]) {
      return `B-${fromQr[1].padStart(4, '0')}`;
   }

   if (trimmed.startsWith('B-')) return trimmed;

   const digits = trimmed.replace(/\D/g, '');
   if (digits.length >= 3 && digits.length <= 4) {
      return `B-${digits.padStart(4, '0')}`;
   }

   return trimmed;
}

export function findMockBadge(code: string) {
   const normalized = normalizeBadgeCode(code);
   return (
      MOCK_BADGE_POOL.find(
         (badge) =>
            badge.number === normalized ||
            badge.qrCode.toUpperCase() === code.trim().toUpperCase() ||
            badge.number === code.trim().toUpperCase(),
      ) ?? null
   );
}

export function getAssignedBadgeNumbers(visits: ManagedVisit[]) {
   const assigned = new Set<string>();
   for (const visit of visits) {
      for (const visitor of visit.visitors) {
         if (
            visitor.attendanceStatus === 'checked_in' &&
            visitor.assignedBadgeNumber
         ) {
            assigned.add(normalizeBadgeCode(visitor.assignedBadgeNumber));
         }
      }
   }
   return assigned;
}

export function resolveAvailableBadges(visits: ManagedVisit[] = []) {
   const assigned = getAssignedBadgeNumbers(visits);
   return MOCK_BADGE_POOL.filter((badge) => {
      if (badge.poolStatus === 'in_use') return false;
      if (assigned.has(badge.number)) return false;
      return true;
   });
}

export function withAssignedBadges(
   visit: ManagedVisit,
   assignments: Record<string, string>,
): ManagedVisit {
   return {
      ...visit,
      visitors: visit.visitors.map((visitor) => {
         const badgeNumber = assignments[visitor.id];
         if (!badgeNumber) return visitor;
         const badge = findMockBadge(badgeNumber);
         return {
            ...visitor,
            assignedBadgeNumber: normalizeBadgeCode(badgeNumber),
            assignedBadgeQr: badge?.qrCode,
         } satisfies ManagedVisitor;
      }),
   };
}
