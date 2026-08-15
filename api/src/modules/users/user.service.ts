import { AuthProvider, Prisma, type RoleName } from '../../generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import {
   BadRequestError,
   ConflictError,
   NotFoundError,
} from '../../lib/errors.js';
import { getSkipTake, buildPaginationMeta } from '../../utils/pagination.js';
import type { PaginationParams } from '../../utils/pagination.js';
import { sendPasswordSetupInvitation } from '../../services/password-setup.service.js';
import { userDetailSelect, userSummarySelect } from './user.types.js';
import type {
   CreateUserInput,
   UpdateUserInput,
   UserDetail,
   UserSummary,
} from './user.types.js';

const assertEmployeeIsLinkable = async (
   employeeId: number,
   excludeUserId?: number,
) => {
   const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
   });

   if (!employee) {
      throw new NotFoundError('Employee not found', 'EMPLOYEE_NOT_FOUND');
   }

   if (!employee.isActive) {
      throw new BadRequestError('Employee is inactive', 'EMPLOYEE_INACTIVE');
   }

   const existingLink = await prisma.user.findUnique({ where: { employeeId } });

   if (existingLink && existingLink.id !== excludeUserId) {
      throw new ConflictError(
         'Employee is already linked to another user account',
         'EMPLOYEE_ALREADY_LINKED',
      );
   }

   return employee;
};

const assertUsernameAvailable = async (
   username: string,
   excludeUserId?: number,
) => {
   const existing = await prisma.user.findUnique({ where: { username } });

   if (existing && existing.id !== excludeUserId) {
      throw new ConflictError('Username already exists', 'USERNAME_EXISTS');
   }
};

const resolveRoleIds = async (roles: RoleName[]): Promise<number[]> => {
   const found = await prisma.role.findMany({
      where: { name: { in: roles } },
   });

   const foundNames = new Set(found.map((role) => role.name));
   const missing = roles.filter((name) => !foundNames.has(name));

   if (missing.length > 0) {
      throw new NotFoundError(`Unknown role(s): ${missing.join(', ')}`);
   }

   return found.map((role) => role.id);
};

const isPasswordSetupPending = (user: {
   authProvider: AuthProvider;
   passwordHash: string | null;
}) => user.authProvider === AuthProvider.LOCAL && user.passwordHash === null;

/**
 * Provisions a dashboard account as either an SSO employee-linked user
 * or a LOCAL username/password user awaiting password setup.
 */
export const createUser = async (
   input: CreateUserInput,
): Promise<UserDetail> => {
   const roleIds = await resolveRoleIds(input.roles);

   if (input.authProvider === 'SSO') {
      const employee = await assertEmployeeIsLinkable(input.employeeId);

      try {
         return await prisma.user.create({
            data: {
               authProvider: AuthProvider.SSO,
               firstName: employee.firstName,
               lastName: employee.lastName,
               email: employee.email,
               phone: employee.phone,
               employeeId: employee.id,
               userRoles: {
                  create: roleIds.map((roleId) => ({ roleId })),
               },
            },
            select: userDetailSelect,
         });
      } catch (error) {
         if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
         ) {
            throw new ConflictError(
               'A user with these unique fields already exists',
            );
         }

         throw error;
      }
   }

   await assertUsernameAvailable(input.username);

   try {
      return await prisma.user.create({
         data: {
            authProvider: AuthProvider.LOCAL,
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            phone: input.phone,
            username: input.username,
            userRoles: {
               create: roleIds.map((roleId) => ({ roleId })),
            },
         },
         select: userDetailSelect,
      });
   } catch (error) {
      if (
         error instanceof Prisma.PrismaClientKnownRequestError &&
         error.code === 'P2002'
      ) {
         throw new ConflictError(
            'A user with these unique fields already exists',
         );
      }

      throw error;
   }
};

interface ListUsersFilters extends PaginationParams {
   search?: string;
   isActive?: boolean;
   role?: RoleName;
   authProvider?: AuthProvider;
   passwordSetupPending?: boolean;
}

export const listUsers = async (filters: ListUsersFilters) => {
   const where: Prisma.UserWhereInput = {
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters.authProvider && { authProvider: filters.authProvider }),
      ...(filters.role && {
         userRoles: { some: { role: { name: filters.role } } },
      }),
      ...(filters.passwordSetupPending === true && {
         authProvider: AuthProvider.LOCAL,
         passwordHash: null,
      }),
      ...(filters.passwordSetupPending === false && {
         NOT: {
            authProvider: AuthProvider.LOCAL,
            passwordHash: null,
         },
      }),
      ...(filters.search && {
         OR: [
            { firstName: { contains: filters.search } },
            { lastName: { contains: filters.search } },
            { email: { contains: filters.search } },
            { username: { contains: filters.search } },
            {
               employee: {
                  is: {
                     OR: [
                        { firstName: { contains: filters.search } },
                        { lastName: { contains: filters.search } },
                        { email: { contains: filters.search } },
                     ],
                  },
               },
            },
         ],
      }),
   };

   const [users, total] = await Promise.all([
      prisma.user.findMany({
         where,
         select: userSummarySelect,
         orderBy: { createdAt: 'desc' },
         ...getSkipTake(filters),
      }),
      prisma.user.count({ where }),
   ]);

   return {
      users,
      meta: buildPaginationMeta(filters, total),
   };
};

export const getUserById = async (id: number): Promise<UserDetail> => {
   const user = await prisma.user.findUnique({
      where: { id },
      select: userDetailSelect,
   });

   if (!user) {
      throw new NotFoundError('User not found');
   }

   return user;
};

export const updateUser = async (
   id: number,
   input: UpdateUserInput,
): Promise<UserDetail> => {
   const existing = await getUserById(id);

   if (existing.authProvider === AuthProvider.SSO) {
      const disallowedFields = (
         ['firstName', 'lastName', 'email', 'phone'] as const
      ).filter((field) => input[field] !== undefined);

      if (disallowedFields.length > 0) {
         throw new BadRequestError(
            'SSO user profile fields are managed through the linked employee record',
            'INVALID_ACCOUNT_TYPE',
         );
      }
   }

   return prisma.user.update({
      where: { id },
      data: {
         ...(existing.authProvider === AuthProvider.LOCAL &&
            input.firstName !== undefined && { firstName: input.firstName }),
         ...(existing.authProvider === AuthProvider.LOCAL &&
            input.lastName !== undefined && { lastName: input.lastName }),
         ...(existing.authProvider === AuthProvider.LOCAL &&
            input.email !== undefined && { email: input.email }),
         ...(existing.authProvider === AuthProvider.LOCAL &&
            input.phone !== undefined && { phone: input.phone }),
         ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
      select: userDetailSelect,
   });
};

export const assignRole = async (
   userId: number,
   roleName: RoleName,
): Promise<UserDetail> => {
   await getUserById(userId);

   const [roleId] = await resolveRoleIds([roleName]);

   const alreadyAssigned = await prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId } },
   });

   if (alreadyAssigned) {
      throw new ConflictError('Role is already assigned to this user');
   }

   await prisma.userRole.create({
      data: { userId, roleId },
   });

   return getUserById(userId);
};

export const removeRole = async (
   userId: number,
   roleName: RoleName,
): Promise<UserDetail> => {
   await getUserById(userId);

   const [roleId] = await resolveRoleIds([roleName]);

   const assignment = await prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId } },
   });

   if (!assignment) {
      throw new NotFoundError('User does not have this role assigned');
   }

   await prisma.userRole.delete({
      where: { userId_roleId: { userId, roleId } },
   });

   return getUserById(userId);
};

export const invitePasswordSetup = async (userId: number) => {
   await getUserById(userId);
   return sendPasswordSetupInvitation(userId);
};

export const formatUserDetail = (user: UserDetail) => ({
   id: String(user.id),
   authProvider: user.authProvider,
   firstName: user.firstName,
   lastName: user.lastName,
   email: user.email ?? undefined,
   phone: user.phone ?? undefined,
   username: user.username ?? undefined,
   isActive: user.isActive,
   mustChangePassword: user.mustChangePassword,
   passwordSetupPending: isPasswordSetupPending(user),
   lastLoginAt: user.lastLoginAt ?? undefined,
   employee: user.employee
      ? {
           id: String(user.employee.id),
           firstName: user.employee.firstName,
           lastName: user.employee.lastName,
           email: user.employee.email,
           departmentName: user.employee.departmentName,
           position: user.employee.position ?? undefined,
        }
      : undefined,
   roles: user.userRoles.map((assignment) => ({
      name: assignment.role.name,
      description: assignment.role.description ?? undefined,
      assignedAt: assignment.assignedAt,
   })),
   createdAt: user.createdAt,
   updatedAt: user.updatedAt,
});

export const formatUserSummary = (user: UserSummary) => ({
   id: String(user.id),
   authProvider: user.authProvider,
   firstName: user.firstName,
   lastName: user.lastName,
   email: user.email ?? undefined,
   isActive: user.isActive,
   passwordSetupPending: isPasswordSetupPending(user),
   employee: user.employee
      ? {
           id: String(user.employee.id),
           firstName: user.employee.firstName,
           lastName: user.employee.lastName,
           email: user.employee.email,
           departmentName: user.employee.departmentName,
        }
      : undefined,
   roles: user.userRoles.map((assignment) => assignment.role.name),
   createdAt: user.createdAt,
});
