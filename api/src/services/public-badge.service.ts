import { Prisma } from '../generated/prisma/client.js';
import { prisma } from '../config/prisma.js';
import { NotFoundError } from '../lib/errors.js';
import {
   computeStatus,
   getSettings,
} from '../utils/visit.js';

const publicBadgeAttendanceSelect = {
   status: true,
   checkInAt: true,
   checkOutAt: true,
   visitDay: {
      select: { date: true },
   },
   participant: {
      select: {
         visitor: {
            select: {
               firstName: true,
               lastName: true,
               phone: true,
               organization: true,
            },
         },
         visit: {
            select: {
               status: true,
               purpose: true,
               floor: true,
               room: true,
               hostNameSnapshot: true,
               departmentNameSnapshot: true,
               hostEmployee: {
                  select: {
                     firstName: true,
                     lastName: true,
                     departmentName: true,
                  },
               },
            },
         },
      },
   },
} satisfies Prisma.VisitAttendanceSelect;

type PublicBadgeAttendance = Prisma.VisitAttendanceGetPayload<{
   select: typeof publicBadgeAttendanceSelect;
}>;

function hostDisplayName(visit: PublicBadgeAttendance['participant']['visit']) {
   if (visit.hostNameSnapshot) {
      return visit.hostNameSnapshot;
   }

   if (visit.hostEmployee) {
      return `${visit.hostEmployee.firstName} ${visit.hostEmployee.lastName}`;
   }

   return '';
}

function formatPublicBadgeInfo(
   badgeNumber: string,
   attendance: PublicBadgeAttendance,
   settings: Awaited<ReturnType<typeof getSettings>>,
) {
   const visitor = attendance.participant.visitor;
   const visit = attendance.participant.visit;
   const checkedInAt = attendance.checkInAt;

   if (!checkedInAt) {
      throw new NotFoundError('No active visitor assignment for this badge');
   }

   const status = computeStatus(
      {
         visitStatus: visit.status,
         attendanceStatus: attendance.status,
         checkInAt: attendance.checkInAt,
         checkOutAt: attendance.checkOutAt,
      },
      settings,
   );

   const visitDate = attendance.visitDay.date;

   return {
      badgeNumber,
      visitor: {
         fullName: `${visitor.firstName} ${visitor.lastName}`,
         phone: visitor.phone ?? null,
         organization: visitor.organization ?? null,
      },
      host: {
         name: hostDisplayName(visit),
         department:
            visit.departmentNameSnapshot ??
            visit.hostEmployee?.departmentName ??
            null,
      },
      visit: {
         purpose: visit.purpose,
         date: visitDate.toISOString().slice(0, 10),
         startTime: checkedInAt.toISOString(),
         endTime: attendance.checkOutAt?.toISOString() ?? null,
         floor: visit.floor ?? null,
         room: visit.room ?? null,
         status,
      },
   };
}

export type PublicBadgeInfo = ReturnType<typeof formatPublicBadgeInfo>;

/**
 * Resolve a physical badge QR token to the currently checked-in attendance.
 * Returns only public-safe visitor/visit fields (no internal IDs or personal ID docs).
 */
export async function getPublicBadgeInfoByQrToken(
   rawToken: string,
): Promise<PublicBadgeInfo> {
   const qrToken = decodeURIComponent(rawToken).trim();

   if (!qrToken) {
      throw new NotFoundError('Badge not found');
   }

   const badge = await prisma.badge.findUnique({
      where: { qrToken },
      select: {
         id: true,
         badgeNumber: true,
         status: true,
      },
   });

   if (!badge) {
      throw new NotFoundError('Badge not found');
   }

   if (badge.status === 'LOST' || badge.status === 'DISABLED') {
      throw new NotFoundError('This badge is not available for visitor lookup');
   }

   const attendance = await prisma.visitAttendance.findFirst({
      where: {
         badgeId: badge.id,
         status: 'CHECKED_IN',
      },
      select: publicBadgeAttendanceSelect,
      orderBy: { checkInAt: 'desc' },
   });

   if (!attendance) {
      throw new NotFoundError('No active visitor assignment for this badge');
   }

   const settings = await getSettings();

   return formatPublicBadgeInfo(badge.badgeNumber, attendance, settings);
}
