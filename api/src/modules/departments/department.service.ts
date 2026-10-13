import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import { getSkipTake, buildPaginationMeta } from '../../utils/pagination.js';
import type { PaginationParams } from '../../utils/pagination.js';
import {
   departmentSelect,
   type DepartmentSyncRecord,
   type DepartmentWithSelect,
} from './department.types.js';

interface ListDepartmentsFilters extends PaginationParams {
   search?: string;
   activeOnly?: boolean;
}

export const upsertDepartment = (
   client: Prisma.TransactionClient,
   record: DepartmentSyncRecord,
) => {
   const syncedAt = new Date();

   return client.department.upsert({
      where: { externalDepartmentId: record.externalDepartmentId },
      create: {
         externalDepartmentId: record.externalDepartmentId,
         name: record.name,
         code: record.code,
         isActive: true,
         lastSyncedAt: syncedAt,
      },
      update: {
         name: record.name,
         code: record.code,
         isActive: true,
         lastSyncedAt: syncedAt,
      },
      select: departmentSelect,
   });
};

export const listDepartments = async (filters: ListDepartmentsFilters) => {
   const where: Prisma.DepartmentWhereInput = {
      ...(filters.activeOnly !== undefined && { isActive: filters.activeOnly }),
      ...(filters.search && {
         OR: [
            { name: { contains: filters.search } },
            { code: { contains: filters.search } },
         ],
      }),
   };

   const [departments, total] = await Promise.all([
      prisma.department.findMany({
         where,
         select: departmentSelect,
         orderBy: { name: 'asc' },
         ...getSkipTake(filters),
      }),
      prisma.department.count({ where }),
   ]);

   return { departments, meta: buildPaginationMeta(filters, total) };
};

export const syncDepartments = async (records: DepartmentSyncRecord[]) => {
   const uniqueRecords = [
      ...new Map(
         records.map((record) => [record.externalDepartmentId, record]),
      ).values(),
   ];

   const results = await prisma.$transaction((tx) =>
      Promise.all(
         uniqueRecords.map((record) => upsertDepartment(tx, record)),
      ),
   );

   return { syncedCount: results.length, syncedAt: new Date() };
};

export const formatDepartment = (department: DepartmentWithSelect) => ({
   id: department.id,
   externalDepartmentId: department.externalDepartmentId,
   name: department.name,
   code: department.code ?? undefined,
   isActive: department.isActive,
   lastSyncedAt: department.lastSyncedAt,
   createdAt: department.createdAt,
   updatedAt: department.updatedAt,
});