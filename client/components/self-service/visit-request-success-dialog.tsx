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

type VisitRequestSuccessDialogProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onDone: () => void;
};

export function VisitRequestSuccessDialog({
   open,
   onOpenChange,
   onDone,
}: VisitRequestSuccessDialogProps) {
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
                     Visit Request Submitted
                  </DialogTitle>
                  <DialogDescription className="text-sm leading-relaxed">
                     Your request was submitted successfully. A confirmation
                     email has been sent. We&apos;ll notify you when your host
                     responds.
                  </DialogDescription>
               </DialogHeader>
               <DialogClose asChild>
                  <Button
                     type="button"
                     className="w-full cursor-pointer hover:bg-primary/90"
                     onClick={onDone}
                  >
                     Done
                  </Button>
               </DialogClose>
            </div>
         </DialogContent>
      </Dialog>
   );
}
