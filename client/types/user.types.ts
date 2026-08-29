import { USER_ROLES } from '@/constants/user';

export type UserRole = (typeof USER_ROLES)[number];

export type UserStatusFilter = 'active' | 'inactive';

export type User = {
   id: number;
   firstName: string;
   lastName: string;
   username: string;
   phone?: string;
   avatar?: string | null;
   role: UserRole;
   isActive: boolean;
   mustChangePassword: boolean; // true when admin creates/resets the account
   lastLoginAt?: string;
   createdAt: string;
   checkIns: number;
   checkOuts: number;
   employee?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      departmentName: string;
      position?: string;
   };
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
   email: string;
   username: string;
   phone?: string;
   role: UserRole;
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
