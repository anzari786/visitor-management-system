'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
   Collapsible,
   CollapsibleContent,
   CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
   SidebarGroup,
   SidebarGroupLabel,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
   SidebarMenuSub,
   SidebarMenuSubButton,
   SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import type { NavigationAction } from '@/lib/navigation';
import { useSettingsDialogStore } from '@/store/settings-dialog-store';
import { useTranslation, type TranslationKey } from '@/lib/i18n';

export type NavItem = {
   label?: string;
   /** Dictionary key for the section heading. */
   labelKey?: TranslationKey;
   isSection?: boolean;
   title?: string;
   /** Dictionary key for the item label. */
   titleKey?: TranslationKey;
   icon?: LucideIcon;
   href?: string;
   action?: NavigationAction;
   children?: NavItem[];
};

function isRouteActive(pathname: string, href?: string) {
   if (!href || href === '#') return false;
   return pathname === href || pathname.startsWith(`${href}/`);
}

function hasActiveDescendant(pathname: string, item: NavItem): boolean {
   if (isRouteActive(pathname, item.href)) return true;
   return item.children?.some((child) => hasActiveDescendant(pathname, child)) ?? false;
}

export function NavMain({ items }: { items: NavItem[] }) {
   const pathname = usePathname();

   return (
      <>
         {items.map((item, index) => (
            <NavMainItem
               key={item.title || item.label || index}
               item={item}
               pathname={pathname}
            />
         ))}
      </>
   );
}

function NavMainItem({
   item,
   pathname,
}: {
   item: NavItem;
   pathname: string;
}) {
   const { t } = useTranslation();
   const label = item.titleKey ? t(item.titleKey) : item.title;
   const hasChildren = !!item.children?.length;
   const isParentActive = hasActiveDescendant(pathname, item);
   const [isOpen, setIsOpen] = React.useState(isParentActive);

   React.useEffect(() => {
      if (isParentActive) {
         setIsOpen(true);
      }
   }, [isParentActive]);

   if (item.isSection && item.label) {
      return (
         <SidebarGroup className="p-0 pt-5 first:pt-0">
            <SidebarGroupLabel className="p-0 text-xs font-medium uppercase text-sidebar-foreground">
               {item.labelKey ? t(item.labelKey) : item.label}
            </SidebarGroupLabel>
         </SidebarGroup>
      );
   }

   if (hasChildren && item.title) {
      return (
         <SidebarGroup className="p-0">
            <SidebarMenu>
               <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                  <SidebarMenuItem>
                     <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                           id={`nav-main-trigger-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                           tooltip={label}
                           isActive={isParentActive}
                           className={cn(
                              'rounded-md text-sm font-medium px-3 py-2 h-9 transition-colors cursor-pointer',
                              isParentActive && 'bg-primary! text-primary-foreground!',
                           )}
                        >
                           {item.icon && <item.icon size={16} />}
                           <span>{label}</span>
                           <ChevronRight
                              className={cn(
                                 'ml-auto transition-transform duration-200',
                                 isOpen && 'rotate-90',
                              )}
                           />
                        </SidebarMenuButton>
                     </CollapsibleTrigger>
                     <CollapsibleContent>
                        <SidebarMenuSub className="me-0 pe-0">
                           {item.children!.map((child, index) => (
                              <NavMainSubItem
                                 key={child.title || index}
                                 item={child}
                                 pathname={pathname}
                              />
                           ))}
                        </SidebarMenuSub>
                     </CollapsibleContent>
                  </SidebarMenuItem>
               </Collapsible>
            </SidebarMenu>
         </SidebarGroup>
      );
   }

   if (item.title && item.action) {
      return (
         <SidebarGroup className="p-0">
            <SidebarMenu>
               <SidebarMenuItem>
                  <SidebarMenuButton
                     id={`nav-main-button-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                     tooltip={label}
                     className="h-9 cursor-pointer rounded-md px-3 py-2 text-sm font-medium transition-colors"
                     onClick={() => {
                        if (item.action === 'open-settings') {
                           useSettingsDialogStore.getState().setOpen(true);
                        }
                     }}
                  >
                     {item.icon && <item.icon size={16} />}
                     <span>{label}</span>
                  </SidebarMenuButton>
               </SidebarMenuItem>
            </SidebarMenu>
         </SidebarGroup>
      );
   }

   if (item.title && item.href) {
      const active = isRouteActive(pathname, item.href);

      return (
         <SidebarGroup className="p-0">
            <SidebarMenu>
               <SidebarMenuItem>
                  <SidebarMenuButton
                     id={`nav-main-button-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                     tooltip={label}
                     isActive={active}
                     asChild
                     className={cn(
                        'rounded-md text-sm font-medium px-3 py-2 h-9 transition-colors cursor-pointer',
                        active && 'bg-primary! text-primary-foreground!',
                     )}
                  >
                     <Link href={item.href}>
                        {item.icon && <item.icon size={16} />}
                        <span>{label}</span>
                     </Link>
                  </SidebarMenuButton>
               </SidebarMenuItem>
            </SidebarMenu>
         </SidebarGroup>
      );
   }

   return null;
}

function NavMainSubItem({
   item,
   pathname,
}: {
   item: NavItem;
   pathname: string;
}) {
   const { t } = useTranslation();
   const label = item.titleKey ? t(item.titleKey) : item.title;
   const hasChildren = !!item.children?.length;
   const isItemActive = hasActiveDescendant(pathname, item);
   const [isOpen, setIsOpen] = React.useState(isItemActive);

   React.useEffect(() => {
      if (isItemActive) {
         setIsOpen(true);
      }
   }, [isItemActive]);

   if (hasChildren && item.title) {
      return (
         <SidebarMenuSubItem>
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
               <CollapsibleTrigger asChild>
                  <SidebarMenuSubButton
                     id={`nav-sub-trigger-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                     className="rounded-md text-sm font-medium px-3 py-2 h-9 cursor-pointer"
                  >
                     {item.icon && <item.icon size={16} />}
                     <span>{label}</span>
                     <ChevronRight
                        className={cn(
                           'ml-auto transition-transform duration-200',
                           isOpen && 'rotate-90',
                        )}
                     />
                  </SidebarMenuSubButton>
               </CollapsibleTrigger>
               <CollapsibleContent>
                  <SidebarMenuSub className="me-0 pe-0">
                     {item.children!.map((child, index) => (
                        <NavMainSubItem
                           key={child.title || index}
                           item={child}
                           pathname={pathname}
                        />
                     ))}
                  </SidebarMenuSub>
               </CollapsibleContent>
            </Collapsible>
         </SidebarMenuSubItem>
      );
   }

   if (item.title && item.href) {
      const active = isRouteActive(pathname, item.href);

      return (
         <SidebarMenuSubItem className="w-full">
            <SidebarMenuSubButton
               id={`nav-sub-button-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
               asChild
               isActive={active}
               className={cn(
                  'w-full rounded-md transition-colors',
                  active && 'bg-muted! text-foreground!',
               )}
            >
               <Link href={item.href}>{label}</Link>
            </SidebarMenuSubButton>
         </SidebarMenuSubItem>
      );
   }

   return null;
}
