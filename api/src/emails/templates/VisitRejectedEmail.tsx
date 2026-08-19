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

export function VisitRejectedEmail({
   visitorName,
   details,
}: {
   visitorName: string;
   details: VisitEmailDetails;
}) {
   return (
      <EmailLayout preview={`Visit ${details.visitCode} was not approved`}>
         <StatusBadge status="REJECTED" />
         <EmailHeading>Visit request declined</EmailHeading>
         <EmailParagraph>
            Hi {visitorName}, unfortunately your visit request was not approved.
            If you believe this is a mistake, please contact your host.
         </EmailParagraph>
         <VisitDetailsCard details={details} />
      </EmailLayout>
   );
}
