import type { Prisma } from '../../generated/prisma/client.js';

/** Full record shape for the user detail view. */
export const userDetailSelect = {
   id: true,
   externalSubject: true,
   isActive: true,
   createdAt: true,
   updatedAt: true,
   employee: {
      select: {
         id: true,
         firstName: true,
         lastName: true,
         email: true,
         departmentName: true,
         position: true,
      },
   },
   roleAssignments: {
      select: {
         id: true,
         assignedAt: true,
         role: {
            select: {
               code: true,
               name: true,
            },
         },
         assignedBy: {
            select: {
               id: true,
               employee: {
                  select: { firstName: true, lastName: true },
               },
            },
         },
      },
      orderBy: { assignedAt: 'asc' },
   },
} satisfies Prisma.UserSelect;

export type UserDetail = Prisma.UserGetPayload<{
   select: typeof userDetailSelect;
}>;

/** Lighter shape for the user list/search view. */
export const userSummarySelect = {
   id: true,
   externalSubject: true,
   isActive: true,
   createdAt: true,
   employee: {
      select: {
         id: true,
         firstName: true,
         lastName: true,
         email: true,
         departmentName: true,
      },
   },
   roleAssignments: {
      select: {
         role: { select: { code: true, name: true } },
      },
   },
} satisfies Prisma.UserSelect;

export type UserSummary = Prisma.UserGetPayload<{
   select: typeof userSummarySelect;
}>;

export interface CreateUserInput {
   externalSubject: string;
   employeeId?: number;
   roleCodes?: string[];
}

export interface UpdateUserInput {
   employeeId?: number | null;
   isActive?: boolean;
}
