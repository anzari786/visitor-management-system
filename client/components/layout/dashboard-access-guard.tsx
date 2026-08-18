'use client';

import { canAccessPath, homePathForRoles } from '@/lib/access';
import type { UserRole } from '@/types/user.types';
import { redirect, usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

type DashboardAccessGuardProps = {
   roles: UserRole[];
   children: ReactNode;
};

export function DashboardAccessGuard({
   roles,
   children,
}: DashboardAccessGuardProps) {
   const pathname = usePathname();

   if (!canAccessPath(roles, pathname)) {
      redirect(homePathForRoles(roles));
   }

   return children;
}
