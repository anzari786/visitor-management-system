'use client';

import { usersService } from '@/services/users.service';
import type {
   ChangeUserRolePayload,
   CreateUserPayload,
   ToggleUserStatusPayload,
   UpdateUserPayload,
   User,
   UserApiRecord,
   UsersPaginatedData,
   UsersParams,
} from '@/types/user.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';

export const userQueryKeys = {
   all: ['users'] as const,
   lists: () => [...userQueryKeys.all, 'list'] as const,
   list: (params: UsersParams) => [...userQueryKeys.lists(), params] as const,
   detail: (id: number) => [...userQueryKeys.all, 'detail', id] as const,
};

function normalizeUser(user: UserApiRecord): User {
   const firstRole = user.roles[0];
   const role = typeof firstRole === 'string' ? firstRole : firstRole?.name;

   return {
      id: Number(user.id),
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username ?? '',
      email: user.email,
      phone: user.phone,
      role: role ?? 'RECEPTION',
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword ?? user.passwordSetupPending ?? false,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      checkIns: 0,
      checkOuts: 0,
      employee: user.employee,
   };
}

export function useUsers(params: UsersParams) {
   return useQuery({
      queryKey: userQueryKeys.list(params),
      queryFn: async () => {
         const { data } = await usersService.getAll({
            page: params.page,
            limit: params.pageSize,
            search: params.search,
            role: params.role === 'all' ? undefined : params.role,
            isActive:
               params.status === 'all'
                  ? undefined
                  : params.status === 'active',
         });

         return {
            data: data.data.map(normalizeUser),
            total: data.pagination.total,
            page: data.pagination.page,
            pageSize: data.pagination.limit,
            pageCount: data.pagination.totalPages,
         } satisfies UsersPaginatedData;
      },
      placeholderData: (previous) => previous,
   });
}

export function useUsersCount() {
   const { data } = useQuery({
      queryKey: [...userQueryKeys.all, 'count'],
      queryFn: async () => {
         const { data } = await usersService.getAll({ page: 1, limit: 1 });
         return data.pagination.total;
      },
   });

   return data ?? 0;
}

export function useUser(id: number | null) {
   return useQuery({
      queryKey: userQueryKeys.detail(id ?? 0),
      queryFn: async () => {
         const { data } = await usersService.getById(id as number);
         return normalizeUser(data.data);
      },
      enabled: !!id,
   });
}

export function useCreateUser() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async (payload: CreateUserPayload) => {
         const { data } = await usersService.create(payload);
         return data.data;
      },
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: userQueryKeys.all });
      },
   });
}

export function useUpdateUser() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async (payload: UpdateUserPayload) => {
         const { data } = await usersService.update(payload);
         return normalizeUser(data.data);
      },
      onSuccess: (updated) => {
         queryClient.setQueryData(userQueryKeys.detail(updated.id), updated);
         queryClient.invalidateQueries({ queryKey: userQueryKeys.all });
      },
   });
}

export function useResetPassword() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async (id: number) => {
         const { data } = await usersService.resetPassword(id);
         return data.data;
      },
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: userQueryKeys.all });
      },
   });
}

export function useChangeRole() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async (payload: ChangeUserRolePayload) => {
         const { data } = await usersService.changeRole(payload);
         return normalizeUser(data.data);
      },
      onSuccess: (updated) => {
         queryClient.setQueryData(userQueryKeys.detail(updated.id), updated);
         queryClient.invalidateQueries({ queryKey: userQueryKeys.all });
      },
   });
}

export function useToggleUserStatus() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async (payload: ToggleUserStatusPayload) => {
         const { data } = await usersService.toggleStatus(payload);
         return normalizeUser(data.data);
      },
      onSuccess: (updated) => {
         queryClient.setQueryData(userQueryKeys.detail(updated.id), updated);
         queryClient.invalidateQueries({ queryKey: userQueryKeys.all });
      },
   });
}

/** Small helper for optimistic role UI in menus. */
export function useSyncedRole(user: User) {
   const [role, setRole] = React.useState(user.role);

   React.useEffect(() => {
      setRole(user.role);
   }, [user.role]);

   return [role, setRole] as const;
}
