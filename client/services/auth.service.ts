import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';

import type {
   LoginData,
   LoginPayload,
   UpdateProfilePayload,
   ChangePasswordPayload,
   ForceChangePasswordPayload,
   CheckUsernameData,
} from '@/types/auth.types';

import type { AuthUser } from '@/types/user.types';

export const authService = {
   login(payload: LoginPayload) {
      return api.post<ApiResponse<LoginData>>('/auth/login', payload);
   },

   logout() {
      return api.post<ApiResponse<null>>('/auth/logout');
   },

   getMe() {
      return api.get<ApiResponse<AuthUser>>('/auth/me');
   },

   updateProfile(payload: UpdateProfilePayload) {
      return api.patch<ApiResponse<AuthUser>>('/auth/me', payload);
   },

   changePassword(payload: ChangePasswordPayload) {
      return api.post<ApiResponse<null>>('/auth/change-password', payload);
   },

   forceChangePassword(payload: ForceChangePasswordPayload) {
      return api.post<ApiResponse<AuthUser>>(
         '/auth/force-change-password',
         payload,
      );
   },

   checkUsername(username: string) {
      return api.get<ApiResponse<CheckUsernameData>>('/auth/check-username', {
         params: { username },
      });
   },
};
