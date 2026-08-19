import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthUser } from '@/types/user.types';
import { DEV_USER } from '@/lib/auth-dev';

type AuthState = {
   user: AuthUser | null;
   isAuthenticated: boolean;
   isHydrated: boolean;

   setUser: (user: AuthUser) => void;
   clearAuth: () => void;
   setHydrated: () => void;
};

const DEV_BYPASS_AUTH =
   process.env.NODE_ENV === 'development' &&
   process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true';

export const useAuthStore = create<AuthState>()(
   persist(
      (set) => ({
         user: null,
         isAuthenticated: false,
         isHydrated: false,

         setUser: (user) => set({ user, isAuthenticated: true }),
         clearAuth: () => set({ user: null, isAuthenticated: false }),
         setHydrated: () => set({ isHydrated: true }),
      }),
      {
         name: 'vms-auth-v2',
         storage: createJSONStorage(() => localStorage),
         partialize: (state) => ({
            user: state.user,
            isAuthenticated: state.isAuthenticated,
         }),
         onRehydrateStorage: () => (state) => {
            if (DEV_BYPASS_AUTH && state && !state.user) {
               state.setUser(DEV_USER);
            }
            state?.setHydrated();
         },
      },
   ),
);
