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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Ban } from 'lucide-react';
import * as React from 'react';

type DeactivateBadgeDialogProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   badgeNumber: string;
   onConfirm: (reason: string) => void;
   isPending?: boolean;
};

export function DeactivateBadgeDialog({
   open,
   onOpenChange,
   badgeNumber,
   onConfirm,
   isPending,
}: DeactivateBadgeDialogProps) {
   const [reason, setReason] = React.useState('');

   React.useEffect(() => {
      if (open) setReason('');
   }, [open]);

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent
            showCloseButton={false}
            className="sm:max-w-sm data-[state=open]:slide-in-from-top-8 data-[state=closed]:slide-out-to-top-8 data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100 duration-300"
         >
            <div className="flex flex-col items-center gap-4 text-center">
               <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <Ban size={20} />
               </div>

               <DialogHeader className="items-center sm:text-center">
                  <DialogTitle>Deactivate badge?</DialogTitle>
                  <DialogDescription>
                     {badgeNumber} will be unavailable until reactivated.
                  </DialogDescription>
               </DialogHeader>

               <div className="w-full space-y-2 text-left">
                  <Label htmlFor="deactivate-reason">Reason</Label>
                  <Textarea
                     id="deactivate-reason"
                     placeholder="Why is this badge being deactivated?"
                     value={reason}
                     onChange={(e) => setReason(e.target.value)}
                     disabled={isPending}
                     className="min-h-20"
                  />
                  <p className="text-muted-foreground text-end text-xs">
                     Optional, but recommended for audit records.
                  </p>
               </div>

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
                     variant="destructive"
                     className="flex-1 cursor-pointer"
                     disabled={isPending}
                     onClick={() => onConfirm(reason.trim())}
                  >
                     {isPending ? 'Deactivating…' : 'Deactivate'}
                  </Button>
               </div>
            </div>
         </DialogContent>
      </Dialog>
   );
}
