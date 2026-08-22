import type { Prisma } from '../../generated/prisma/client.js';

/** Full record shape returned for list/detail endpoints. */
export const employeeSelect = {
   id: true,
   externalEmployeeId: true,
   firstName: true,
   lastName: true,
   email: true,
   phone: true,
   departmentName: true,
   departmentCode: true,
   position: true,
   isActive: true,
   lastSyncedAt: true,
   createdAt: true,
   updatedAt: true,
} satisfies Prisma.EmployeeSelect;

export type EmployeeWithSelect = Prisma.EmployeeGetPayload<{
   select: typeof employeeSelect;
}>;

/** Lightweight shape for the host-picker autocomplete on the visit form. */
export const employeeHostOptionSelect = {
   id: true,
   firstName: true,
   lastName: true,
   email: true,
   departmentName: true,
   position: true,
} satisfies Prisma.EmployeeSelect;

export type EmployeeHostOption = Prisma.EmployeeGetPayload<{
   select: typeof employeeHostOptionSelect;
}>;

/** One record as delivered by the external HR/directory sync feed. */
export interface EmployeeSyncRecord {
   externalEmployeeId: string;
   firstName: string;
   lastName: string;
   email: string;
   phone?: string;
   departmentName: string;
   departmentCode?: string;
   position?: string;
}
