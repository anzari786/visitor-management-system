import { api } from '@/lib/axios';
import type { ApiResponse, PaginatedApiResponse } from '@/types/api.types';
import type {
   ChangeUserRolePayload,
   CreateUserPayload,
   ResetPasswordData,
   ToggleUserStatusPayload,
   UpdateUserPayload,
   UserApiRecord,
   UserRole,
} from '@/types/user.types';

const BASE = '/v1/users';
export const usersService = {
   getAll(params?: {
      page?: number;
      limit?: number;
      search?: string;
      role?: UserRole;
      isActive?: boolean;
   }) {
      return api.get<PaginatedApiResponse<UserApiRecord[]>>(`${BASE}`, {
         params,
      });
   },

   getById(id: number) {
      return api.get<ApiResponse<UserApiRecord>>(`${BASE}/${id}`);
   },

   create(payload: CreateUserPayload) {
      return api.post<ApiResponse<UserApiRecord>>(`${BASE}`, payload);
   },

   update(payload: UpdateUserPayload) {
      const { id, role: _role, ...data } = payload;

      return api.patch<ApiResponse<UserApiRecord>>(`${BASE}/${id}`, data);
   },

   delete(id: number) {
      return api.delete<ApiResponse<null>>(`${BASE}/${id}`);
   },

   resetPassword(id: number) {
      return api.post<ApiResponse<ResetPasswordData>>(
         `${BASE}/${id}/password-setup`,
      );
   },

   changeRole(payload: ChangeUserRolePayload) {
      const request = async () => {
         if (payload.currentRole && payload.currentRole !== payload.role) {
            await api.delete(
               `${BASE}/${payload.id}/roles/${payload.currentRole}`,
            );
         }

         return api.post<ApiResponse<UserApiRecord>>(
            `${BASE}/${payload.id}/roles`,
            { role: payload.role },
         );
      };

      return request();
   },

   toggleStatus(payload: ToggleUserStatusPayload) {
      return api.patch<ApiResponse<UserApiRecord>>(`${BASE}/${payload.id}`, {
         isActive: payload.isActive,
      });
   },
};
