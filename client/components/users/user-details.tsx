'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
   Sheet,
   SheetClose,
   SheetContent,
   SheetDescription,
   SheetFooter,
   SheetHeader,
   SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { USER_ROLE_CONFIG } from '@/constants/user';
import {
   useResetPassword,
   useToggleUserStatus,
   useUser,
} from '@/hooks/use-users';
import { formatLastLogin } from '@/lib/format-last-login';
import { getUserFullName } from '@/lib/user';
import { cn } from '@/lib/utils';
import type { User } from '@/types/user.types';
import { format } from 'date-fns';
import {
   CalendarDays,
   Clock3,
   Hash,
   KeyRound,
   Pencil,
   Phone,
   Shield,
   ShieldCheck,
   User as UserIcon,
   UserCheck,
   UserX,
   XIcon,
   type LucideIcon,
} from 'lucide-react';

import * as React from 'react';
import { toast } from 'sonner';
import { EditUser } from './edit-user';
import { ResetPasswordDialog } from './reset-password-dialog';
import { ToggleStatusDialog } from './toggle-status-dialog';
import { UserStatusBadge } from './user-status-badge';

type UserDetailsSheetProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   userId: number | null;
};

function DetailRow({
   icon: Icon,
   label,
   value,
}: {
   icon: LucideIcon;
   label: string;
   value: React.ReactNode;
}) {
   if (value === null || value === undefined || value === '') return null;

   return (
      <div className="flex items-start justify-between gap-4">
         <div className="flex items-center gap-2.5 text-muted-foreground">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
               <Icon className="size-4" />
            </div>
            <span className="text-sm">{label}</span>
         </div>
         <div className="max-w-[60%] text-right text-sm font-medium text-foreground">
            {value}
         </div>
      </div>
   );
}

function UserDetailsSkeleton() {
   return (
      <div className="flex flex-col gap-6 p-5 sm:p-6">
         <div className="space-y-4">
            <Skeleton className="h-3 w-32 rounded" />
            <div className="space-y-3.5">
               {Array.from({ length: 6 }).map((_, i) => (
                  <div
                     key={i}
                     className="flex items-center justify-between gap-4"
                  >
                     <div className="flex items-center gap-2.5">
                        <Skeleton className="size-8 rounded-lg" />
                        <Skeleton className="h-4 w-16 rounded" />
                     </div>
                     <Skeleton className="h-4 w-24 rounded" />
                  </div>
               ))}
            </div>
         </div>
         <Separator />
         <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
         </div>
      </div>
   );
}

function UserDetailsBody({ user }: { user: User }) {
   const role = USER_ROLE_CONFIG[user.role];
   const RoleIcon = role.icon;
   const isSso = !!user.employee;
   const TypeIcon = isSso ? ShieldCheck : KeyRound;

   return (
      <div className="flex flex-col gap-6 p-5 sm:p-6">
         <section className="space-y-4">
            <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
               Account information
            </h3>
            <div className="space-y-3.5">
               <DetailRow
                  icon={UserIcon}
                  label="Name"
                  value={getUserFullName(user)}
               />
               <DetailRow
                  icon={Hash}
                  label="Username"
                  value={
                     <span className="font-mono text-xs">{user.username}</span>
                  }
               />
               <DetailRow
                  icon={Phone}
                  label="Phone"
                  value={user.phone || '—'}
               />
               <DetailRow
                  icon={Shield}
                  label="Role"
                  value={
                     <Badge
                        variant="secondary"
                        className={cn(
                           'h-6 gap-1.5 rounded-md px-2 font-medium',
                           role.color,
                        )}
                     >
                        <RoleIcon className="size-3" />
                        {role.label}
                     </Badge>
                  }
               />
               <DetailRow
                  icon={isSso ? ShieldCheck : KeyRound}
                  label="Account Type"
                  value={
                     <Badge
                        variant="outline"
                        className={cn(
                           'h-6 gap-1.5 rounded-md px-2 font-medium',
                           isSso
                              ? 'bg-primary/5 text-primary border-primary/20'
                              : 'bg-muted/30 text-muted-foreground border-border',
                        )}
                     >
                        <TypeIcon className="size-3" />
                        {isSso ? 'SSO' : 'Local'}
                     </Badge>
                  }
               />
               <DetailRow
                  icon={user.isActive ? UserCheck : UserX}
                  label="Status"
                  value={<UserStatusBadge isActive={user.isActive} />}
               />
               <DetailRow
                  icon={Clock3}
                  label="Last activity"
                  value={formatLastLogin(user.lastLoginAt)}
               />
               <DetailRow
                  icon={CalendarDays}
                  label="Created"
                  value={format(new Date(user.createdAt), 'MMM d, yyyy')}
               />
            </div>
         </section>

         <Separator />

         <section className="space-y-3">
            <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
               Activity
            </h3>
            <div className="grid grid-cols-2 gap-3">
               <div className="rounded-xl border bg-muted/40 p-3 text-center">
                  <p className="text-lg font-semibold tabular-nums text-foreground">
                     {user.checkIns}
                  </p>
                  <p className="text-xs text-muted-foreground">Check-ins</p>
               </div>
               <div className="rounded-xl border bg-muted/40 p-3 text-center">
                  <p className="text-lg font-semibold tabular-nums text-foreground">
                     {user.checkOuts}
                  </p>
                  <p className="text-xs text-muted-foreground">Check-outs</p>
               </div>
            </div>
         </section>
      </div>
   );
}

export function UserDetailsSheet({
   open,
   onOpenChange,
   userId,
}: UserDetailsSheetProps) {
   const { data: user, isLoading, isError } = useUser(userId);

   const [editOpen, setEditOpen] = React.useState(false);
   const [resetDialogOpen, setResetDialogOpen] = React.useState(false);
   const [tempPassword, setTempPassword] = React.useState<string | null>(null);
   const [statusDialogOpen, setStatusDialogOpen] = React.useState(false);

   const { mutate: resetPassword, isPending: isResetting } = useResetPassword();
   const { mutate: toggleStatus, isPending: isTogglingStatus } =
      useToggleUserStatus();

   const handleResetConfirm = () => {
      if (!user) return;
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

   const handleStatusConfirm = () => {
      if (!user) return;
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

   const role = user ? USER_ROLE_CONFIG[user.role] : null;

   return (
      <>
         <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
               showCloseButton={false}
               className={cn(
                  'inset-y-4 right-4 flex h-[calc(100%-2rem)] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-2xl border p-0 shadow-2xl sm:max-w-md',
               )}
            >
               <SheetHeader className="flex-row items-start justify-between gap-3 space-y-0 border-b p-5 sm:p-6">
                  <div className="min-w-0 space-y-2">
                     <div className="flex flex-wrap items-center gap-2">
                        <SheetTitle className="text-base font-semibold tracking-tight">
                           {isLoading
                              ? 'Loading…'
                              : user
                                ? getUserFullName(user)
                                : 'User'}
                        </SheetTitle>
                        {user && <UserStatusBadge isActive={user.isActive} />}
                     </div>
                     <SheetDescription className="text-sm text-muted-foreground">
                        {user
                           ? `${user.username}${role ? ` · ${role.label}` : ''}`
                           : 'Account details'}
                     </SheetDescription>
                  </div>
                  <SheetClose asChild>
                     <Button
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0"
                     >
                        <XIcon className="size-5" />
                        <span className="sr-only">Close</span>
                     </Button>
                  </SheetClose>
               </SheetHeader>

               <ScrollArea className="min-h-0 flex-1">
                  {isLoading ? (
                     <UserDetailsSkeleton />
                  ) : isError || !user ? (
                     <div className="p-5 text-center text-sm text-destructive sm:p-6">
                        Failed to load user details. Please try again.
                     </div>
                  ) : (
                     <UserDetailsBody user={user} />
                  )}
               </ScrollArea>

               {user && (
                  <SheetFooter className="border-t p-5 sm:flex-row sm:flex-wrap sm:p-6">
                     <Button
                        variant="outline"
                        className="h-11 flex-1 gap-2"
                        onClick={() => setEditOpen(true)}
                     >
                        <Pencil className="size-4" />
                        Edit
                     </Button>
                     <Button
                        variant="outline"
                        className="h-11 flex-1 gap-2"
                        onClick={() => setResetDialogOpen(true)}
                     >
                        <KeyRound className="size-4" />
                        Reset Password
                     </Button>
                     <Button
                        variant={user.isActive ? 'destructive' : 'default'}
                        className="h-11 flex-1 gap-2"
                        onClick={() => setStatusDialogOpen(true)}
                     >
                        {user.isActive ? (
                           <UserX className="size-4" />
                        ) : (
                           <UserCheck className="size-4" />
                        )}
                        {user.isActive ? 'Deactivate' : 'Activate'}
                     </Button>
                  </SheetFooter>
               )}
            </SheetContent>
         </Sheet>

         {user && (
            <>
               <EditUser
                  open={editOpen}
                  onOpenChange={setEditOpen}
                  user={user}
               />

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
         )}
      </>
   );
}

export default UserDetailsSheet;
