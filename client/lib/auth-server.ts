import { User } from '@/types/user.types';
import { cookies } from 'next/headers';
import { DEV_USER } from '@/lib/auth-dev';
import { isDevelopmentAuthBypassEnabled } from '@/lib/auth-config';

// Server-side requests never leave the network, so in Docker they go straight
// to the API container; the browser keeps using the public NEXT_PUBLIC_API_URL.
const API_URL = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL;

export async function getServerUser(): Promise<User | null> {
   if (isDevelopmentAuthBypassEnabled) return DEV_USER;

   const cookieStore = await cookies();

   const sessionCookie = cookieStore.get('vms.sid');

   if (!sessionCookie) return null;

   try {
      const res = await fetch(`${API_URL}/auth/me`, {
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
