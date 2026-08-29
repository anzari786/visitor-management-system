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
import { Eye, KeyRound, Pencil, Shield, UserCheck, UserX } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { EditUser } from './edit-user';
import { ResetPasswordDialog } from './reset-password-dialog';
import { ToggleStatusDialog } from './toggle-status-dialog';

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
   const [role, setRole] = useSyncedRole(user);

   const [editOpen, setEditOpen] = React.useState(false);
   const [resetDialogOpen, setResetDialogOpen] = React.useState(false);
   const [tempPassword, setTempPassword] = React.useState<string | null>(null);
   const [statusDialogOpen, setStatusDialogOpen] = React.useState(false);

   const { mutate: resetPassword, isPending: isResetting } = useResetPassword();
   const { mutate: changeRole } = useChangeRole();
   const { mutate: toggleStatus, isPending: isTogglingStatus } =
      useToggleUserStatus();

   const handleResetConfirm = () => {
      resetPassword(user.id, {
         onSuccess: () => {
            toast.success(
               `Password reset email sent to ${getUserFullName(user)}`,
            );
            setResetDialogOpen(false);
         },
         onError: () => {
            toast.error('Failed to send reset email. Please try again.');
            setResetDialogOpen(false);
         },
      });
   };

   const handleRoleChange = (nextRole: UserRole) => {
      setRole(nextRole);
      changeRole(
         { id: user.id, role: nextRole },
         {
            onSuccess: () =>
               toast.success(`${getUserFullName(user)}'s role updated`),
            onError: () => {
               toast.error('Failed to update role. Please try again.');
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
               toast.success(
                  `${getUserFullName(user)} has been ${user.isActive ? 'deactivated' : 'activated'}`,
               ),
            onError: () =>
               toast.error('Failed to update user status. Please try again.'),
            onSettled: () => setStatusDialogOpen(false),
         },
      );
   };

   return (
      <>
         <DropdownMenu>
            <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
            <DropdownMenuContent align={align} className="w-52">
               <DropdownMenuLabel>Actions</DropdownMenuLabel>
               <DropdownMenuSeparator />

               {onViewDetails && (
                  <DropdownMenuItem onClick={() => onViewDetails(user)}>
                     <Eye className="size-4" />
                     View
                  </DropdownMenuItem>
               )}

               <DropdownMenuItem
                  onSelect={(e) => {
                     e.preventDefault();
                     setEditOpen(true);
                  }}
               >
                  <Pencil className="size-4" />
                  Edit
               </DropdownMenuItem>

               <DropdownMenuItem
                  onSelect={(e) => {
                     e.preventDefault();
                     setResetDialogOpen(true);
                  }}
               >
                  <KeyRound className="size-4" />
                  Reset Password
               </DropdownMenuItem>

               <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                     <Shield className="size-4" />
                     Change Role
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                     <DropdownMenuSubContent>
                        <DropdownMenuGroup>
                           <DropdownMenuLabel className="text-muted-foreground">
                              Roles
                           </DropdownMenuLabel>
                           <DropdownMenuRadioGroup
                              value={role}
                              onValueChange={(value) =>
                                 handleRoleChange(value as UserRole)
                              }
                           >
                              <DropdownMenuRadioItem value="GUARD">
                                 Guard
                              </DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="RECEPTION">
                                 Reception
                              </DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="ADMIN">
                                 Administrator
                              </DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="MANAGER">
                                 Manager
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
                  {user.isActive ? 'Deactivate' : 'Activate'}
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
