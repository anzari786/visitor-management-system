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
import { TriangleAlert } from 'lucide-react';

type MarkLostDialogProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   badgeNumber: string;
   onConfirm: () => void;
   isPending?: boolean;
};

export function MarkLostDialog({
   open,
   onOpenChange,
   badgeNumber,
   onConfirm,
   isPending,
}: MarkLostDialogProps) {
   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent
            showCloseButton={false}
            className="sm:max-w-sm data-[state=open]:slide-in-from-top-8 data-[state=closed]:slide-out-to-top-8 data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100 duration-300"
         >
            <div className="flex flex-col items-center gap-4 text-center">
               <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <TriangleAlert size={20} />
               </div>

               <DialogHeader className="items-center sm:text-center">
                  <DialogTitle>Mark badge as lost?</DialogTitle>
                  <DialogDescription>
                     {badgeNumber} will no longer be issued to visitors.
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
                        Cancel
                     </Button>
                  </DialogClose>
                  <Button
                     type="button"
                     variant="default"
                     className="flex-1 cursor-pointer"
                     disabled={isPending}
                     onClick={onConfirm}
                  >
                     {isPending ? 'Updating…' : 'Mark as Lost'}
                  </Button>
               </div>
            </div>
         </DialogContent>
      </Dialog>
   );
}
