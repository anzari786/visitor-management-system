import type { User } from './user.types';

export type LoginPayload = {
   username: string;
   password: string;
};

export type LoginData = {
   user: User;
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

export type CompletePasswordSetupPayload = {
   token: string;
   password: string;
};

export type CheckUsernameData = {
   available: boolean;
};
