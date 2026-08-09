'use client';

import { useEffect, useState } from 'react';
import { Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
   Dialog,
   DialogClose,
   DialogContent,
   DialogHeader,
   DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { HostVisitCardData } from './host-visit-card';

type CancelVisitDialogProps = {
   visit: HostVisitCardData | null;
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onConfirm: (reason: string) => void | Promise<void>;
};

export function CancelVisitDialog({
   visit,
   open,
   onOpenChange,
   onConfirm,
}: CancelVisitDialogProps) {
   const [reason, setReason] = useState('');
   const [isSubmitting, setIsSubmitting] = useState(false);

   useEffect(() => {
      if (open) {
         setReason('');
         setIsSubmitting(false);
      }
   }, [open, visit?.id]);

   const handleConfirm = async () => {
      if (!visit) return;
      setIsSubmitting(true);
      try {
         await onConfirm(reason.trim());
         onOpenChange(false);
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent
            aria-describedby={undefined}
            className="duration-300 data-open:slide-in-from-left-8 data-closed:slide-out-to-left-8 data-open:zoom-in-100 data-closed:zoom-out-100 sm:max-w-md [[data-slot=dialog-overlay]:has(~_&)]:duration-300"
         >
            <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
               <Ban size={18} />
            </div>
            <DialogHeader>
               <DialogTitle>Cancel this visit?</DialogTitle>
               <p className="text-sm text-muted-foreground">
                  {visit ? (
                     <>
                        Cancel{' '}
                        <span className="font-medium text-foreground">
                           {visit.visitorName}
                        </span>
                        &apos;s visit on{' '}
                        {visit.isMultiDay && visit.endDate
                           ? `${visit.startDate} – ${visit.endDate}`
                           : visit.startDate}
                        .
                     </>
                  ) : (
                     'This visit will be cancelled.'
                  )}
               </p>
            </DialogHeader>

            <div className="w-full space-y-2">
               <Label htmlFor="cancel-visit-reason">
                  Reason{' '}
                  <span className="font-normal text-muted-foreground">
                     (optional)
                  </span>
               </Label>
               <Textarea
                  id="cancel-visit-reason"
                  placeholder="Add a short reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={isSubmitting}
                  className="min-h-20 resize-none"
               />
            </div>

            <div className="flex gap-2">
               <DialogClose asChild>
                  <Button
                     type="button"
                     variant="outline"
                     className="flex-1 cursor-pointer"
                     disabled={isSubmitting}
                  >
                     Keep Visit
                  </Button>
               </DialogClose>
               <Button
                  type="button"
                  variant="destructive"
                  className="flex-1 cursor-pointer"
                  disabled={isSubmitting}
                  onClick={handleConfirm}
               >
                  {isSubmitting ? 'Cancelling...' : 'Cancel Visit'}
               </Button>
            </div>
         </DialogContent>
      </Dialog>
   );
}
