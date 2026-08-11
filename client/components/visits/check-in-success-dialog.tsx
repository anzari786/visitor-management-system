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

type CheckInSuccessDialogProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   visitorLabel: string;
   visitId: string;
};

export function CheckInSuccessDialog({
   open,
   onOpenChange,
   visitorLabel,
   visitId,
}: CheckInSuccessDialogProps) {
   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent
            className="duration-300 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:max-w-sm"
            showCloseButton={false}
         >
            <div className="flex flex-col items-center gap-4 py-2 text-center">
               <div className="flex size-16 items-center justify-center rounded-full bg-sky-400/10 text-sky-500">
                  <CheckCircle2Icon size={32} strokeWidth={1.5} />
               </div>
               <DialogHeader className="items-center space-y-2">
                  <DialogTitle className="text-lg">
                     Check-In Successful
                  </DialogTitle>
                  <DialogDescription className="text-sm leading-relaxed">
                     {visitorLabel} has been successfully checked in for visit{' '}
                     <span className="font-mono text-foreground">
                        {visitId}
                     </span>
                     .
                  </DialogDescription>
               </DialogHeader>
               <DialogClose asChild>
                  <Button
                     type="button"
                     className="w-full cursor-pointer hover:bg-primary/90"
                  >
                     Done
                  </Button>
               </DialogClose>
            </div>
         </DialogContent>
      </Dialog>
   );
}
