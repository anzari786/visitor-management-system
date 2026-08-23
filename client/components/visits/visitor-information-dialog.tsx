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
import {
   emptyInvitationVisitorValues,
   hostInvitationSchema,
   type HostInvitationFormInput,
   type HostInvitationFormValues,
} from '@/lib/validations/host-invitation.schema';
import type { VisitorFormValues } from '@/lib/validations/visit-request.schema';
import type { ManagedVisit } from '@/types/visit.types';
import { zodResolver } from '@hookform/resolvers/zod';
import * as React from 'react';
import { useForm } from 'react-hook-form';

interface VisitorInformationDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   visit: ManagedVisit | null;
   onComplete: (visitors: VisitorFormValues[]) => void;
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
            organization: visitor.organization || '',
         };
      }) || [{ ...emptyInvitationVisitorValues }]
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
}: VisitorInformationDialogProps) {
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

   const handleSubmit = form.handleSubmit((data) => {
      const visitors = data.visitors.map((visitor, index) => {
         const existingVisitor = visit?.visitors[index];

         return {
            ...visitor,
            idType: existingVisitor?.idType as VisitorFormValues['idType'],
            idNumber: existingVisitor?.idNumber || '',
            organization: visitor.organization,
         };
      });

      onComplete(visitors);
   }, onInvalid);

   return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
         <DialogContent
            aria-describedby={undefined}
            className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
         >
            <DialogHeader className="shrink-0 space-y-1.5 border-b px-6 py-5 text-left">
               <DialogTitle>Complete Visitor Information</DialogTitle>
            </DialogHeader>

            <form
               onSubmit={handleSubmit}
               noValidate
               className="flex min-h-0 flex-1 flex-col"
            >
               <div className="flex-1 space-y-8 overflow-y-auto px-6 py-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  <InvitationVisitorsFields
                     form={form}
                     heading="Visitor Information"
                     description="Review the available visitor information and complete any missing details before check-in."
                  />
               </div>

               <DialogFooter className="shrink-0 gap-2 border-t px-6 py-4 sm:justify-end">
                  <Button
                     type="button"
                     variant="outline"
                     className="cursor-pointer"
                     onClick={() => handleOpenChange(false)}
                  >
                     Cancel
                  </Button>

                  <Button type="submit" className="cursor-pointer gap-2">
                     Continue to Check In
                  </Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>
   );
}
