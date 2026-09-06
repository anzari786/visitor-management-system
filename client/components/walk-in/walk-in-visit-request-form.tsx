'use client';

import VisitRequestForm from '@/components/shared/visit-request/visit-request-form';
import { useSubmitWalkInVisit } from '@/hooks/use-visit-request';
import { toSubmitVisitRequestPayload } from '@/services/visit-request.service';

export function WalkInVisitRequestForm() {
   const submitWalkInVisit = useSubmitWalkInVisit();

   return (
      <VisitRequestForm
         className="max-w-none space-y-6 rounded-none border-0 bg-transparent p-0 shadow-none md:p-0"
         submitAction={async (values) =>
            submitWalkInVisit.mutateAsync(toSubmitVisitRequestPayload(values))
         }
         isSubmitting={submitWalkInVisit.isPending}
         submitLabel="Register Visitor"
         successTitle="Walk-In Visitor Registered"
         successDescription="The visitor has been registered successfully and is ready for reception processing."
         doneLabel="Close"
      />
   );
}