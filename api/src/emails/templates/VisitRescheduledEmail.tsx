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

export function VisitRescheduledEmail({
   visitorName,
   details,
}: {
   visitorName: string;
   details: VisitEmailDetails;
}) {
   return (
      <EmailLayout preview={`Visit ${details.visitCode} has been rescheduled`}>
         <StatusBadge status="RESCHEDULED" />
         <EmailHeading>Your visit was rescheduled</EmailHeading>
         <EmailParagraph>
            Hi {visitorName}, your visit schedule or location has been updated.
            Please review the new details below.
         </EmailParagraph>
         <VisitDetailsCard details={details} />
         <EmailParagraph>
            Keep visit code {details.visitCode} ready for check-in on the updated
            date.
         </EmailParagraph>
      </EmailLayout>
   );
}
