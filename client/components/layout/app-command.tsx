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
import { hasAnyRole } from '@/lib/access';
import { navigation } from '@/lib/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useProfileDialogStore } from '@/store/profile-dialog-store';
import { useSettingsDialogStore } from '@/store/settings-dialog-store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LogOut, UserCircle } from 'lucide-react';
import { useLogout } from '@/hooks/use-auth';

type AppCommandProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
};

export function AppCommand({ open, onOpenChange }: AppCommandProps) {
   const router = useRouter();
   const user = useAuthStore((state) => state.user);
   const setProfileOpen = useProfileDialogStore((s) => s.setOpen);
   const setSettingsOpen = useSettingsDialogStore((s) => s.setOpen);
   const { mutate: logout } = useLogout();

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
      ? navigation.filter((item) => hasAnyRole(user.roles, item.roles))
      : [];

   const workspaceItems = filteredNav.filter((i) => i.group === 'Workspace');
   const adminItems = filteredNav.filter((i) => i.group === 'Administration');

   return (
      <CommandDialog open={open} onOpenChange={onOpenChange}>
         <CommandInput placeholder="Search pages and actions..." />
         <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>

            {workspaceItems.length > 0 && (
               <CommandGroup heading="Workspace">
                  {workspaceItems.map((item) => (
                     <CommandItem
                        key={item.href ?? item.action ?? item.title}
                        value={item.title}
                        onSelect={() => selectNavItem(item)}
                     >
                        <item.icon />
                        <span>{item.title}</span>
                     </CommandItem>
                  ))}
               </CommandGroup>
            )}

            {adminItems.length > 0 && (
               <>
                  <CommandSeparator />
                  <CommandGroup heading="Administration">
                     {adminItems.map((item) => (
                        <CommandItem
                           key={item.href ?? item.action ?? item.title}
                           value={item.title}
                           onSelect={() => selectNavItem(item)}
                        >
                           <item.icon />
                           <span>{item.title}</span>
                        </CommandItem>
                     ))}
                  </CommandGroup>
               </>
            )}

            <CommandSeparator />
            <CommandGroup heading="Account">
               <CommandItem
                  value="profile"
                  onSelect={() => run(() => setProfileOpen(true))}
               >
                  <UserCircle />
                  <span>Profile</span>
               </CommandItem>
               <CommandItem
                  value="logout sign out"
                  onSelect={() => run(() => logout())}
               >
                  <LogOut />
                  <span>Log Out</span>
               </CommandItem>
            </CommandGroup>
         </CommandList>
      </CommandDialog>
   );
}
