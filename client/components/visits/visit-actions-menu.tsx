'use client';

import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
   canCancel,
   canCheckIn,
   canCheckOut,
   isGroupVisit,
} from '@/lib/visit-attendance';
import { sendPendingApprovalReminderEmail } from '@/services/visit-notification.service';
import type { ManagedVisit } from '@/types/visit.types';
import { Eye, Loader2, LogIn, LogOut, Mail, XCircle } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { CheckOutConfirmDialog } from './check-out-confirm-dialog';
import { CheckOutSuccessDialog } from './check-out-success-dialog';

interface VisitActionsMenuProps {
   visit: ManagedVisit;
   trigger: React.ReactNode;
   align?: 'start' | 'end';
   onView?: (visit: ManagedVisit) => void;
   onCheckIn?: (visit: ManagedVisit) => void;
   onCheckOut?: (visit: ManagedVisit) => void;
   onCancel?: (visit: ManagedVisit) => void;
   onOpenAttendance?: (
      visit: ManagedVisit,
      mode: 'check_in' | 'check_out',
   ) => void;
}

export function VisitActionsMenu({
   visit,
   trigger,
   align = 'end',
   onView,
   onCheckIn,
   onCheckOut,
   onCancel,
   onOpenAttendance,
}: VisitActionsMenuProps) {
   const [checkOutOpen, setCheckOutOpen] = React.useState(false);
   const [successOpen, setSuccessOpen] = React.useState(false);
   const [cancelOpen, setCancelOpen] = React.useState(false);
   const [isResending, setIsResending] = React.useState(false);

   const group = isGroupVisit(visit);
   const showCheckIn = canCheckIn(visit);
   const showCheckOut = canCheckOut(visit);
   const showCancel = canCancel(visit.status);
   const showResendApproval = visit.status === 'requested';

   const requestCheckIn = () => {
      onCheckIn?.(visit);
   };

   const requestCheckOut = () => {
      if (group) {
         onOpenAttendance?.(visit, 'check_out');
         return;
      }
      setCheckOutOpen(true);
   };

   const handleCheckOutConfirm = () => {
      onCheckOut?.(visit);
      setSuccessOpen(true);
   };

   const handleCancel = () => {
      onCancel?.(visit);
      toast.success(`Visit ${visit.id} cancelled`);
      setCancelOpen(false);
   };

   const handleResendApprovalEmail = async () => {
      if (isResending) return;
      setIsResending(true);
      try {
         await sendPendingApprovalReminderEmail({
            visitorName: visit.visitorName,
            visitSummary: `${visit.id} · ${visit.meetingType}`,
         });
         toast.success('Approval email resent', {
            description: `Reminder sent for ${visit.visitorName}'s visit request.`,
         });
      } catch {
         toast.error('Could not resend email', {
            description: 'Please try again in a moment.',
         });
      } finally {
         setIsResending(false);
      }
   };

   const primaryVisitor =
      visit.visitors.find((v) => v.name === visit.visitorName) ??
      visit.visitors[0];

   return (
      <>
         <DropdownMenu>
            <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
            <DropdownMenuContent align={align} className="w-52">
               <DropdownMenuLabel>Actions</DropdownMenuLabel>
               <DropdownMenuSeparator />

               <DropdownMenuItem onClick={() => onView?.(visit)}>
                  <Eye className="size-4" />
                  View
               </DropdownMenuItem>

               {showCheckIn && (
                  <DropdownMenuItem onClick={requestCheckIn}>
                     <LogIn className="size-4" />
                     Check In
                  </DropdownMenuItem>
               )}

               {showResendApproval && (
                  <DropdownMenuItem
                     disabled={isResending}
                     onSelect={(event) => {
                        event.preventDefault();
                        void handleResendApprovalEmail();
                     }}
                  >
                     {isResending ? (
                        <Loader2 className="size-4 animate-spin" />
                     ) : (
                        <Mail className="size-4" />
                     )}
                     {isResending ? 'Sending…' : 'Resend Approval Email'}
                  </DropdownMenuItem>
               )}

               {showCheckOut && (
                  <DropdownMenuItem onClick={requestCheckOut}>
                     <LogOut className="size-4" />
                     Check Out
                  </DropdownMenuItem>
               )}

               {showCancel && (
                  <>
                     <DropdownMenuSeparator />
                     <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setCancelOpen(true)}
                     >
                        <XCircle className="size-4" />
                        Cancel
                     </DropdownMenuItem>
                  </>
               )}
            </DropdownMenuContent>
         </DropdownMenu>

         <CheckOutConfirmDialog
            open={checkOutOpen}
            onOpenChange={setCheckOutOpen}
            visit={visit}
            visitors={primaryVisitor ? [primaryVisitor] : []}
            onConfirm={handleCheckOutConfirm}
         />

         <CheckOutSuccessDialog
            open={successOpen}
            onOpenChange={setSuccessOpen}
            visitorLabel={visit.visitorName}
            visitId={visit.id}
         />

         <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
            <AlertDialogContent>
               <AlertDialogHeader>
                  <AlertDialogTitle>Cancel visit</AlertDialogTitle>
                  <AlertDialogDescription>
                     Cancel visit{' '}
                     <span className="font-mono text-foreground">
                        {visit.id}
                     </span>{' '}
                     for{' '}
                     <span className="font-semibold text-foreground">
                        {visit.visitorName}
                     </span>
                     ? This cannot be undone.
                  </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                  <AlertDialogCancel>Go back</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancel}>
                     Cancel visit
                  </AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>
      </>
   );
}
