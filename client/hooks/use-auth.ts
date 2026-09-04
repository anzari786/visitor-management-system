import { useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth-store';
import type {
   ChangePasswordPayload,
   ForceChangePasswordPayload,
   CompletePasswordSetupPayload,
   LoginPayload,
   UpdateProfilePayload,
} from '@/types/auth.types';
import type { User } from '@/types/user.types';
import { AxiosError } from 'axios';
import { ApiErrorResponse } from '@/types/api.types';

// ─── Auth ──────────────────────────────────────────────────────────────────────

export function useLogin() {
   const { setUser } = useAuthStore();
   const router = useRouter();

   return useMutation({
      mutationFn: async (payload: LoginPayload) => {
         const { data } = await authService.login(payload);

         return data.data;
      },

      onSuccess: ({ user }) => {
         setUser(user);

         router.push(
            user.mustChangePassword ? '/change-password' : '/dashboard',
         );
      },

      onError: (error: AxiosError<ApiErrorResponse>) => {
         if (!error.response) {
            toast.error(
               'Cannot connect to server. Please check your internet connection.',
            );
            return;
         }

         const message =
            error.response.data?.message ?? 'Login failed. Please try again.';

         toast.error(message);
      },
   });
}

export function useDevelopmentSsoLogin() {
   const { setUser } = useAuthStore();
   const router = useRouter();

   return useMutation({
      mutationFn: async () => {
         const { data } = await authService.developmentSsoLogin();
         return data.data;
      },
      onSuccess: ({ user }) => {
         setUser(user);
         router.push('/host');
      },
      onError: (error: AxiosError<ApiErrorResponse>) => {
         toast.error(
            error.response?.data?.message ??
               'SSO login failed. Please try again.',
         );
      },
   });
}

export function useLogout() {
   const { clearAuth } = useAuthStore();
   const router = useRouter();

   return useMutation({
      mutationFn: async () => {
         const { data } = await authService.logout();
         return data;
      },
      onSuccess: (response) => {
         clearAuth();
         toast.success(response?.message ?? 'Logged out successfully');
         router.push('/login');
      },
      onError: (error: AxiosError<ApiErrorResponse>) => {
         const message =
            error.response?.data?.message ??
            'Failed to log out. Please try again.';
         toast.error(message);
      },
      onMutate: () => undefined,
   });
}

// ─── Profile ───────────────────────────────────────────────────────────────────

export function useCurrentUser(enabled = true) {
   const { setUser, clearAuth, isHydrated } = useAuthStore();

   const query = useQuery<User>({
      queryKey: ['auth', 'me'],
      queryFn: async () => {
         const { data } = await authService.getMe();
         return data.data;
      },
      enabled: enabled && isHydrated,
      staleTime: 5 * 60_000,
      retry: false,
   });

   useEffect(() => {
      if (query.data) {
         setUser(query.data);
         return;
      }

      if (query.isError) {
         clearAuth();
      }
   }, [query.data, query.isError, setUser, clearAuth]);

   return query;
}

export function useUpdateProfile() {
   const { setUser } = useAuthStore();

   return useMutation({
      mutationFn: async (payload: UpdateProfilePayload) => {
         const { data } = await authService.updateProfile(payload);
         return data.data;
      },
      onSuccess: (updatedUser: User) => {
         setUser(updatedUser);
      },
   });
}

export function useChangePassword() {
   return useMutation({
      mutationFn: async (payload: ChangePasswordPayload) => {
         const { data } = await authService.changePassword(payload);
         return data.data;
      },
   });
}

export function useForceChangePassword(options?: {
   redirectOnSuccess?: boolean;
}) {
   const { setUser } = useAuthStore();
   const router = useRouter();

   return useMutation({
      mutationFn: async (payload: ForceChangePasswordPayload) => {
         const { data } = await authService.forceChangePassword(payload);
         return data.data;
      },
      onSuccess: (updatedUser: User) => {
         // Server returns the updated user with mustChangePassword: false
         setUser(updatedUser);
         toast.success('Password updated. Welcome!');
         if (options?.redirectOnSuccess !== false) {
            router.push('/');
         }
      },
      onError: () => {
         toast.error('Failed to update password. Please try again.');
      },
   });
}

export function useCompletePasswordSetup() {
   return useMutation({
      mutationFn: async (payload: CompletePasswordSetupPayload) => {
         const { data } = await authService.completePasswordSetup(payload);
         return data.data;
      },
   });
}

// ─── Username availability ─────────────────────────────────────────────────────

export function useCheckUsername(username: string, enabled: boolean) {
   return useQuery({
      queryKey: ['username-check', username],
      queryFn: async () => {
         const { data } = await authService.checkUsername(username);
         return data.data;
      },
      enabled: enabled && username.length >= 3,
      staleTime: 30_000,
      retry: false,
   });
}
