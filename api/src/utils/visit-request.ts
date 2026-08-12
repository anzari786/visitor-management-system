import { Prisma } from '../generated/prisma/client.js';

export const visitRequestInclude = {
   department: true,
   reviewedBy: {
      select: {
         id: true,
         firstName: true,
         lastName: true,
      },
   },
   visitors: {
      include: {
         visitor: true,
      },
      orderBy: { id: 'asc' as const },
   },
} satisfies Prisma.VisitRequestInclude;

export type VisitRequestWithRelations = Prisma.VisitRequestGetPayload<{
   include: typeof visitRequestInclude;
}>;

/** Maps self-service department codes to Department.shortName values. */
export const DEPARTMENT_CODE_TO_SHORT_NAME: Record<string, string> = {
   hr: 'HR',
   fin: 'FIN',
   it: 'IT',
   rd: 'R&D',
   proc: 'PROC',
   legal: 'LEGAL',
};

export function toVisitRequestDTO(request: VisitRequestWithRelations) {
   const primary = request.visitors[0];
   const additionalCount = Math.max(request.visitors.length - 1, 0);

   return {
      id: request.id,
      visitorName: primary?.visitor.fullName ?? 'Unknown visitor',
      phone: primary?.visitor.phone ?? '',
      email: primary?.email ?? '',
      organization: primary?.organization ?? null,
      idType: primary?.visitor.idType ?? null,
      idNumber: primary?.visitor.idNumber ?? null,
      additionalVisitorCount: additionalCount,
      visitors: request.visitors.map((entry) => ({
         id: entry.visitor.id,
         fullName: entry.visitor.fullName,
         phone: entry.visitor.phone ?? '',
         email: entry.email,
         organization: entry.organization ?? null,
         idType: entry.visitor.idType,
         idNumber: entry.visitor.idNumber,
      })),
      host: request.hostName,
      hostEmail: request.hostEmail ?? null,
      department: request.department
         ? {
              id: request.department.id,
              name: request.department.name,
              shortName: request.department.shortName,
              color: request.department.color,
              isActive: request.department.isActive,
           }
         : null,
      purpose: request.purpose,
      startDate: request.startDate.toISOString().slice(0, 10),
      endDate: request.endDate.toISOString().slice(0, 10),
      startTime: request.startTime,
      endTime: request.endTime,
      status: request.status,
      rejectionReason: request.rejectionReason ?? null,
      reviewedAt: request.reviewedAt?.toISOString() ?? null,
      reviewedBy: request.reviewedBy
         ? {
              id: request.reviewedBy.id,
              name: `${request.reviewedBy.firstName} ${request.reviewedBy.lastName}`,
           }
         : null,
      createdAt: request.createdAt.toISOString(),
      updatedAt: request.updatedAt.toISOString(),
   };
}

export function dateRangeForVisitRequest(dateFilter?: string) {
   if (!dateFilter || dateFilter === 'all') {
      return {};
   }

   const today = new Date();
   today.setHours(0, 0, 0, 0);

   switch (dateFilter) {
      case 'today': {
         const end = new Date();
         end.setHours(23, 59, 59, 999);
         return { gte: today, lte: end };
      }
      case 'yesterday': {
         const start = new Date(today);
         start.setDate(start.getDate() - 1);
         const end = new Date(start);
         end.setHours(23, 59, 59, 999);
         return { gte: start, lte: end };
      }
      case 'last7days': {
         const start = new Date(today);
         start.setDate(start.getDate() - 6);
         return { gte: start };
      }
      case 'last30days': {
         const start = new Date(today);
         start.setDate(start.getDate() - 29);
         return { gte: start };
      }
      default:
         return {};
   }
}
