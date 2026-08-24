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

export function useLogout() {
   const { clearAuth } = useAuthStore();
   const router = useRouter();

   return useMutation({
      mutationFn: async () => {
         const { data } = await authService.logout();
         return data.data;
      },
      onSuccess: () => {
         clearAuth();
         router.push('/login');
      },
      onError: () => {
         // Clear client state regardless — don't leave the user stuck
         clearAuth();
         router.push('/login');
      },
   });
}

// ─── Profile ───────────────────────────────────────────────────────────────────

export function useUpdateProfile() {
   const { setUser } = useAuthStore();

   return useMutation({
      mutationFn: async (payload: UpdateProfilePayload) => {
         const { data } = await authService.updateProfile(payload);
         return data.data;
      },
      onSuccess: (updatedUser) => {
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
      onSuccess: (updatedUser) => {
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
