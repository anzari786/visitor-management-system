import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import { ConflictError, NotFoundError } from '../../lib/errors.js';
import { getSkipTake, buildPaginationMeta } from '../../utils/pagination.js';
import type { PaginationParams } from '../../utils/pagination.js';
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

   if (!employee || !employee.isActive) {
      throw new NotFoundError('Employee not found');
   }

   const existingLink = await prisma.user.findUnique({ where: { employeeId } });

   if (existingLink && existingLink.id !== excludeUserId) {
      throw new ConflictError(
         'Employee is already linked to another user account',
      );
   }
};

const resolveRoleIds = async (roleCodes: string[]): Promise<number[]> => {
   const roles = await prisma.role.findMany({
      where: { code: { in: roleCodes }, isActive: true },
   });

   const foundCodes = new Set(roles.map((role) => role.code));
   const missing = roleCodes.filter((code) => !foundCodes.has(code));

   if (missing.length > 0) {
      throw new NotFoundError(`Unknown role code(s): ${missing.join(', ')}`);
   }

   return roles.map((role) => role.id);
};

/**
 * Provisions a dashboard account ahead of someone's first SSO login —
 * the auth module refuses to log in a subject it doesn't already
 * recognize, so this is what makes that recognition possible.
 */
export const createUser = async (
   input: CreateUserInput,
   actorId: number,
): Promise<UserDetail> => {
   if (input.employeeId) {
      await assertEmployeeIsLinkable(input.employeeId);
   }

   const roleIds = input.roleCodes ? await resolveRoleIds(input.roleCodes) : [];

   try {
      return await prisma.user.create({
         data: {
            externalSubject: input.externalSubject,
            employeeId: input.employeeId,
            roleAssignments: {
               create: roleIds.map((roleId) => ({
                  roleId,
                  assignedById: actorId,
               })),
            },
         },
         select: userDetailSelect,
      });
   } catch (error) {
      const isUniqueConflict =
         error instanceof Prisma.PrismaClientKnownRequestError &&
         error.code === 'P2002';

      if (isUniqueConflict) {
         throw new ConflictError('A user for this SSO subject already exists');
      }

      throw error;
   }
};

interface ListUsersFilters extends PaginationParams {
   search?: string;
   isActive?: boolean;
   roleCode?: string;
}

export const listUsers = async (filters: ListUsersFilters) => {
   const where: Prisma.UserWhereInput = {
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters.roleCode && {
         roleAssignments: { some: { role: { code: filters.roleCode } } },
      }),
      ...(filters.search && {
         employee: {
            is: {
               OR: [
                  { firstName: { contains: filters.search } },
                  { lastName: { contains: filters.search } },
                  { email: { contains: filters.search } },
               ],
            },
         },
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
   await getUserById(id);

   if (input.employeeId) {
      await assertEmployeeIsLinkable(input.employeeId, id);
   }

   return prisma.user.update({
      where: { id },
      data: {
         ...(input.employeeId !== undefined && {
            employeeId: input.employeeId,
         }),
         ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
      select: userDetailSelect,
   });
};

export const assignRole = async (
   userId: number,
   roleCode: string,
   actorId: number,
): Promise<UserDetail> => {
   await getUserById(userId);

   const [roleId] = await resolveRoleIds([roleCode]);

   const alreadyAssigned = await prisma.userRoleAssignment.findUnique({
      where: { userId_roleId: { userId, roleId } },
   });

   if (alreadyAssigned) {
      throw new ConflictError('Role is already assigned to this user');
   }

   await prisma.userRoleAssignment.create({
      data: { userId, roleId, assignedById: actorId },
   });

   return getUserById(userId);
};

export const removeRole = async (
   userId: number,
   roleCode: string,
): Promise<UserDetail> => {
   await getUserById(userId);

   const [roleId] = await resolveRoleIds([roleCode]);

   const assignment = await prisma.userRoleAssignment.findUnique({
      where: { userId_roleId: { userId, roleId } },
   });

   if (!assignment) {
      throw new NotFoundError('User does not have this role assigned');
   }

   await prisma.userRoleAssignment.delete({ where: { id: assignment.id } });

   return getUserById(userId);
};

export const formatUserDetail = (user: UserDetail) => ({
   id: String(user.id),
   externalSubject: user.externalSubject,
   isActive: user.isActive,
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
   roles: user.roleAssignments.map((assignment) => ({
      id: String(assignment.id),
      code: assignment.role.code,
      name: assignment.role.name,
      assignedAt: assignment.assignedAt,
      assignedBy: assignment.assignedBy?.employee
         ? {
              firstName: assignment.assignedBy.employee.firstName,
              lastName: assignment.assignedBy.employee.lastName,
           }
         : undefined,
   })),
   createdAt: user.createdAt,
   updatedAt: user.updatedAt,
});

export const formatUserSummary = (user: UserSummary) => ({
   id: String(user.id),
   externalSubject: user.externalSubject,
   isActive: user.isActive,
   employee: user.employee
      ? {
           id: String(user.employee.id),
           firstName: user.employee.firstName,
           lastName: user.employee.lastName,
           email: user.employee.email,
           departmentName: user.employee.departmentName,
        }
      : undefined,
   roleCodes: user.roleAssignments.map((assignment) => assignment.role.code),
   createdAt: user.createdAt,
});
