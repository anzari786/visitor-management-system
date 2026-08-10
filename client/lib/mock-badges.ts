import type { Badge, BadgeStats } from '@/types/badge.types';

function qrToken(seed: string) {
   return `qr_${seed.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${seed.length * 17}`;
}

const initialBadges: Badge[] = [
   {
      id: 1,
      badgeNumber: 'B-1024',
      qrToken: qrToken('B-1024'),
      status: 'available',
      notes: null,
      assignedTo: null,
      assignedAt: null,
      lastUsedAt: '2026-08-04',
      lastAssignedAt: '2026-08-04',
      createdAt: '2026-01-12T09:00:00.000Z',
      assignmentHistory: [
         {
            id: 1,
            visitorName: 'Sara Bekele',
            visitCode: 'VIS-2026-00391',
            assignedAt: '2026-08-04',
            releasedAt: '2026-08-04',
         },
      ],
   },
   {
      id: 2,
      badgeNumber: 'B-1025',
      qrToken: qrToken('B-1025'),
      status: 'assigned',
      notes: null,
      assignedTo: 'Helen Tadesse',
      assignedAt: '2026-08-10',
      lastUsedAt: '2026-08-10',
      lastAssignedAt: '2026-08-10',
      createdAt: '2026-01-12T09:00:00.000Z',
      assignmentHistory: [
         {
            id: 2,
            visitorName: 'Helen Tadesse',
            visitCode: 'VIS-2026-00441',
            assignedAt: '2026-08-10',
            releasedAt: null,
         },
         {
            id: 3,
            visitorName: 'Dawit Alemu',
            visitCode: 'VIS-2026-00402',
            assignedAt: '2026-08-02',
            releasedAt: '2026-08-02',
         },
      ],
   },
   {
      id: 3,
      badgeNumber: 'B-1026',
      qrToken: qrToken('B-1026'),
      status: 'available',
      notes: null,
      assignedTo: null,
      assignedAt: null,
      lastUsedAt: '2026-08-06',
      lastAssignedAt: '2026-08-06',
      createdAt: '2026-01-15T09:00:00.000Z',
      assignmentHistory: [
         {
            id: 4,
            visitorName: 'Yonas Gebre',
            visitCode: 'VIS-2026-00418',
            assignedAt: '2026-08-06',
            releasedAt: '2026-08-06',
         },
      ],
   },
   {
      id: 4,
      badgeNumber: 'B-1027',
      qrToken: qrToken('B-1027'),
      status: 'available',
      notes: null,
      assignedTo: null,
      assignedAt: null,
      lastUsedAt: '2026-08-05',
      lastAssignedAt: '2026-08-05',
      createdAt: '2026-01-15T09:00:00.000Z',
      assignmentHistory: [
         {
            id: 5,
            visitorName: 'Peter Nkosi',
            visitCode: 'VIS-2026-00428',
            assignedAt: '2026-08-05',
            releasedAt: '2026-08-05',
         },
      ],
   },
   {
      id: 5,
      badgeNumber: 'B-1028',
      qrToken: qrToken('B-1028'),
      status: 'assigned',
      notes: null,
      assignedTo: 'Marta Haile',
      assignedAt: '2026-08-09',
      lastUsedAt: '2026-08-09',
      lastAssignedAt: '2026-08-09',
      createdAt: '2026-02-01T09:00:00.000Z',
      assignmentHistory: [
         {
            id: 6,
            visitorName: 'Marta Haile',
            visitCode: 'VIS-2026-00435',
            assignedAt: '2026-08-09',
            releasedAt: null,
         },
      ],
   },
   {
      id: 6,
      badgeNumber: 'B-1029',
      qrToken: qrToken('B-1029'),
      status: 'available',
      notes: null,
      assignedTo: null,
      assignedAt: null,
      lastUsedAt: '2026-07-28',
      lastAssignedAt: '2026-07-28',
      createdAt: '2026-02-01T09:00:00.000Z',
      assignmentHistory: [],
   },
   {
      id: 7,
      badgeNumber: 'B-1030',
      qrToken: qrToken('B-1030'),
      status: 'lost',
      notes: null,
      assignedTo: null,
      assignedAt: null,
      lastUsedAt: '2026-07-15',
      lastAssignedAt: '2026-07-15',
      createdAt: '2026-02-10T09:00:00.000Z',
      assignmentHistory: [
         {
            id: 7,
            visitorName: 'Abel Mekonnen',
            visitCode: 'VIS-2026-00355',
            assignedAt: '2026-07-15',
            releasedAt: '2026-07-15',
         },
      ],
   },
   {
      id: 8,
      badgeNumber: 'B-1031',
      qrToken: qrToken('B-1031'),
      status: 'assigned',
      notes: null,
      assignedTo: 'Liya Assefa',
      assignedAt: '2026-08-10',
      lastUsedAt: '2026-08-10',
      lastAssignedAt: '2026-08-10',
      createdAt: '2026-02-10T09:00:00.000Z',
      assignmentHistory: [
         {
            id: 8,
            visitorName: 'Liya Assefa',
            visitCode: 'VIS-2026-00442',
            assignedAt: '2026-08-10',
            releasedAt: null,
         },
      ],
   },
   {
      id: 9,
      badgeNumber: 'B-1032',
      qrToken: qrToken('B-1032'),
      status: 'available',
      notes: null,
      assignedTo: null,
      assignedAt: null,
      lastUsedAt: null,
      lastAssignedAt: null,
      createdAt: '2026-03-01T09:00:00.000Z',
      assignmentHistory: [],
   },
   {
      id: 10,
      badgeNumber: 'B-1033',
      qrToken: qrToken('B-1033'),
      status: 'available',
      notes: null,
      assignedTo: null,
      assignedAt: null,
      lastUsedAt: '2026-08-01',
      lastAssignedAt: '2026-08-01',
      createdAt: '2026-03-01T09:00:00.000Z',
      assignmentHistory: [],
   },
   {
      id: 11,
      badgeNumber: 'B-1034',
      qrToken: qrToken('B-1034'),
      status: 'assigned',
      notes: null,
      assignedTo: 'Samuel Girma',
      assignedAt: '2026-08-08',
      lastUsedAt: '2026-08-08',
      lastAssignedAt: '2026-08-08',
      createdAt: '2026-03-12T09:00:00.000Z',
      assignmentHistory: [
         {
            id: 9,
            visitorName: 'Samuel Girma',
            visitCode: 'VIS-2026-00430',
            assignedAt: '2026-08-08',
            releasedAt: null,
         },
      ],
   },
   {
      id: 12,
      badgeNumber: 'B-1035',
      qrToken: qrToken('B-1035'),
      status: 'available',
      notes: null,
      assignedTo: null,
      assignedAt: null,
      lastUsedAt: '2026-07-22',
      lastAssignedAt: '2026-07-22',
      createdAt: '2026-03-12T09:00:00.000Z',
      assignmentHistory: [],
   },
   {
      id: 13,
      badgeNumber: 'B-1036',
      qrToken: qrToken('B-1036'),
      status: 'inactive',
      notes: null,
      assignedTo: null,
      assignedAt: null,
      lastUsedAt: '2026-06-18',
      lastAssignedAt: '2026-06-18',
      createdAt: '2026-04-01T09:00:00.000Z',
      assignmentHistory: [],
   },
   {
      id: 14,
      badgeNumber: 'B-1037',
      qrToken: qrToken('B-1037'),
      status: 'available',
      notes: null,
      assignedTo: null,
      assignedAt: null,
      lastUsedAt: null,
      lastAssignedAt: null,
      createdAt: '2026-04-01T09:00:00.000Z',
      assignmentHistory: [],
   },
   {
      id: 15,
      badgeNumber: 'B-1038',
      qrToken: qrToken('B-1038'),
      status: 'available',
      notes: null,
      assignedTo: null,
      assignedAt: null,
      lastUsedAt: '2026-08-03',
      lastAssignedAt: '2026-08-03',
      createdAt: '2026-04-20T09:00:00.000Z',
      assignmentHistory: [],
   },
];

let badges: Badge[] = structuredClone(initialBadges);
let nextId = Math.max(...badges.map((b) => b.id)) + 1;

function delay(ms = 250) {
   return new Promise((resolve) => setTimeout(resolve, ms));
}

export function computeBadgeStats(list: Badge[]): BadgeStats {
   return {
      total: list.length,
      available: list.filter((b) => b.status === 'available').length,
      assigned: list.filter((b) => b.status === 'assigned').length,
      lost: list.filter((b) => b.status === 'lost').length,
      inactive: list.filter((b) => b.status === 'inactive').length,
   };
}

export const mockBadgesStore = {
   async list(): Promise<Badge[]> {
      await delay();
      return structuredClone(badges).sort((a, b) =>
         a.badgeNumber.localeCompare(b.badgeNumber, undefined, {
            numeric: true,
         }),
      );
   },

   async getById(id: number): Promise<Badge> {
      await delay();
      const badge = badges.find((b) => b.id === id);
      if (!badge) {
         throw Object.assign(new Error('Badge not found'), { status: 404 });
      }
      return structuredClone(badge);
   },

   async create(badgeNumber: string, qrToken: string): Promise<Badge> {
      await delay();
      const normalizedNumber = badgeNumber.trim().toUpperCase();
      const normalizedQr = qrToken.trim();

      if (!normalizedQr) {
         throw Object.assign(new Error('Badge QR code is required'), {
            status: 400,
         });
      }

      if (
         badges.some((b) => b.badgeNumber.toUpperCase() === normalizedNumber)
      ) {
         throw Object.assign(
            new Error('A badge with this number already exists'),
            { status: 409 },
         );
      }

      if (
         badges.some(
            (b) => b.qrToken.toLowerCase() === normalizedQr.toLowerCase(),
         )
      ) {
         throw Object.assign(
            new Error('A badge with this QR code already exists'),
            { status: 409 },
         );
      }

      const badge: Badge = {
         id: nextId++,
         badgeNumber: normalizedNumber,
         qrToken: normalizedQr,
         status: 'available',
         notes: null,
         assignedTo: null,
         assignedAt: null,
         lastUsedAt: null,
         lastAssignedAt: null,
         createdAt: new Date().toISOString(),
         assignmentHistory: [],
      };

      badges = [...badges, badge];
      return structuredClone(badge);
   },

   async updateStatus(
      id: number,
      status: 'inactive' | 'lost' | 'available',
      reason?: string,
   ): Promise<Badge> {
      await delay();
      const index = badges.findIndex((b) => b.id === id);
      if (index === -1) {
         throw Object.assign(new Error('Badge not found'), { status: 404 });
      }

      const current = badges[index];

      if (status === 'lost' && current.status === 'inactive') {
         throw Object.assign(
            new Error('Inactive badges cannot be marked as lost'),
            { status: 400 },
         );
      }

      if (status === 'inactive' && current.status === 'lost') {
         throw Object.assign(
            new Error('Lost badges cannot be deactivated'),
            { status: 400 },
         );
      }

      const trimmedReason = reason?.trim();
      const notes =
         trimmedReason
            ? current.notes
               ? `${current.notes}
[${new Date().toISOString()}] ${trimmedReason}`
               : `[${new Date().toISOString()}] ${trimmedReason}`
            : current.notes;

      const updated: Badge = {
         ...current,
         status,
         notes,
         assignedTo:
            status === 'inactive' || status === 'lost' || status === 'available'
               ? null
               : current.assignedTo,
         assignedAt:
            status === 'inactive' || status === 'lost' || status === 'available'
               ? null
               : current.assignedAt,
      };

      badges = badges.map((b, i) => (i === index ? updated : b));
      return structuredClone(updated);
   },

   suggestNextNumber(): string {
      const numbers = badges
         .map((b) => {
            const match = b.badgeNumber.match(/(\d+)$/);
            return match ? Number(match[1]) : 0;
         })
         .filter((n) => n > 0);

      const next = (numbers.length ? Math.max(...numbers) : 1000) + 1;
      return `B-${next}`;
   },
};
