import type { AuthProvider, Prisma, RoleName } from '../../generated/prisma/client.js';

/** Full record shape for the user detail view. */
export const userDetailSelect = {
   id: true,
   authProvider: true,
   firstName: true,
   lastName: true,
   email: true,
   phone: true,
   username: true,
   passwordHash: true,
   isActive: true,
   mustChangePassword: true,
   lastLoginAt: true,
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
   userRoles: {
      select: {
         assignedAt: true,
         role: {
            select: {
               name: true,
               description: true,
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
   authProvider: true,
   firstName: true,
   lastName: true,
   email: true,
   isActive: true,
   passwordHash: true,
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
   userRoles: {
      select: {
         role: { select: { name: true } },
      },
   },
} satisfies Prisma.UserSelect;

export type UserSummary = Prisma.UserGetPayload<{
   select: typeof userSummarySelect;
}>;

export type CreateUserInput =
   | {
        authProvider: 'SSO';
        employeeId: number;
        roles: RoleName[];
     }
   | {
        authProvider: 'LOCAL';
        firstName: string;
        lastName: string;
        email?: string;
        phone?: string;
        username: string;
        roles: RoleName[];
     };

export interface UpdateUserInput {
   firstName?: string;
   lastName?: string;
   email?: string | null;
   phone?: string | null;
   isActive?: boolean;
}

export type { AuthProvider };
