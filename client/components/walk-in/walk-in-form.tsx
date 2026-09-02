'use client';

import VisitRequestForm from '@/components/shared/visit-request/visit-request-form';
import { toSubmitVisitRequestPayload } from '@/services/visit-request.service';
import { useSubmitWalkInVisit } from '@/hooks/use-visit-request';

const WalkInForm = () => {
   const submitWalkInVisit = useSubmitWalkInVisit();

   return (
      <VisitRequestForm
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
};

export default WalkInForm;
