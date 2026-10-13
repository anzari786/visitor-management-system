'use client';

import {
   CommandDialog,
   CommandEmpty,
   CommandGroup,
   CommandInput,
   CommandItem,
   CommandList,
   CommandSeparator,
} from '@/components/ui/command';
import { GROUP_LABEL_KEYS, navigation } from '@/lib/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useProfileDialogStore } from '@/store/profile-dialog-store';
import { useSettingsDialogStore } from '@/store/settings-dialog-store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LogOut, UserCircle } from 'lucide-react';
import { useLogout } from '@/hooks/use-auth';
import { useState } from 'react';
import { LogoutConfirmDialog } from './logout-confirm-dialog';
import { useTranslation } from '@/lib/i18n';

type AppCommandProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
};

export function AppCommand({ open, onOpenChange }: AppCommandProps) {
   const { t } = useTranslation();
   const router = useRouter();
   const user = useAuthStore((state) => state.user);
   const setProfileOpen = useProfileDialogStore((s) => s.setOpen);
   const setSettingsOpen = useSettingsDialogStore((s) => s.setOpen);
   const { mutate: logout, isPending: isLoggingOut } = useLogout();
   const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

   useEffect(() => {
      const handler = (e: KeyboardEvent) => {
         if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            onOpenChange(!open);
         }
      };
      document.addEventListener('keydown', handler);
      return () => document.removeEventListener('keydown', handler);
   }, [open, onOpenChange]);

   function go(href: string) {
      router.push(href);
      onOpenChange(false);
   }

   function run(fn: () => void) {
      onOpenChange(false);
      fn();
   }

   function selectNavItem(item: (typeof navigation)[number]) {
      if (item.action === 'open-settings') {
         run(() => setSettingsOpen(true));
         return;
      }
      if (item.href) {
         go(item.href);
      }
   }

   const filteredNav = user
      ? navigation.filter((item) => item.roles.includes(user.role))
      : [];

   const workspaceItems = filteredNav.filter((i) => i.group === 'Workspace');
   const adminItems = filteredNav.filter((i) => i.group === 'Administration');

   return (
      <>
         <CommandDialog open={open} onOpenChange={onOpenChange}>
            <CommandInput placeholder={t('command.placeholder')} />
            <CommandList>
               <CommandEmpty>{t('common.noResults')}</CommandEmpty>

               {workspaceItems.length > 0 && (
                  <CommandGroup heading={t(GROUP_LABEL_KEYS.Workspace)}>
                     {workspaceItems.map((item) => (
                        <CommandItem
                           key={item.href ?? item.action ?? item.title}
                           value={`${item.title} ${t(item.titleKey)}`}
                           onSelect={() => selectNavItem(item)}
                        >
                           <item.icon />
                           <span>{t(item.titleKey)}</span>
                        </CommandItem>
                     ))}
                  </CommandGroup>
               )}

               {adminItems.length > 0 && (
                  <>
                     <CommandSeparator />
                     <CommandGroup heading={t(GROUP_LABEL_KEYS.Administration)}>
                        {adminItems.map((item) => (
                           <CommandItem
                              key={item.href ?? item.action ?? item.title}
                              value={`${item.title} ${t(item.titleKey)}`}
                              onSelect={() => selectNavItem(item)}
                           >
                              <item.icon />
                              <span>{t(item.titleKey)}</span>
                           </CommandItem>
                        ))}
                     </CommandGroup>
                  </>
               )}

               <CommandSeparator />
               <CommandGroup heading={t('command.account')}>
                  <CommandItem
                     value="profile"
                     onSelect={() => run(() => setProfileOpen(true))}
                  >
                     <UserCircle />
                     <span>{t('header.profile')}</span>
                  </CommandItem>
                  <CommandItem
                     value="logout sign out"
                     onSelect={() => {
                        onOpenChange(false);
                        // Small delay to ensure CommandDialog closes before opening LogoutConfirmDialog
                        setTimeout(() => setLogoutConfirmOpen(true), 100);
                     }}
                  >
                     <LogOut />
                     <span>{t('header.logout')}</span>
                  </CommandItem>
               </CommandGroup>
            </CommandList>
         </CommandDialog>

         <LogoutConfirmDialog
            open={logoutConfirmOpen}
            onOpenChange={setLogoutConfirmOpen}
            onConfirm={() => logout()}
            isPending={isLoggingOut}
         />
      </>
   );
}
