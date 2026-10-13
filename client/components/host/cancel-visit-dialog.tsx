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
import { useTranslation } from '@/lib/i18n';

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
   const { t } = useTranslation();
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
               <DialogTitle>{t('host.cancel.title')}</DialogTitle>
               <p className="text-sm text-muted-foreground">
                  {visit
                     ? t('host.cancel.body', {
                          name: visit.visitorName,
                          date:
                             visit.isMultiDay && visit.endDate
                                ? `${visit.startDate} – ${visit.endDate}`
                                : visit.startDate,
                       })
                     : t('host.cancel.bodyFallback')}
               </p>
            </DialogHeader>

            <div className="w-full space-y-2">
               <Label htmlFor="cancel-visit-reason">
                  {t('host.cancel.reason')}{' '}
                  <span className="font-normal text-muted-foreground">
                     {t('host.cancel.optional')}
                  </span>
               </Label>
               <Textarea
                  id="cancel-visit-reason"
                  placeholder={t('host.cancel.reasonPlaceholder')}
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
                     {t('host.cancel.keep')}
                  </Button>
               </DialogClose>
               <Button
                  type="button"
                  variant="destructive"
                  className="flex-1 cursor-pointer"
                  disabled={isSubmitting}
                  onClick={handleConfirm}
               >
                  {isSubmitting
                     ? t('host.cancel.pending')
                     : t('host.cancel.confirm')}
               </Button>
            </div>
         </DialogContent>
      </Dialog>
   );
}
