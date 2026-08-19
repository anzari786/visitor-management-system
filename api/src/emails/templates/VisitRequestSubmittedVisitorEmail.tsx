import * as React from 'react';
import { EmailLayout } from '../components/EmailLayout.js';
import {
   EmailHeading,
   EmailParagraph,
   StatusBadge,
} from '../components/EmailElements.js';
import {
   VisitDetailsCard,
   type VisitEmailDetails,
} from '../components/VisitDetailsCard.js';

export function VisitRequestSubmittedVisitorEmail({
   visitorName,
   details,
}: {
   visitorName: string;
   details: VisitEmailDetails;
}) {
   return (
      <EmailLayout preview="Your visit request was submitted successfully">
         <StatusBadge status="PENDING" />
         <EmailHeading>Visit request received</EmailHeading>
         <EmailParagraph>
            Hi {visitorName}, your visit request has been submitted successfully.
            The host has been notified and will review it shortly.
         </EmailParagraph>
         <VisitDetailsCard details={details} />
         <EmailParagraph>
            You will receive another email once your visit is approved, rejected,
            or rescheduled.
         </EmailParagraph>
      </EmailLayout>
   );
}
