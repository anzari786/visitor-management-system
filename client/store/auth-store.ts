import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types/user.types';
import { DEV_USER } from '@/lib/auth-dev';

type AuthState = {
   user: User | null;
   isAuthenticated: boolean;
   isHydrated: boolean;

   setUser: (user: User) => void;
   clearAuth: () => void;
   setHydrated: () => void;
};

// process.env.NODE_ENV is statically replaced by Next.js at build time,
// so this whole branch is dead-code-eliminated from production bundles.
// This client-side flag only needs to stay in sync with the server's
// DEV_BYPASS_AUTH so the sidebar/UI show the same mock user the server
// already let through — it does not gate the redirect itself anymore.
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
         name: 'vms-auth',
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
