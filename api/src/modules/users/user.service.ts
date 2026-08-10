import { Prisma, type RoleName } from '../../generated/prisma/client.js';
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

/**
 * Provisions a dashboard account. Prefer linking an Employee when the
 * person also appears in the HR directory.
 */
export const createUser = async (
   input: CreateUserInput,
): Promise<UserDetail> => {
   if (input.employeeId) {
      await assertEmployeeIsLinkable(input.employeeId);
   }

   const roleIds = input.roles?.length ? await resolveRoleIds(input.roles) : [];

   let firstName = input.firstName;
   let lastName = input.lastName;
   let email = input.email;
   let phone = input.phone;

   if (input.employeeId) {
      const employee = await prisma.employee.findUniqueOrThrow({
         where: { id: input.employeeId },
      });
      firstName = firstName || employee.firstName;
      lastName = lastName || employee.lastName;
      email = email ?? employee.email;
      phone = phone ?? employee.phone ?? undefined;
   }

   try {
      return await prisma.user.create({
         data: {
            firstName,
            lastName,
            email,
            phone,
            username: input.username,
            externalSubject: input.externalSubject,
            employeeId: input.employeeId,
            userRoles: {
               create: roleIds.map((roleId) => ({ roleId })),
            },
         },
         select: userDetailSelect,
      });
   } catch (error) {
      const isUniqueConflict =
         error instanceof Prisma.PrismaClientKnownRequestError &&
         error.code === 'P2002';

      if (isUniqueConflict) {
         throw new ConflictError('A user with these unique fields already exists');
      }

      throw error;
   }
};

interface ListUsersFilters extends PaginationParams {
   search?: string;
   isActive?: boolean;
   role?: RoleName;
}

export const listUsers = async (filters: ListUsersFilters) => {
   const where: Prisma.UserWhereInput = {
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters.role && {
         userRoles: { some: { role: { name: filters.role } } },
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
   await getUserById(id);

   if (input.employeeId) {
      await assertEmployeeIsLinkable(input.employeeId, id);
   }

   return prisma.user.update({
      where: { id },
      data: {
         ...(input.firstName !== undefined && { firstName: input.firstName }),
         ...(input.lastName !== undefined && { lastName: input.lastName }),
         ...(input.email !== undefined && { email: input.email }),
         ...(input.phone !== undefined && { phone: input.phone }),
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

export const formatUserDetail = (user: UserDetail) => ({
   id: String(user.id),
   externalSubject: user.externalSubject ?? undefined,
   firstName: user.firstName,
   lastName: user.lastName,
   email: user.email ?? undefined,
   phone: user.phone ?? undefined,
   username: user.username ?? undefined,
   isActive: user.isActive,
   mustChangePassword: user.mustChangePassword,
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
   externalSubject: user.externalSubject ?? undefined,
   firstName: user.firstName,
   lastName: user.lastName,
   email: user.email ?? undefined,
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
   roles: user.userRoles.map((assignment) => assignment.role.name),
   createdAt: user.createdAt,
});
