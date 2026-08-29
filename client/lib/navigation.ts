import type { NavItem } from '@/components/layout/nav-main';
import { UserRole } from '@/types/user.types';
import {
   Briefcase,
   ClipboardList,
   Inbox,
   LayoutGrid,
   LucideIcon,
   Settings,
   Users,
} from 'lucide-react';

export type NavigationAction = 'open-settings';

type NavigationItem = {
   title: string;
   icon: LucideIcon;
   href?: string;
   action?: NavigationAction;
   group: 'Operations' | 'Administration' | 'Workspace';
   roles: UserRole[];
   isGradient?: boolean;
   isRoot?: boolean;
   hidden?: boolean; // excluded from sidebar rendering, still resolvable by getNavigationItem
};

const SIDEBAR_GROUPS = ['Workspace', 'Administration'] as const;

export const navigation: NavigationItem[] = [
   {
      title: 'Dashboard',
      icon: LayoutGrid,
      href: '/dashboard',
      isRoot: true,
      group: 'Workspace',
      roles: ['ADMIN', 'RECEPTION', 'GUARD', 'MANAGER'],
   },
   {
      title: 'Visits',
      icon: ClipboardList,
      href: '/visits',
      group: 'Workspace',
      roles: ['ADMIN', 'RECEPTION', 'GUARD', 'MANAGER'],
   },
   {
      title: 'Visit Requests',
      icon: Inbox,
      href: '/visit-requests',
      group: 'Workspace',
      roles: ['ADMIN', 'RECEPTION', 'GUARD', 'MANAGER'],
   },
   {
      title: 'Departments',
      icon: Briefcase,
      href: '/departments',
      group: 'Administration',
      roles: ['ADMIN', 'RECEPTION', 'GUARD', 'MANAGER'],
   },
   {
      title: 'Users',
      icon: Users,
      href: '/users',
      group: 'Administration',
      roles: ['ADMIN'],
   },
   {
      title: 'Settings',
      icon: Settings,
      action: 'open-settings',
      group: 'Administration',
      roles: ['ADMIN'],
   },
];

export const getNavigationItem = (pathname: string) => {
   return navigation.find(
      (item) =>
         !!item.href &&
         (item.href === pathname || pathname.startsWith(`${item.href}/`)),
   );
};

export function getSidebarNavItems(role: UserRole): NavItem[] {
   const visible = navigation.filter(
      (item) => item.roles.includes(role) && !item.hidden,
   );

   return SIDEBAR_GROUPS.flatMap((group) => {
      const items = visible.filter((item) => item.group === group);
      if (items.length === 0) return [];

      return [
         { label: group, isSection: true },
         ...items.map((item) => ({
            title: item.title,
            icon: item.icon,
            href: item.href,
            action: item.action,
         })),
      ];
   });
}
