import type { AuthUser } from '@/types/user.types';
import { cookies } from 'next/headers';
import { DEV_USER } from '@/lib/auth-dev';
import { USER_ROLES } from '@/constants/user';

const DEV_BYPASS_AUTH =
   process.env.NODE_ENV === 'development' &&
   process.env.DEV_BYPASS_AUTH === 'true';

function isAuthUser(value: unknown): value is AuthUser {
   if (typeof value !== 'object' || value === null) return false;
   const record = value as Record<string, unknown>;
   if (typeof record.id !== 'string') return false;
   if (typeof record.firstName !== 'string') return false;
   if (typeof record.lastName !== 'string') return false;
   if (!Array.isArray(record.roles)) return false;
   return record.roles.every(
      (role) =>
         typeof role === 'string' &&
         (USER_ROLES as readonly string[]).includes(role),
   );
}

function resolveServerApiBase(): string | undefined {
   if (process.env.API_INTERNAL_URL) {
      return process.env.API_INTERNAL_URL;
   }
   if (process.env.API_PROXY_TARGET) {
      return `${process.env.API_PROXY_TARGET.replace(/\/$/, '')}/api/v1`;
   }
   return process.env.NEXT_PUBLIC_API_URL;
}

export async function getServerUser(): Promise<AuthUser | null> {
   if (DEV_BYPASS_AUTH) {
      return DEV_USER;
   }

   const cookieStore = await cookies();
   const sessionCookie = cookieStore.get('vms.sid');

   if (!sessionCookie) return null;

   const apiBase = resolveServerApiBase();
   if (!apiBase) return null;

   try {
      const res = await fetch(`${apiBase}/auth/me`, {
         headers: {
            Cookie: `vms.sid=${sessionCookie.value}`,
         },
         cache: 'no-store',
      });

      if (!res.ok) return null;

      const json: unknown = await res.json();
      if (typeof json !== 'object' || json === null) return null;
      const data = (json as { data?: unknown }).data;
      return isAuthUser(data) ? data : null;
   } catch {
      return null;
   }
}
