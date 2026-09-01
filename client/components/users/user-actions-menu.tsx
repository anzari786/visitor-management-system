'use client';

import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuGroup,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuPortal,
   DropdownMenuRadioGroup,
   DropdownMenuRadioItem,
   DropdownMenuSeparator,
   DropdownMenuSub,
   DropdownMenuSubContent,
   DropdownMenuSubTrigger,
   DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
   useChangeRole,
   useResetPassword,
   useSyncedRole,
   useToggleUserStatus,
} from '@/hooks/use-users';
import { getUserFullName } from '@/lib/user';
import type { User, UserRole } from '@/types/user.types';
import { AxiosError } from 'axios';
import { Eye, KeyRound, Pencil, Shield, UserCheck, UserX } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { EditUser } from './edit-user';
import { ResetPasswordDialog } from './reset-password-dialog';
import { ToggleStatusDialog } from './toggle-status-dialog';
import { useTranslation } from '@/lib/i18n';

interface UserActionsMenuProps {
   user: User;
   trigger: React.ReactNode;
   align?: 'start' | 'end';
   onViewDetails?: (user: User) => void;
}

export function UserActionsMenu({
   user,
   trigger,
   align = 'end',
   onViewDetails,
}: UserActionsMenuProps) {
   const { t } = useTranslation();
   const [role, setRole] = useSyncedRole(user);

   const [editOpen, setEditOpen] = React.useState(false);
   const [resetDialogOpen, setResetDialogOpen] = React.useState(false);
   const [statusDialogOpen, setStatusDialogOpen] = React.useState(false);

   const { mutate: resetPassword, isPending: isResetting } = useResetPassword();
   const { mutate: changeRole, isPending: isChangingRole } = useChangeRole();
   const { mutate: toggleStatus, isPending: isTogglingStatus } =
      useToggleUserStatus();

   const handleResetConfirm = () => {
      resetPassword(user.id, {
         onSuccess: () => {
            toast.success(
               t('users.toast.resetSent', { name: getUserFullName(user) }),
            );
            setResetDialogOpen(false);
         },
         onError: (error) => {
            const message =
               error instanceof AxiosError
                  ? error.response?.data?.message
                  : undefined;
            toast.error(message ?? t('users.toast.resetFailed'));
            setResetDialogOpen(false);
         },
         });
   };

   const handleRoleChange = (nextRole: UserRole) => {
      setRole(nextRole);
      changeRole(
         { id: user.id, currentRole: user.role, role: nextRole },
         {
            onSuccess: () =>
               toast.success(
                  t('users.toast.roleUpdated', {
                     name: getUserFullName(user),
                  }),
               ),
            onError: (error) => {
               const message =
                  error instanceof AxiosError
                     ? error.response?.data?.message
                     : undefined;
               toast.error(message ?? t('users.toast.roleFailed'));
               setRole(user.role);
            },
         },
      );
   };

   const handleStatusConfirm = () => {
      toggleStatus(
         { id: user.id, isActive: !user.isActive },
         {
            onSuccess: () =>
               {
                  toast.success(
                     t(
                        user.isActive
                           ? 'users.toast.deactivated'
                           : 'users.toast.activated',
                        { name: getUserFullName(user) },
                     ),
                  );
                  setStatusDialogOpen(false);
               },
            onError: (error) => {
               const message =
                  error instanceof AxiosError
                     ? error.response?.data?.message
                     : undefined;
               toast.error(message ?? t('users.toast.statusFailed'));
            },
         },
      );
   };

   return (
      <>
         <DropdownMenu>
            <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
            <DropdownMenuContent align={align} className="w-52">
               <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
               <DropdownMenuSeparator />

               {onViewDetails && (
                  <DropdownMenuItem onClick={() => onViewDetails(user)}>
                     <Eye className="size-4" />
                     {t('visitActions.view')}
                  </DropdownMenuItem>
               )}

               <DropdownMenuItem
                  onSelect={(e) => {
                     e.preventDefault();
                     setEditOpen(true);
                  }}
               >
                  <Pencil className="size-4" />
                  {t('common.edit')}
               </DropdownMenuItem>

               <DropdownMenuItem
                  onSelect={(e) => {
                     e.preventDefault();
                     setResetDialogOpen(true);
                  }}
               >
                  <KeyRound className="size-4" />
                  {t('users.actions.resetPassword')}
               </DropdownMenuItem>

               <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                     <Shield className="size-4" />
                     {t('users.actions.changeRole')}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                     <DropdownMenuSubContent>
                        <DropdownMenuGroup>
                           <DropdownMenuLabel className="text-muted-foreground">
                              {t('users.actions.roles')}
                           </DropdownMenuLabel>
                           <DropdownMenuRadioGroup
                              value={role}
                              onValueChange={(value) =>
                                 !isChangingRole &&
                                 handleRoleChange(value as UserRole)
                              }
                           >
                              <DropdownMenuRadioItem value="GUARD">
                                 {t('role.guard')}
                              </DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="RECEPTION">
                                 {t('role.reception')}
                              </DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="ADMIN">
                                 {t('role.admin')}
                              </DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="MANAGER">
                                 {t('role.manager')}
                              </DropdownMenuRadioItem>
                           </DropdownMenuRadioGroup>
                        </DropdownMenuGroup>
                     </DropdownMenuSubContent>
                  </DropdownMenuPortal>
               </DropdownMenuSub>

               <DropdownMenuSeparator />

               <DropdownMenuItem
                  variant={user.isActive ? 'destructive' : 'default'}
                  onSelect={(e) => {
                     e.preventDefault();
                     setStatusDialogOpen(true);
                  }}
               >
                  {user.isActive ? (
                     <UserX className="size-4" />
                  ) : (
                     <UserCheck className="size-4" />
                  )}
                  {t(
                     user.isActive
                        ? 'users.actions.deactivate'
                        : 'users.actions.activate',
                  )}
               </DropdownMenuItem>
            </DropdownMenuContent>
         </DropdownMenu>

         <EditUser open={editOpen} onOpenChange={setEditOpen} user={user} />

         <ResetPasswordDialog
            open={resetDialogOpen}
            onOpenChange={setResetDialogOpen}
            onConfirm={handleResetConfirm}
            isPending={isResetting}
         />

         <ToggleStatusDialog
            open={statusDialogOpen}
            onOpenChange={setStatusDialogOpen}
            isActive={user.isActive}
            userName={getUserFullName(user)}
            onConfirm={handleStatusConfirm}
            isPending={isTogglingStatus}
         />
      </>
   );
}
