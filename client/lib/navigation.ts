import type { NavItem } from '@/components/layout/nav-main';
import type { TranslationKey } from '@/lib/i18n';
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
   /** English label — kept for stable DOM ids and command-palette matching. */
   title: string;
   /** Dictionary key used to render the label in the active language. */
   titleKey: TranslationKey;
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

/** Sidebar/command-palette group headings, per language. */
export const GROUP_LABEL_KEYS: Record<NavigationItem['group'], TranslationKey> =
   {
      Workspace: 'nav.workspace',
      Administration: 'nav.administration',
      Operations: 'nav.operations',
   };

export const navigation: NavigationItem[] = [
   {
      title: 'Dashboard',
      titleKey: 'nav.dashboard',
      icon: LayoutGrid,
      href: '/dashboard',
      isRoot: true,
      group: 'Workspace',
      roles: ['ADMIN', 'RECEPTION', 'GUARD', 'MANAGER'],
   },
   {
      title: 'Visits',
      titleKey: 'nav.visits',
      icon: ClipboardList,
      href: '/visits',
      group: 'Workspace',
      roles: ['ADMIN', 'RECEPTION', 'GUARD', 'MANAGER'],
   },
   {
      title: 'Visit Requests',
      titleKey: 'nav.visitRequests',
      icon: Inbox,
      href: '/visit-requests',
      group: 'Workspace',
      roles: ['ADMIN', 'RECEPTION', 'GUARD', 'MANAGER'],
   },
   {
      title: 'Departments',
      titleKey: 'nav.departments',
      icon: Briefcase,
      href: '/departments',
      group: 'Administration',
      roles: ['ADMIN', 'RECEPTION', 'GUARD', 'MANAGER'],
   },
   {
      title: 'Users',
      titleKey: 'nav.users',
      icon: Users,
      href: '/users',
      group: 'Administration',
      roles: ['ADMIN'],
   },
   {
      title: 'Settings',
      titleKey: 'nav.settings',
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
         { label: group, labelKey: GROUP_LABEL_KEYS[group], isSection: true },
         ...items.map((item) => ({
            title: item.title,
            titleKey: item.titleKey,
            icon: item.icon,
            href: item.href,
            action: item.action,
         })),
      ];
   });
}
