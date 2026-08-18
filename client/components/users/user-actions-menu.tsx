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
import { USER_ROLE_CONFIG, USER_ROLES } from '@/constants/user';
import { getUserFullName } from '@/lib/user';
import type { User, UserRole } from '@/types/user.types';
import {
   Eye,
   KeyRound,
   Pencil,
   Shield,
   UserCheck,
   UserX,
} from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { EditUser } from './edit-user';
import { ResetPasswordDialog } from './reset-password-dialog';
import { TempPasswordDialog } from './temp-password-dialog';
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
   const [tempPasswordDialogOpen, setTempPasswordDialogOpen] =
      React.useState(false);
   const [statusDialogOpen, setStatusDialogOpen] = React.useState(false);

   const { mutate: resetPassword, isPending: isResetting } = useResetPassword();
   const { mutate: changeRole } = useChangeRole();
   const { mutate: toggleStatus, isPending: isTogglingStatus } =
      useToggleUserStatus();

   const handleResetConfirm = () => {
      resetPassword(user.id, {
         onSuccess: ({ tempPassword: nextPassword }) => {
            setTempPassword(nextPassword);
            setResetDialogOpen(false);
            setTempPasswordDialogOpen(true);
         },
         onError: () => {
            toast.error('Failed to reset password. Please try again.');
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
                              {USER_ROLES.map((item) => (
                                 <DropdownMenuRadioItem key={item} value={item}>
                                    {USER_ROLE_CONFIG[item].label}
                                 </DropdownMenuRadioItem>
                              ))}
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

         <TempPasswordDialog
            open={tempPasswordDialogOpen}
            onOpenChange={setTempPasswordDialogOpen}
            tempPassword={tempPassword}
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
