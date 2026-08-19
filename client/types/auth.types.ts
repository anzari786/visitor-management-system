import type { AuthUser } from './user.types';

export type LoginPayload = {
   username: string;
   password: string;
};

export type LoginData = {
   user: AuthUser;
   mustChangePassword?: boolean;
};

export type UpdateProfilePayload = {
   firstName: string;
   lastName: string;
   username: string;
   phone?: string;
};

export type ChangePasswordPayload = {
   currentPassword: string;
   newPassword: string;
};

export type ForceChangePasswordPayload = {
   newPassword: string;
};

export type CheckUsernameData = {
   available: boolean;
};
