'use client';

import { Button } from '@/components/ui/button';
import {
   Dialog,
   DialogClose,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
} from '@/components/ui/dialog';
import { KeyRound, Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

type ResetPasswordDialogProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onConfirm: () => void;
   isPending?: boolean;
};

export function ResetPasswordDialog({
   open,
   onOpenChange,
   onConfirm,
   isPending,
}: ResetPasswordDialogProps) {
   const { t } = useTranslation();

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent
            className="data-open:slide-in-from-bottom-8 data-closed:slide-out-to-bottom-8 data-open:zoom-in-100 data-closed:zoom-out-100 duration-300 [[data-slot=dialog-overlay]:has(~_&)]:duration-300 sm:max-w-[400px]"
            showCloseButton={false}
         >
            <div className="flex flex-col items-center gap-4 text-center">
               <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <KeyRound size={20} />
               </div>
               <DialogHeader className="items-center">
                  <DialogTitle>{t('users.reset.title')}</DialogTitle>
                  <DialogDescription>
                     {t('users.reset.description')}
                  </DialogDescription>
               </DialogHeader>
               <div className="flex w-full gap-2">
                  <DialogClose asChild>
                     <Button
                        variant="outline"
                        className="flex-1 cursor-pointer"
                        disabled={isPending}
                     >
                        {t('common.cancel')}
                     </Button>
                  </DialogClose>
                  <Button
                     className="flex-1 cursor-pointer"
                     onClick={onConfirm}
                     disabled={isPending}
                  >
                     {isPending ? (
                        <>
                           <Loader2 className="mr-2 size-4 animate-spin" />
                           {t('users.reset.pending')}
                        </>
                     ) : (
                        t('users.actions.resetPassword')
                     )}
                  </Button>
               </div>
            </div>
         </DialogContent>
      </Dialog>
   );
}
