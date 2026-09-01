'use client';

import { CheckCircle2Icon } from 'lucide-react';
import {
   Dialog,
   DialogClose,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { SubmitVisitRequestResponse } from '@/types/self-service.types';
import { useTranslation } from '@/lib/i18n';

type VisitRequestSuccessDialogProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onDone: () => void;
   visit: SubmitVisitRequestResponse | null;
   title?: string;
   description?: string;
   doneLabel?: string;
};

export function RequestVisitSuccessDialog({
   open,
   onOpenChange,
   onDone,
   visit,
   title,
   description,
   doneLabel,
}: VisitRequestSuccessDialogProps) {
   const { t } = useTranslation();

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent
            className="sm:max-w-md duration-300"
            showCloseButton={false}
         >
            <div className="flex flex-col items-center gap-4 py-2 text-center">
               <div className="flex size-16 items-center justify-center rounded-full bg-teal-400/10 text-teal-500">
                  <CheckCircle2Icon size={32} strokeWidth={1.5} />
               </div>
               <DialogHeader className="items-center space-y-2">
                  <DialogTitle className="text-lg">
                     {title ?? t('selfService.success.title')}
                  </DialogTitle>
                  <DialogDescription className="text-sm leading-relaxed">
                     {description ?? t('selfService.success.description')}
                  </DialogDescription>
               </DialogHeader>
               {visit && (
                  <div className="w-full rounded-lg bg-muted/50 px-4 py-3 text-sm">
                     <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">
                           {t('selfService.success.visitCode')}
                        </span>
                        <span className="font-semibold">{visit.visitCode}</span>
                     </div>
                  </div>
               )}
               <DialogClose asChild>
                  <Button
                     type="button"
                     className="w-full cursor-pointer hover:bg-primary/90"
                     onClick={onDone}
                  >
                     {doneLabel ?? t('common.done')}
                  </Button>
               </DialogClose>
            </div>
         </DialogContent>
      </Dialog>
   );
}
