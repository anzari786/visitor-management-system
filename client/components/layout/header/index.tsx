'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { BellRing, Globe, LayoutGrid } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useProfileAvatarStore } from '@/store/profile-avatar-store';
import { getNavigationItem } from '@/lib/navigation';
import {
   DEFAULT_PROFILE_AVATAR_ID,
   getProfileAvatarById,
} from '@/constants/profile-avatars';
import { AppCommand } from '@/components/layout/app-command';
import { ThemeToggle } from '@/components/theme-toggle';
import LanguageDropdown from './dropdown-language';
import ProfileDropdown from './dropdown-profile';
import Search from './search';
import NotificationDropdown from './notification-dropdown';

export default function Header() {
   const [commandOpen, setCommandOpen] = useState(false);
   const pathname = usePathname();
   const currentNavItem = getNavigationItem(pathname);
   const Icon = currentNavItem?.icon ?? LayoutGrid;
   const user = useAuthStore((state) => state.user);
   const avatarId = useProfileAvatarStore(
      (s) =>
         (user ? s.selections[String(user.id)] : undefined) ??
         DEFAULT_PROFILE_AVATAR_ID,
   );
   const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : 'U';
   const avatarSrc = getProfileAvatarById(avatarId).image;

   return (
      <header className="bg-card sticky top-0 z-50 border-b shrink-0">
         <div className="mx-auto flex items-center justify-between gap-6 px-4 py-2.5 sm:px-6">
            <div className="flex items-center gap-4 min-w-0">
               <SidebarTrigger className="[&_svg]:size-5! cursor-pointer shrink-0" />
               <Separator
                  orientation="vertical"
                  className="hidden h-4! sm:block self-center!"
               />
               <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <Icon className="size-4 sm:size-5 text-muted-foreground hidden sm:block shrink-0" />
                  <h1 className="text-sm sm:text-base font-medium truncate">
                     {currentNavItem?.title ?? 'Visitor Management System'}
                  </h1>
               </div>
            </div>
            <div className="shrink-0">
               <Search onOpen={() => setCommandOpen(true)} />
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
               <NotificationDropdown
                  defaultOpen={false}
                  align="end"
                  trigger={
                     <button
                        type="button"
                        className="rounded-full p-2 hover:bg-accent relative cursor-pointer"
                     >
                        <BellRing className="size-4" />
                     </button>
                  }
               />
               <ThemeToggle />
               <LanguageDropdown
                  trigger={
                     <Button
                        id="language-dropdown-trigger-06"
                        variant="ghost"
                        size="icon"
                        className="focus-visible:ring-0! focus-visible:shadow-none! rounded-full! hover:bg-accent/80! cursor-pointer"
                        suppressHydrationWarning
                     >
                        <Globe size={16} />
                     </Button>
                  }
               />
               <ProfileDropdown
                  trigger={
                     <Button
                        id="profile-dropdown-trigger-06"
                        variant="ghost"
                        size="icon"
                        className="size-7 rounded-full cursor-pointer"
                        suppressHydrationWarning
                     >
                        <Avatar className="size-7 rounded-full">
                           <AvatarImage
                              src={avatarSrc}
                              alt={
                                 user
                                    ? `${user.firstName} ${user.lastName}`
                                    : 'User'
                              }
                           />
                           <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                     </Button>
                  }
               />
            </div>
         </div>
         <AppCommand open={commandOpen} onOpenChange={setCommandOpen} />
      </header>
   );
}
