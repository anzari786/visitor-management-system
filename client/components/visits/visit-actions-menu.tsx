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
import {
   Eye,
   Loader2,
   LogIn,
   LogOut,
   Mail,
   XCircle,
   XIcon,
} from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { CheckOutConfirmDialog } from './check-out-confirm-dialog';
import { CheckOutSuccessDialog } from './check-out-success-dialog';
import {
   Dialog,
   DialogClose,
   DialogContent,
   DialogHeader,
   DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { useTranslation } from '@/lib/i18n';

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
   const { t } = useTranslation();
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
      toast.success(t('visitActions.toast.cancelled', { id: visit.id }));
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
         toast.success(t('visitActions.toast.emailResent'), {
            description: t('visitActions.toast.emailResentBody', {
               name: visit.visitorName,
            }),
         });
      } catch {
         toast.error(t('visitActions.toast.emailFailed'), {
            description: t('visitActions.toast.tryAgain'),
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
               <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
               <DropdownMenuSeparator />

               <DropdownMenuItem onClick={() => onView?.(visit)}>
                  <Eye className="size-4" />
                  {t('visitActions.view')}
               </DropdownMenuItem>

               {showCheckIn && (
                  <DropdownMenuItem onClick={requestCheckIn}>
                     <LogIn className="size-4" />
                     {t('visitActions.checkIn')}
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
                     {isResending
                        ? t('visitActions.sending')
                        : t('visitActions.resendEmail')}
                  </DropdownMenuItem>
               )}

               {showCheckOut && (
                  <DropdownMenuItem onClick={requestCheckOut}>
                     <LogOut className="size-4" />
                     {t('visitActions.checkOut')}
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
                        {t('common.cancel')}
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

         <Dialog
            open={cancelOpen}
            onOpenChange={(open) => !open && setCancelOpen(false)}
         >
            <DialogContent
               showCloseButton={false}
               aria-describedby={undefined}
               className="duration-300 data-open:slide-in-from-left-8 data-closed:slide-out-to-left-8 data-open:zoom-in-100 data-closed:zoom-out-100 sm:max-w-md [[data-slot=dialog-overlay]:has(~_&)]:duration-300"
            >
               <div className="flex flex-col items-center gap-4 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                     <XIcon size={20} />
                  </div>

                  <DialogHeader className="items-center">
                     <DialogTitle>{t('visitActions.cancelVisit')}</DialogTitle>
                     <p className="text-sm text-muted-foreground">
                        {t('visitActions.cancelConfirm', {
                           id: visit.id,
                           name: visit.visitorName,
                        })}
                     </p>
                  </DialogHeader>

                  <div className="flex w-full gap-3">
                     <DialogClose asChild>
                        <Button
                           variant="outline"
                           size="sm"
                           className="flex-1 cursor-pointer"
                        >
                           {t('visitActions.goBack')}
                        </Button>
                     </DialogClose>

                     <DialogClose asChild>
                        <Button
                           variant="destructive"
                           size="sm"
                           className="flex-1 cursor-pointer"
                           onClick={handleCancel}
                        >
                           {t('visitActions.cancelVisit')}
                        </Button>
                     </DialogClose>
                  </div>
               </div>
            </DialogContent>
         </Dialog>
      </>
   );
}
