'use client';

import { getUserFullName } from '@/lib/user';
import { useMockUsersStore } from '@/store/mock-users-store';
import type {
   ChangeUserRolePayload,
   CreateUserPayload,
   ToggleUserStatusPayload,
   UpdateUserPayload,
   User,
   UsersPaginatedData,
   UsersParams,
} from '@/types/user.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';

/**
 * Query keys mirror the future API-backed shape so list/detail caching
 * can move to `usersService` without rewriting consumers.
 */
export const userQueryKeys = {
   all: ['users'] as const,
   lists: () => [...userQueryKeys.all, 'list'] as const,
   list: (params: UsersParams) => [...userQueryKeys.lists(), params] as const,
   detail: (id: number) => [...userQueryKeys.all, 'detail', id] as const,
};

function filterUsers(users: User[], params: UsersParams): UsersPaginatedData {
   const search = params.search?.trim().toLowerCase();
   let filtered = users;

   if (search) {
      filtered = filtered.filter((user) => {
         const fullName = getUserFullName(user).toLowerCase();
         return (
            fullName.includes(search) ||
            user.username.toLowerCase().includes(search) ||
            (user.phone?.toLowerCase().includes(search) ?? false)
         );
      });
   }

   if (params.role && params.role !== 'all') {
      filtered = filtered.filter((user) => user.role === params.role);
   }

   if (params.status && params.status !== 'all') {
      const isActive = params.status === 'active';
      filtered = filtered.filter((user) => user.isActive === isActive);
   }

   const total = filtered.length;
   const pageCount = Math.max(1, Math.ceil(total / params.pageSize));
   const page = Math.min(params.page, pageCount);
   const start = (page - 1) * params.pageSize;
   const data = filtered.slice(start, start + params.pageSize);

   return {
      data,
      total,
      page,
      pageSize: params.pageSize,
      pageCount: total === 0 ? 0 : pageCount,
   };
}

function useMockUsersVersion() {
   const users = useMockUsersStore((state) => state.users);
   return users;
}

/** Paginated users list — currently filtered from mock store data. */
export function useUsers(params: UsersParams) {
   const users = useMockUsersVersion();

   return useQuery({
      queryKey: [...userQueryKeys.list(params), users],
      queryFn: async () => filterUsers(users, params),
      placeholderData: (previous) => previous,
   });
}

export function useUsersCount() {
   const users = useMockUsersVersion();
   return users.length;
}

export function useUser(id: number | null) {
   const users = useMockUsersVersion();

   return useQuery({
      queryKey: [...userQueryKeys.detail(id ?? 0), users],
      queryFn: async () => {
         const user = users.find((item) => item.id === id);
         if (!user) {
            throw new Error('User not found');
         }
         return user;
      },
      enabled: !!id,
   });
}

export function useCreateUser() {
   const createUser = useMockUsersStore((state) => state.createUser);
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async (payload: CreateUserPayload) => createUser(payload),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
      },
   });
}

export function useUpdateUser() {
   const updateUser = useMockUsersStore((state) => state.updateUser);
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async (payload: UpdateUserPayload) => updateUser(payload),
      onSuccess: (updated) => {
         queryClient.setQueryData(userQueryKeys.detail(updated.id), updated);
         queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
      },
   });
}

export function useResetPassword() {
   const resetPassword = useMockUsersStore((state) => state.resetPassword);

   return useMutation({
      mutationFn: async (id: number) => resetPassword(id),
   });
}

export function useChangeRole() {
   const changeRole = useMockUsersStore((state) => state.changeRole);
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async ({ id, role }: ChangeUserRolePayload) =>
         changeRole(id, role),
      onSuccess: (updated) => {
         queryClient.setQueryData(userQueryKeys.detail(updated.id), updated);
         queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
      },
   });
}

export function useToggleUserStatus() {
   const toggleStatus = useMockUsersStore((state) => state.toggleStatus);
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async ({ id, isActive }: ToggleUserStatusPayload) =>
         toggleStatus(id, isActive),
      onSuccess: (updated) => {
         queryClient.setQueryData(userQueryKeys.detail(updated.id), updated);
         queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
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
