import type { Prisma } from '../../generated/prisma/client.js';

export const departmentSelect = {
   id: true,
   externalDepartmentId: true,
   name: true,
   code: true,
   isActive: true,
   lastSyncedAt: true,
   createdAt: true,
   updatedAt: true,
} satisfies Prisma.DepartmentSelect;

export type DepartmentWithSelect = Prisma.DepartmentGetPayload<{
   select: typeof departmentSelect;
}>;

export interface DepartmentSyncRecord {
   externalDepartmentId: string;
   name: string;
   code?: string;
}