import { Prisma } from '../generated/prisma/client.js';
import { prisma } from '../config/prisma.js';

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
