'use client';

import { useState, type ReactElement } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuGroup,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLogout } from '@/hooks/use-auth';
import { useAuthStore } from '@/store/auth-store';
import { useProfileDialogStore } from '@/store/profile-dialog-store';
import { getUserFullName } from '@/lib/user';
import { LogOut, UserCircle } from 'lucide-react';
import { LogoutConfirmDialog } from './logout-confirm-dialog';
import { useTranslation } from '@/lib/i18n';

type Props = {
   trigger: ReactElement;
   defaultOpen?: boolean;
   align?: 'start' | 'center' | 'end';
   side?: 'top' | 'right' | 'bottom' | 'left';
   sideOffset?: number;
};

const itemClass = 'px-3 py-2 text-sm cursor-pointer gap-2.5';

export default function ProfileDropdown({
   trigger,
   defaultOpen,
   align = 'end',
   side,
   sideOffset = 8,
}: Props) {
   const { t } = useTranslation();
   const [logoutOpen, setLogoutOpen] = useState(false);
   const setProfileOpen = useProfileDialogStore((s) => s.setOpen);
   const user = useAuthStore((state) => state.user);
   const { mutate: logout, isPending: loggingOut } = useLogout();

   const fullName = user ? getUserFullName(user) : t('header.userFallback');
   const initials = user
      ? `${user.firstName[0]}${user.lastName[0]}`
      : 'U';
   const subtitle = user?.username ?? '';
   const avatarSrc = user?.avatar ?? undefined;

   return (
      <>
         <DropdownMenu defaultOpen={defaultOpen}>
            <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>

            <DropdownMenuContent
               className="w-64 rounded-xl p-1"
               align={align}
               side={side}
               sideOffset={sideOffset}
            >
               <DropdownMenuGroup>
                  <DropdownMenuLabel className="flex items-center gap-2.5 px-2.5 py-2 font-normal">
                     <div className="relative shrink-0">
                        <Avatar className="size-9">
                           {avatarSrc ? (
                              <AvatarImage src={avatarSrc} alt={fullName} />
                           ) : null}
                           <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <span className="ring-card absolute right-0 bottom-0 size-2 rounded-full bg-green-600 ring-2" />
                     </div>

                     <div className="flex min-w-0 flex-col leading-tight">
                        <span className="truncate text-sm font-semibold text-foreground">
                           {fullName}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                           {subtitle}
                        </span>
                     </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator className="my-1" />

                  <DropdownMenuItem
                     className={itemClass}
                     onSelect={(event) => {
                        event.preventDefault();
                        setProfileOpen(true);
                     }}
                  >
                     <UserCircle className="size-4 text-foreground" />
                     <span>{t('header.profile')}</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-1" />

                  <DropdownMenuItem
                     variant="destructive"
                     className={itemClass}
                     onSelect={(event) => {
                        event.preventDefault();
                        setLogoutOpen(true);
                     }}
                  >
                     <LogOut className="size-4" />
                     <span>{t('header.logout')}</span>
                  </DropdownMenuItem>
               </DropdownMenuGroup>
            </DropdownMenuContent>
         </DropdownMenu>

         <LogoutConfirmDialog
            open={logoutOpen}
            onOpenChange={setLogoutOpen}
            isPending={loggingOut}
            onConfirm={() => logout()}
         />
      </>
   );
}
