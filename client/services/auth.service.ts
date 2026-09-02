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

const BASE = '/v1/auth';

export const authService = {
   login(payload: LoginPayload) {
      return api.post<ApiResponse<LoginData>>(`${BASE}/login`, payload);
   },

   logout() {
      return api.post<ApiResponse<null>>(`${BASE}/logout`);
   },

   getMe() {
      return api.get<ApiResponse<User>>(`${BASE}/me`);
   },

   updateProfile(payload: UpdateProfilePayload) {
      return api.patch<ApiResponse<User>>(`${BASE}/me`, payload);
   },

   changePassword(payload: ChangePasswordPayload) {
      return api.post<ApiResponse<null>>(`${BASE}/change-password`, payload);
   },

   forceChangePassword(payload: ForceChangePasswordPayload) {
      return api.post<ApiResponse<User>>(
         `${BASE}/force-change-password`,
         payload,
      );
   },

   completePasswordSetup(payload: CompletePasswordSetupPayload) {
      return api.post<ApiResponse<null>>(
         `${BASE}/password/setup/complete`,
         payload,
      );
   },

   checkUsername(username: string) {
      return api.get<ApiResponse<CheckUsernameData>>(`${BASE}/check-username`, {
         params: { username },
      });
   },
};
