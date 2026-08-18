import { USER_ROLES } from '@/constants/user';

export type UserRole = (typeof USER_ROLES)[number];

export type UserStatusFilter = 'active' | 'inactive';

/** Session user returned by POST /auth/login and GET /auth/me. */
export type AuthUser = {
   id: string;
   firstName: string;
   lastName: string;
   email?: string;
   phone?: string;
   username?: string;
   isActive: boolean;
   mustChangePassword: boolean;
   lastLoginAt?: string;
   createdAt: string;
   employee?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      departmentName: string;
      position?: string;
   };
   roles: UserRole[];
};

/** Staff directory row used by the (still mock) Users page. */
export type User = {
   id: number;
   firstName: string;
   lastName: string;
   username: string;
   phone?: string;
   role: UserRole;
   isActive: boolean;
   mustChangePassword: boolean;
   lastLoginAt?: string;
   createdAt: string;
   checkIns: number;
   checkOuts: number;
};

export type UsersParams = {
   page: number;
   pageSize: number;
   search?: string;
   role?: UserRole | 'all';
   status?: UserStatusFilter | 'all';
};

export type UsersPaginatedData = {
   data: User[];
   total: number;
   page: number;
   pageSize: number;
   pageCount: number;
};

export type CreateUserPayload = {
   firstName: string;
   lastName: string;
   username: string;
   phone?: string;
   role: UserRole;
   password: string;
};

export type UpdateUserPayload = {
   id: number;
   firstName: string;
   lastName: string;
   username: string;
   phone?: string;
   role: UserRole;
};

export type ResetPasswordData = {
   tempPassword: string;
};

export type ChangeUserRolePayload = {
   id: number;
   role: UserRole;
};

export type ToggleUserStatusPayload = {
   id: number;
   isActive: boolean;
};
