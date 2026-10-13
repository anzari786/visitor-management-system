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
import { CheckCircle2Icon } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

type CheckOutSuccessDialogProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   visitorLabel: string;
   visitId: string;
};

export function CheckOutSuccessDialog({
   open,
   onOpenChange,
   visitorLabel,
   visitId,
}: CheckOutSuccessDialogProps) {
   const { t } = useTranslation();

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent
            className="sm:max-w-sm duration-300 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
            showCloseButton={false}
         >
            <div className="flex flex-col items-center gap-4 py-2 text-center">
               <div className="flex size-16 items-center justify-center rounded-full bg-teal-400/10 text-teal-500">
                  <CheckCircle2Icon size={32} strokeWidth={1.5} />
               </div>
               <DialogHeader className="items-center space-y-2">
                  <DialogTitle className="text-lg">
                     {t('checkOutSuccess.title')}
                  </DialogTitle>
                  <DialogDescription className="text-sm leading-relaxed">
                     {t('checkOutSuccess.description', {
                        name: visitorLabel,
                        id: visitId,
                     })}
                  </DialogDescription>
               </DialogHeader>
               <DialogClose asChild>
                  <Button
                     type="button"
                     className="w-full cursor-pointer hover:bg-primary/90"
                  >
                     {t('common.done')}
                  </Button>
               </DialogClose>
            </div>
         </DialogContent>
      </Dialog>
   );
}
