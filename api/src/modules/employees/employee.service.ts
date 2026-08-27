import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import { ForbiddenError, NotFoundError } from '../../lib/errors.js';
import { getSkipTake, buildPaginationMeta } from '../../utils/pagination.js';
import type { PaginationParams } from '../../utils/pagination.js';
import {
   employeeSelect,
   employeeHostOptionSelect,
   hostVisitSelect,
} from './employee.types.js';
import type {
   EmployeeWithSelect,
   EmployeeSyncRecord,
   HostVisitWithSelect,
} from './employee.types.js';

interface ListEmployeesFilters extends PaginationParams {
   search?: string;
   departmentName?: string;
   isActive?: boolean;
}

export const listEmployees = async (filters: ListEmployeesFilters) => {
   const where: Prisma.EmployeeWhereInput = {
      ...(filters.departmentName && { departmentName: filters.departmentName }),
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters.search && {
         OR: [
            { firstName: { contains: filters.search } },
            { lastName: { contains: filters.search } },
            { email: { contains: filters.search } },
         ],
      }),
   };

   const [employees, total] = await Promise.all([
      prisma.employee.findMany({
         where,
         select: employeeSelect,
         orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
         ...getSkipTake(filters),
      }),
      prisma.employee.count({ where }),
   ]);

   return {
      employees,
      meta: buildPaginationMeta(filters, total),
   };
};

/** Start of today (midnight, server local time) — for comparing against `@db.Date` columns. */
const startOfToday = (): Date => {
   const now = new Date();
   return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

/** Current time as zero-padded "HH:mm", lexicographically comparable to `startTime`/`endTime`. */
const currentTimeString = (): string => {
   const now = new Date();
   return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

/**
 * Resolves the Employee behind the logged-in User. Mirrors the lookup
 * `assertCanCreateInvitation` does in visit.controller.ts. Throws if the
 * session's account isn't linked to an Employee record (e.g. a LOCAL
 * guard/reception account has no host identity of its own).
 */
const resolveHostEmployeeId = async (userId: number): Promise<number> => {
   const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { employeeId: true },
   });

   if (!user?.employeeId) {
      throw new ForbiddenError(
         'This account is not linked to an employee record',
      );
   }

   return user.employeeId;
};

/** Powers the searchable host picker on the visit request/invitation form. */
export const searchHosts = async (query: string, limit: number) => {
   return prisma.employee.findMany({
      where: {
         isActive: true,
         OR: [
            { firstName: { contains: query } },
            { lastName: { contains: query } },
            { email: { contains: query } },
         ],
      },
      select: employeeHostOptionSelect,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      take: limit,
   });
};

export const getEmployeeById = async (
   id: number,
): Promise<EmployeeWithSelect> => {
   const employee = await prisma.employee.findUnique({
      where: { id },
      select: employeeSelect,
   });

   if (!employee) {
      throw new NotFoundError('Employee not found');
   }

   return employee;
};

interface HostVisitListFilters extends PaginationParams {
   userId: number;
}

/** Visits still waiting on this host's approve/reject decision. */
export const getPendingApprovalVisits = async (
   filters: HostVisitListFilters,
) => {
   const hostEmployeeId = await resolveHostEmployeeId(filters.userId);

   const where: Prisma.VisitWhereInput = {
      hostEmployeeId,
      status: 'PENDING_APPROVAL',
   };

   const [visits, total] = await Promise.all([
      prisma.visit.findMany({
         where,
         select: hostVisitSelect,
         orderBy: [{ startDate: 'asc' }, { startTime: 'asc' }],
         ...getSkipTake(filters),
      }),
      prisma.visit.count({ where }),
   ]);

   return { visits, meta: buildPaginationMeta(filters, total) };
};

/**
 * Approved visits whose expected window hasn't ended: `endDate` in the
 * future, or `endDate` is today and `endTime` hasn't passed yet. Filtering
 * happens in the query itself (string comparison works because `HH:mm` is
 * zero-padded and sorts correctly), so pagination stays accurate.
 */
export const getUpcomingVisits = async (filters: HostVisitListFilters) => {
   const hostEmployeeId = await resolveHostEmployeeId(filters.userId);
   const today = startOfToday();

   const where: Prisma.VisitWhereInput = {
      hostEmployeeId,
      status: 'APPROVED',
      OR: [
         { endDate: { gt: today } },
         { endDate: today, endTime: { gte: currentTimeString() } },
      ],
   };

   const [visits, total] = await Promise.all([
      prisma.visit.findMany({
         where,
         select: hostVisitSelect,
         orderBy: [{ startDate: 'asc' }, { startTime: 'asc' }],
         ...getSkipTake(filters),
      }),
      prisma.visit.count({ where }),
   ]);

   return { visits, meta: buildPaginationMeta(filters, total) };
};

/**
 * Upserts records pushed from the external HR/directory feed, keyed on
 * externalEmployeeId. Employees are never created or edited manually —
 * this sync is the single source of truth for their record.
 */
export const syncEmployees = async (records: EmployeeSyncRecord[]) => {
   const syncedAt = new Date();

   const results = await prisma.$transaction(
      records.map((record) =>
         prisma.employee.upsert({
            where: { externalEmployeeId: record.externalEmployeeId },
            create: { ...record, isActive: true, lastSyncedAt: syncedAt },
            update: { ...record, isActive: true, lastSyncedAt: syncedAt },
            select: employeeSelect,
         }),
      ),
   );

   return {
      syncedCount: results.length,
      syncedAt,
   };
};

export const formatEmployee = (employee: EmployeeWithSelect) => ({
   id: String(employee.id),
   externalEmployeeId: employee.externalEmployeeId,
   firstName: employee.firstName,
   lastName: employee.lastName,
   email: employee.email,
   phone: employee.phone ?? undefined,
   departmentName: employee.departmentName,
   departmentCode: employee.departmentCode ?? undefined,
   position: employee.position ?? undefined,
   isActive: employee.isActive,
   lastSyncedAt: employee.lastSyncedAt,
});

export const formatHostVisit = (visit: HostVisitWithSelect) => ({
   id: String(visit.id),
   visitCode: visit.visitCode,
   status: visit.status,
   purpose: visit.purpose,
   groupType: visit.groupType,
   durationType: visit.durationType,
   startDate: visit.startDate,
   endDate: visit.endDate,
   startTime: visit.startTime,
   endTime: visit.endTime,
   floor: visit.floor ?? undefined,
   room: visit.room ?? undefined,
   expectedVisitorCount: visit.expectedVisitorCount,
   organization: visit.organization ?? undefined,
   decisionAt: visit.decisionAt ?? undefined,
   decisionNote: visit.decisionNote ?? undefined,
   createdAt: visit.createdAt,
   visitors: visit.participants.map((p) => ({
      id: String(p.visitor.id),
      firstName: p.visitor.firstName,
      lastName: p.visitor.lastName,
      organization: p.visitor.organization ?? undefined,
   })),
});
