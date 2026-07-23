import { Prisma, Setting } from '../generated/prisma/client.js';
import { prisma } from '../config/prisma.js';

export const visitInclude = {
   visitor: true,
   department: true,
} satisfies Prisma.VisitInclude;

export type VisitWithRelations = Prisma.VisitGetPayload<{
   include: typeof visitInclude;
}>;

export async function getSettings() {
   return prisma.setting.findUniqueOrThrow({
      where: { id: 1 },
   });
}

export function computeStatus(
   visit: Pick<VisitWithRelations, 'status' | 'checkedInAt'>,
   settings: Setting,
): 'active' | 'overstay' | 'completed' | 'cancelled' {
   if (visit.status !== 'active') {
      return visit.status;
   }

   if (settings.overstayEnabled) {
      const elapsedMinutes =
         (Date.now() - visit.checkedInAt.getTime()) / 60_000;

      if (elapsedMinutes > settings.overstayAfterMins) {
         return 'overstay';
      }
   }

   return 'active';
}

export function formatBadge(prefix: string, badgeNumber: number) {
   return `${prefix}-${String(badgeNumber).padStart(3, '0')}`;
}

export function toVisitDTO(visit: VisitWithRelations, settings: Setting) {
   const status = computeStatus(visit, settings);

   return {
      id: visit.id,
      badge: formatBadge(settings.badgePrefix, visit.badgeNumber),
      visitorName: visit.visitor.fullName,
      phone: visit.visitor.phone ?? '',
      idNumber: visit.visitor.idNumber,
      idType: visit.visitor.idType,
      host: visit.hostName,
      department: visit.department ?? null,
      checkInTime: visit.checkedInAt.toISOString(),
      checkOutTime: visit.checkedOutAt?.toISOString(),
      cancelledAt:
         status === 'cancelled' ? visit.checkedOutAt?.toISOString() : undefined,
      status,
      note: visit.checkoutNote ?? undefined,
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
