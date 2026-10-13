import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types/user.types';
import { DEV_USER } from '@/lib/auth-dev';
import { isDevelopmentAuthBypassEnabled } from '@/lib/auth-config';

type AuthState = {
   user: User | null;
   isAuthenticated: boolean;
   isHydrated: boolean;

   setUser: (user: User) => void;
   clearAuth: () => void;
   setHydrated: () => void;
};

export const useAuthStore = create<AuthState>()(
   persist(
      (set) => ({
         user: null,
         isAuthenticated: false,
         isHydrated: false,

         setUser: (user) =>
            set({ user, isAuthenticated: true, isHydrated: true }),
         clearAuth: () =>
            set({ user: null, isAuthenticated: false, isHydrated: true }),
         setHydrated: () => set({ isHydrated: true }),
      }),
      {
         name: 'vms-auth',
         storage: createJSONStorage(() => localStorage),
         partialize: (state) => ({
            user: state.user,
            isAuthenticated: state.isAuthenticated,
         }),
         onRehydrateStorage: () => (state) => {
            if (isDevelopmentAuthBypassEnabled && state && !state.user) {
               state.setUser(DEV_USER);
            }
            state?.setHydrated();
         },
      },
   ),
);
