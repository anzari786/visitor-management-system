'use client';

import { InvitationVisitorsFields } from '@/components/common/invitation-visitors-fields';
import { Button } from '@/components/ui/button';
import {
   Dialog,
   DialogContent,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from '@/components/ui/dialog';
import { FLOOR_OPTIONS } from '@/constants/visit-location';
import { VISIT_PURPOSE_OPTIONS } from '@/constants/visit-purpose';
import { DEFAULT_NATIONALITY } from '@/constants/nationalities';
import {
   emptyInvitationVisitorValues,
   hostInvitationSchema,
   type HostInvitationFormInput,
   type HostInvitationFormValues,
} from '@/lib/validations/host-invitation.schema';
import type { VisitorFormValues } from '@/lib/validations/visit-request.schema';
import type { ManagedVisit } from '@/types/visit.types';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAfter, isToday, parseISO, startOfToday } from 'date-fns';
import { Loader2 } from 'lucide-react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';

interface VisitorInformationDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   visit: ManagedVisit | null;
   onComplete: (visitors: VisitorFormValues[]) => void;
   onRegisterComplete: (
      visitors: VisitorFormValues[],
   ) => void | Promise<void>;
}

function getVisitorValues(
   visit: ManagedVisit | null,
): HostInvitationFormInput['visitors'] {
   return (
      visit?.visitors.map((visitor) => {
         const [firstName = '', ...lastNameParts] = (visitor.name || '').split(
            ' ',
         );

         return {
            firstName,
            lastName: lastNameParts.join(' '),
            email: visitor.email || '',
            phone: visitor.phone || '+251 ',
            nationality: visitor.nationality || DEFAULT_NATIONALITY,
            organization: visitor.organization || '',
         };
      }) || [
         {
            ...emptyInvitationVisitorValues,
            nationality: DEFAULT_NATIONALITY,
         },
      ]
   );
}

function getDefaultValues(visit: ManagedVisit | null) {
   return {
      knowsVisitorInfo: 'yes' as const,
      scheduleType: 'single_day' as const,
      purpose: VISIT_PURPOSE_OPTIONS[0].value,
      visitors: getVisitorValues(visit),
      visitDate: new Date(),
      startTime: '00:00',
      endTime: '23:59',
      floor: FLOOR_OPTIONS[0],
      room: 'Check-in desk',
   };
}

export function VisitorInformationDialog({
   open,
   onOpenChange,
   visit,
   onComplete,
   onRegisterComplete,
}: VisitorInformationDialogProps) {
   const { t } = useTranslation();
   const [isSubmitting, setIsSubmitting] = React.useState(false);
   const isFutureVisit = visit
      ? isAfter(parseISO(visit.startDate), startOfToday()) &&
        !isToday(parseISO(visit.startDate))
      : false;
   const form = useForm<
      HostInvitationFormInput,
      unknown,
      HostInvitationFormValues
   >({
      resolver: zodResolver(hostInvitationSchema),
      defaultValues: getDefaultValues(visit),
      mode: 'onSubmit',
      reValidateMode: 'onChange',
      shouldFocusError: true,
   });

   React.useEffect(() => {
      if (open && visit) {
         form.reset(getDefaultValues(visit));
      }
   }, [open, visit, form]);

   const handleOpenChange = (nextOpen: boolean) => {
      if (!nextOpen) {
         form.reset(getDefaultValues(visit));
      }
      onOpenChange(nextOpen);
   };

   const onInvalid = () => {
      requestAnimationFrame(() => {
         document
            .querySelector<HTMLElement>(
               '[data-slot="dialog-content"] [aria-invalid="true"]',
            )
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
   };

   const handleSubmit = form.handleSubmit(async (data) => {
      const visitors = data.visitors.map((visitor) => ({
         ...visitor,
         organization: visitor.organization,
      }));

      setIsSubmitting(true);
      try {
         await onRegisterComplete(visitors);
         if (!isFutureVisit) onComplete(visitors);
      } catch (error) {
         toast.error(
            error instanceof Error
               ? error.message
               : t('visitorInfo.submitFailed'),
         );
      } finally {
         setIsSubmitting(false);
      }
   }, onInvalid);

   return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
         <DialogContent
            aria-describedby={undefined}
            className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
         >
            <DialogHeader className="shrink-0 space-y-1.5 border-b px-6 py-5 text-left">
               <DialogTitle>{t('visitorInfo.title')}</DialogTitle>
            </DialogHeader>

            <form
               onSubmit={handleSubmit}
               noValidate
               className="flex min-h-0 flex-1 flex-col"
            >
               <div className="flex-1 space-y-8 overflow-y-auto px-6 py-5 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  <InvitationVisitorsFields
                     form={form}
                     heading={t('visitorInfo.heading')}
                     description={t('visitorInfo.description')}
                     maxVisitors={visit?.visitorCount}
                  />
               </div>

               <DialogFooter className="shrink-0 gap-2 border-t px-6 py-4 sm:justify-end">
                  <Button
                     type="button"
                     variant="outline"
                     className="cursor-pointer"
                     disabled={isSubmitting}
                     onClick={() => handleOpenChange(false)}
                  >
                     {t('common.cancel')}
                  </Button>

                  <Button
                     type="submit"
                     className="cursor-pointer gap-2"
                     disabled={isSubmitting}
                  >
                     {isSubmitting && (
                        <Loader2 className="size-4 animate-spin" />
                     )}
                     {t(
                        isFutureVisit
                           ? 'visitorInfo.register'
                           : 'visitorInfo.continue',
                     )}
                  </Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>
   );
}
