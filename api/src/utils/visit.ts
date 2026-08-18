import {
   type AttendanceStatus,
   Prisma,
   type VisitStatus,
} from '../generated/prisma/client.js';
import { prisma } from '../config/prisma.js';

export type PublicVisitStatus =
   | 'active'
   | 'overstay'
   | 'completed'
   | 'cancelled';

export const visitInclude = {
   participants: {
      include: { visitor: true },
   },
   hostEmployee: true,
} satisfies Prisma.VisitInclude;

export type VisitWithRelations = Prisma.VisitGetPayload<{
   include: typeof visitInclude;
}>;

export async function getSettings() {
   const rows = await prisma.systemSetting.findMany({
      where: {
         key: {
            in: [
               'orgName',
               'badgePrefix',
               'overstayEnabled',
               'overstayAfterMins',
            ],
         },
      },
   });

   const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));

   return {
      orgName: map.orgName ?? 'VMS',
      badgePrefix: map.badgePrefix ?? 'VMS',
      overstayEnabled: map.overstayEnabled !== 'false',
      overstayAfterMins: Number(map.overstayAfterMins ?? 120),
   };
}

export function formatBadge(prefix: string, badgeNumber: string | number) {
   if (typeof badgeNumber === 'string' && badgeNumber.includes('-')) {
      return badgeNumber;
   }
   return `${prefix}-${String(badgeNumber).padStart(3, '0')}`;
}

/**
 * Public-facing visit status for badge QR lookup.
 * Derived from V2 visit + attendance rows (not the legacy Visit.status field).
 */
export function computeStatus(
   input: {
      visitStatus: VisitStatus;
      attendanceStatus: AttendanceStatus;
      checkInAt: Date | null;
      checkOutAt: Date | null;
   },
   settings: Awaited<ReturnType<typeof getSettings>>,
): PublicVisitStatus {
   if (input.visitStatus === 'CANCELLED') {
      return 'cancelled';
   }

   if (input.attendanceStatus === 'CHECKED_OUT' || input.checkOutAt) {
      return 'completed';
   }

   if (
      input.attendanceStatus === 'CHECKED_IN' &&
      input.checkInAt &&
      settings.overstayEnabled
   ) {
      const overstayMs = settings.overstayAfterMins * 60_000;
      if (Date.now() - input.checkInAt.getTime() >= overstayMs) {
         return 'overstay';
      }
   }

   return 'active';
}

export function toVisitDTO(visit: VisitWithRelations) {
   const primary = visit.participants[0]?.visitor;

   return {
      id: visit.id,
      visitCode: visit.visitCode,
      visitorName: primary
         ? `${primary.firstName} ${primary.lastName}`
         : '',
      phone: primary?.phone ?? '',
      idNumber: primary?.idNumber ?? '',
      idType: primary?.idType ?? null,
      host:
         visit.hostNameSnapshot ??
         (visit.hostEmployee
            ? `${visit.hostEmployee.firstName} ${visit.hostEmployee.lastName}`
            : ''),
      department: visit.departmentNameSnapshot ?? null,
      status: visit.status,
   };
}

export function dateRangeFor(dateFilter?: string) {
   if (!dateFilter || dateFilter === 'all') {
      return {};
   }

   const today = new Date();
   today.setHours(0, 0, 0, 0);

   switch (dateFilter) {
      case 'today': {
         const end = new Date();
         end.setHours(23, 59, 59, 999);

         return {
            gte: today,
            lte: end,
         };
      }

      case 'yesterday': {
         const start = new Date(today);
         start.setDate(start.getDate() - 1);

         const end = new Date(start);
         end.setHours(23, 59, 59, 999);

         return {
            gte: start,
            lte: end,
         };
      }

      case 'last7days': {
         const start = new Date(today);
         start.setDate(start.getDate() - 6);

         return {
            gte: start,
         };
      }

      case 'last30days': {
         const start = new Date(today);
         start.setDate(start.getDate() - 29);

         return {
            gte: start,
         };
      }

      default:
         return {};
   }
}
