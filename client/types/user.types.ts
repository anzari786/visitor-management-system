import { USER_ROLES } from '@/constants/user';

export type UserRole = (typeof USER_ROLES)[number];

export type UserStatusFilter = 'active' | 'inactive';

export type User = {
   id: number;
   firstName: string;
   lastName: string;
   username: string;
   email?: string;
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

export type UserApiRecord = {
   id: string;
   authProvider: 'LOCAL' | 'SSO';
   firstName: string;
   lastName: string;
   email?: string;
   phone?: string;
   username?: string;
   isActive: boolean;
   mustChangePassword?: boolean;
   passwordSetupPending?: boolean;
   lastLoginAt?: string;
   createdAt: string;
   updatedAt?: string;
   employee?: User['employee'];
   roles: UserRole[] | Array<{ name: UserRole }>;
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

export type CreateUserPayload =
   | {
        authProvider: 'LOCAL';
        firstName: string;
        lastName: string;
        email?: string;
        phone?: string;
        username: string;
        roles: UserRole[];
     }
   | {
        authProvider: 'SSO';
        employeeId: number;
        roles: UserRole[];
     };

export type UpdateUserPayload = {
   id: number;
   firstName: string;
   lastName: string;
   username: string;
   email?: string;
   phone?: string;
   role: UserRole;
};

export type ResetPasswordData = {
   expiresAt: string;
};

export type ChangeUserRolePayload = {
   id: number;
   currentRole?: UserRole;
   role: UserRole;
};

export type ToggleUserStatusPayload = {
   id: number;
   isActive: boolean;
};
