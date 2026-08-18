import type { NavItem } from '@/components/layout/nav-main';
import { STAFF_ROLES } from '@/constants/user';
import { hasAnyRole } from '@/lib/access';
import { UserRole } from '@/types/user.types';
import {
   Briefcase,
   ClipboardList,
   IdCard,
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
   hidden?: boolean;
};

const SIDEBAR_GROUPS = ['Workspace', 'Administration'] as const;

export const navigation: NavigationItem[] = [
   {
      title: 'Dashboard',
      icon: LayoutGrid,
      href: '/dashboard',
      isRoot: true,
      group: 'Workspace',
      roles: STAFF_ROLES,
   },
   {
      title: 'Visits',
      icon: ClipboardList,
      href: '/visits',
      group: 'Workspace',
      roles: STAFF_ROLES,
   },
   {
      title: 'Badges',
      icon: IdCard,
      href: '/badge',
      group: 'Workspace',
      roles: STAFF_ROLES,
   },
   {
      title: 'Visit Requests',
      icon: Inbox,
      href: '/visit-requests',
      group: 'Workspace',
      roles: STAFF_ROLES,
   },
   {
      title: 'Departments',
      icon: Briefcase,
      href: '/departments',
      group: 'Administration',
      roles: STAFF_ROLES,
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

export function getSidebarNavItems(roles: UserRole[]): NavItem[] {
   const visible = navigation.filter(
      (item) => hasAnyRole(roles, item.roles) && !item.hidden,
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
