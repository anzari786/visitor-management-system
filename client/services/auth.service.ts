import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';

import type {
   LoginData,
   LoginPayload,
   UpdateProfilePayload,
   ChangePasswordPayload,
   ForceChangePasswordPayload,
   CompletePasswordSetupPayload,
   CheckUsernameData,
} from '@/types/auth.types';

import type { User } from '@/types/user.types';

export const authService = {
   login(payload: LoginPayload) {
      return api.post<ApiResponse<LoginData>>('/auth/login', payload);
   },

   logout() {
      return api.post<ApiResponse<null>>('/auth/logout');
   },

   getMe() {
      return api.get<ApiResponse<User>>('/auth/me');
   },

   updateProfile(payload: UpdateProfilePayload) {
      return api.patch<ApiResponse<User>>('/auth/me', payload);
   },

   changePassword(payload: ChangePasswordPayload) {
      return api.post<ApiResponse<null>>('/auth/change-password', payload);
   },

   forceChangePassword(payload: ForceChangePasswordPayload) {
      return api.post<ApiResponse<User>>(
         '/auth/force-change-password',
         payload,
      );
   },

   completePasswordSetup(payload: CompletePasswordSetupPayload) {
      return api.post<ApiResponse<null>>(
         '/auth/password/setup/complete',
         payload,
      );
   },

   checkUsername(username: string) {
      return api.get<ApiResponse<CheckUsernameData>>('/auth/check-username', {
         params: { username },
      });
   },
};
