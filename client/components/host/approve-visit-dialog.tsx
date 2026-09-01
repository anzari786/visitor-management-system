'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import {
   emptyVisitLocationValues,
   visitLocationSchema,
   type VisitLocationInput,
   type VisitLocationValues,
} from '@/lib/validations/visit-location.schema';
import { VisitLocationFields } from '@/components/shared/visit-location-fields';
import { Button } from '@/components/ui/button';
import {
   Dialog,
   DialogClose,
   DialogContent,
   DialogHeader,
   DialogTitle,
} from '@/components/ui/dialog';
import { useTranslation } from '@/lib/i18n';

export type ApproveVisitRequest = {
   id: string;
   visitorName: string;
   meetingType: string;
   orgName?: string;
};

type ApproveVisitDialogProps = {
   request: ApproveVisitRequest | null;
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onApproved?: (values: VisitLocationValues & { requestId: string }) => void;
};

export function ApproveVisitDialog({
   request,
   open,
   onOpenChange,
   onApproved,
}: ApproveVisitDialogProps) {
   const { t } = useTranslation();
   const [isSubmitting, setIsSubmitting] = useState(false);

   const form = useForm<VisitLocationInput, unknown, VisitLocationValues>({
      resolver: zodResolver(visitLocationSchema),
      defaultValues: emptyVisitLocationValues,
      mode: 'onSubmit',
      reValidateMode: 'onChange',
      shouldFocusError: true,
   });

   useEffect(() => {
      if (open) {
         form.reset(emptyVisitLocationValues);
      }
   }, [open, form, request?.id]);

   const handleOpenChange = (nextOpen: boolean) => {
      if (!nextOpen) {
         form.reset(emptyVisitLocationValues);
      }
      onOpenChange(nextOpen);
   };

   const onSubmit = form.handleSubmit(async (values) => {
      if (!request) return;

      setIsSubmitting(true);
      try {
         onApproved?.({
            requestId: request.id,
            floor: values.floor,
            room: values.room,
         });

         toast.success(t('host.approve.toast', { name: request.visitorName }));
         handleOpenChange(false);
      } catch (error) {
         const message =
            error instanceof Error
               ? error.message
               : t('host.approve.error');
         toast.error(message);
      } finally {
         setIsSubmitting(false);
      }
   });

   return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
         <DialogContent
            showCloseButton={!isSubmitting}
            aria-describedby={undefined}
            className="duration-300 data-open:slide-in-from-left-8 data-closed:slide-out-to-left-8 data-open:zoom-in-100 data-closed:zoom-out-100 sm:max-w-md [[data-slot=dialog-overlay]:has(~_&)]:duration-300"
         >
            {request && (
               <>
                  <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                     <MapPin size={18} />
                  </div>
                  <DialogHeader>
                     <DialogTitle>{t('host.approve.title')}</DialogTitle>
                     <p className="text-sm text-muted-foreground">
                        {t('host.approve.body', {
                           name: request.visitorName,
                        })}
                     </p>
                  </DialogHeader>

                  <form
                     onSubmit={onSubmit}
                     noValidate
                     className="flex flex-col gap-5"
                  >
                     <VisitLocationFields
                        key={request.id}
                        form={form}
                        idPrefix={`approve-${request.id}`}
                        showDescription={false}
                     />

                     <div className="flex w-full gap-3">
                        <DialogClose asChild>
                           <Button
                              type="button"
                              variant="outline"
                              className="flex-1 cursor-pointer"
                              disabled={isSubmitting}
                           >
                              {t('common.cancel')}
                           </Button>
                        </DialogClose>
                        <Button
                           type="submit"
                           className="flex-1 cursor-pointer gap-2 hover:bg-primary/90"
                           disabled={isSubmitting}
                        >
                           {isSubmitting ? (
                              <>
                                 <Loader2 className="size-4 animate-spin" />
                                 {t('host.approve.pending')}
                              </>
                           ) : (
                              <>
                                 <Check className="size-4" />
                                 {t('host.approve.submit')}
                              </>
                           )}
                        </Button>
                     </div>
                  </form>
               </>
            )}
         </DialogContent>
      </Dialog>
   );
}
