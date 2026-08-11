import type { NavItem } from '@/components/layout/nav-main';
import { UserRole } from '@/types/user.types';
import {
   Briefcase,
   ClipboardList,
   IdCard,
   Inbox,
   LayoutGrid,
   LucideIcon,
   Settings,
   UserCircle,
   Users,
} from 'lucide-react';

type NavigationItem = {
   title: string;
   icon: LucideIcon;
   href: string;
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
      roles: ['admin', 'front_desk'],
   },
   {
      title: 'Visits',
      icon: ClipboardList,
      href: '/visits',
      group: 'Workspace',
      roles: ['admin', 'front_desk'],
   },
   {
      title: 'Badges',
      icon: IdCard,
      href: '/badge',
      group: 'Workspace',
      roles: ['admin', 'front_desk'],
   },
   {
      title: 'Visit Requests',
      icon: Inbox,
      href: '/visit-requests',
      group: 'Workspace',
      roles: ['admin', 'front_desk'],
   },
   {
      title: 'Departments',
      icon: Briefcase,
      href: '/departments',
      group: 'Administration',
      roles: ['admin', 'front_desk'],
   },
   {
      title: 'Users',
      icon: Users,
      href: '/users',
      group: 'Administration',
      roles: ['admin'],
   },
   {
      title: 'Settings',
      icon: Settings,
      href: '/settings',
      group: 'Administration',
      roles: ['admin'],
   },
   {
      title: 'Profile',
      icon: UserCircle,
      href: '/profile',
      group: 'Workspace',
      roles: ['admin', 'front_desk'],
      hidden: true,
   },
];

export const getNavigationItem = (pathname: string) => {
   return navigation.find(
      (item) => item.href === pathname || pathname.startsWith(`${item.href}/`),
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
         })),
      ];
   });
}
