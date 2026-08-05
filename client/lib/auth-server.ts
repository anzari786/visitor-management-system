import { User } from '@/types/user.types';
import { cookies } from 'next/headers';
import { DEV_USER } from '@/lib/auth-dev';

// Server-only flag (no NEXT_PUBLIC_ prefix) — never exposed to the browser bundle.
const DEV_BYPASS_AUTH =
   process.env.NODE_ENV === 'development' &&
   process.env.DEV_BYPASS_AUTH === 'true';

export async function getServerUser(): Promise<User | null> {
   if (DEV_BYPASS_AUTH) {
      return DEV_USER;
   }

   const cookieStore = await cookies();

   const sessionCookie = cookieStore.get('vms.sid');

   if (!sessionCookie) return null;

   try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
         headers: {
            Cookie: `vms.sid=${sessionCookie.value}`,
         },
         // Don't cache — always get fresh auth state
         cache: 'no-store',
      });

      if (!res.ok) return null;

      const json = await res.json();
      return json.data as User;
   } catch {
      return null;
   }
}
