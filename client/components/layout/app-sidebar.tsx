'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
   Sidebar,
   SidebarContent,
   SidebarFooter,
   SidebarHeader,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
   useSidebar,
} from '@/components/ui/sidebar';
import { getSidebarNavItems } from '@/lib/navigation';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth-store';
import { useProfileAvatarStore } from '@/store/profile-avatar-store';
import {
   DEFAULT_PROFILE_AVATAR_ID,
   getProfileAvatarById,
} from '@/constants/profile-avatars';
import { ChevronsUpDown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import * as React from 'react';
import { AppSidebarSkeleton } from './app-sidebar-skeleton';
import { NavMain } from './nav-main';
import ProfileDropdown from './profile-dropdown';
import { getUserFullName } from '@/lib/user';
import type { User } from '@/types/user.types';

function SidebarBrand() {
   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <SidebarMenuButton
               asChild
               className="h-auto! items-center gap-3 overflow-visible! px-2.5 py-3 hover:bg-transparent active:bg-transparent data-[active=true]:bg-transparent data-[active=true]:font-normal"
            >
               <Link href="/dashboard">
                  <div className="flex aspect-square size-11 items-center justify-center rounded-xl border bg-card p-1 shrink-0">
                     <Image
                        src="/logo.png"
                        alt="Ethiopian Agricultural Transformation Institute logo"
                        width={44}
                        height={44}
                        priority
                        className="size-full object-contain"
                     />
                  </div>
                  <div className="grid min-w-0 flex-1 gap-0 text-left leading-none group-data-[collapsible=icon]:hidden">
                     <span className="text-lg font-bold tracking-tight text-primary">
                        ATI
                     </span>
                     <span className="mt-0.5 text-sm text-muted-foreground whitespace-nowrap leading-snug">
                        Visitor Management System
                     </span>
                  </div>
               </Link>
            </SidebarMenuButton>
         </SidebarMenuItem>
      </SidebarMenu>
   );
}

function NavUser({ user }: { user: User }) {
   const { isMobile } = useSidebar();
   const fullName = getUserFullName(user);
   const avatarId = useProfileAvatarStore(
      (s) => s.selections[String(user.id)] ?? DEFAULT_PROFILE_AVATAR_ID,
   );
   const avatarSrc = getProfileAvatarById(avatarId).image;

   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <ProfileDropdown
               side={isMobile ? 'bottom' : 'top'}
               align="start"
               sideOffset={8}
               trigger={
                  <SidebarMenuButton
                     size="lg"
                     className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                     <Avatar className="size-8 rounded-full">
                        <AvatarImage src={avatarSrc} alt={fullName} />
                        <AvatarFallback className="rounded-full">
                           {user.firstName[0]}
                           {user.lastName[0]}
                        </AvatarFallback>
                     </Avatar>
                     <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                        <span className="truncate font-semibold">
                           {fullName}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                           {user.username}
                        </span>
                     </div>
                     <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
               }
            />
         </SidebarMenuItem>
      </SidebarMenu>
   );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
   const user = useAuthStore((state) => state.user);
   const isHydrated = useAuthStore((state) => state.isHydrated);
   const setUser = useAuthStore((state) => state.setUser);
   const clearAuth = useAuthStore((state) => state.clearAuth);

   React.useEffect(() => {
      if (user || !isHydrated) return;

      let isMounted = true;

      authService
         .getMe()
         .then(({ data }) => {
            if (isMounted && data?.data) {
               setUser(data.data);
            }
         })
         .catch(() => {
            if (isMounted) {
               clearAuth();
            }
         });

      return () => {
         isMounted = false;
      };
   }, [clearAuth, isHydrated, setUser, user]);

   if (!isHydrated) {
      return <AppSidebarSkeleton {...props} />;
   }

   if (!user) {
      return null;
   }

   const navItems = getSidebarNavItems(user.role);

   return (
      <Sidebar
         variant="floating"
         collapsible="offcanvas"
         className="p-4 h-full [&_[data-slot=sidebar-inner]]:h-full"
         {...props}
      >
         <div className="flex h-full flex-col gap-4 overflow-hidden">
            <SidebarHeader className="px-2 pt-3 pb-1">
               <SidebarBrand />
            </SidebarHeader>

            <SidebarContent className="overflow-hidden px-2">
               <NavMain items={navItems} />
            </SidebarContent>

            <SidebarFooter className="px-2 pb-2">
               <NavUser user={user} />
            </SidebarFooter>
         </div>
      </Sidebar>
   );
}
