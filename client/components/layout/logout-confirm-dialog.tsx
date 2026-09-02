'use client';

import {
   Dialog,
   DialogClose,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

type LogoutConfirmDialogProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onConfirm: () => void;
   isPending?: boolean;
};

export function LogoutConfirmDialog({
   open,
   onOpenChange,
   onConfirm,
   isPending = false,
}: LogoutConfirmDialogProps) {
   const { t } = useTranslation();

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent
            showCloseButton={false}
            className="sm:max-w-sm data-[state=open]:slide-in-from-bottom-8 data-[state=closed]:slide-out-to-bottom-8 data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100 duration-300"
         >
            <div className="flex flex-col items-center gap-4 text-center">
               <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <LogOut size={20} />
               </div>

               <DialogHeader className="items-center sm:text-center">
                  <DialogTitle>{t('logout.title')}</DialogTitle>
                  <DialogDescription>
                     {t('logout.description')}
                  </DialogDescription>
               </DialogHeader>

               <div className="flex w-full gap-2">
                  <DialogClose asChild>
                     <Button
                        type="button"
                        variant="outline"
                        className="flex-1 cursor-pointer"
                        disabled={isPending}
                     >
                        {t('common.cancel')}
                     </Button>
                  </DialogClose>
                  <Button
                     type="button"
                     variant="destructive"
                     className="flex-1 cursor-pointer"
                     disabled={isPending}
                     onClick={onConfirm}
                  >
                     {isPending ? t('logout.pending') : t('header.logout')}
                  </Button>
               </div>
            </div>
         </DialogContent>
      </Dialog>
   );
}
