import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../lib/errors.js';
import { getSkipTake, buildPaginationMeta } from '../../utils/pagination.js';
import type { PaginationParams } from '../../utils/pagination.js';
import { employeeSelect, employeeHostOptionSelect } from './employee.types.js';
import type {
   EmployeeWithSelect,
   EmployeeSyncRecord,
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
