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

export function VisitCancelledEmail({
   visitorName,
   details,
}: {
   visitorName: string;
   details: VisitEmailDetails;
}) {
   return (
      <EmailLayout preview={`Visit ${details.visitCode} has been cancelled`}>
         <StatusBadge status="CANCELLED" />
         <EmailHeading>Visit cancelled</EmailHeading>
         <EmailParagraph>
            Hi {visitorName}, your visit has been cancelled. If you still need to
            visit, please submit a new request or contact your host.
         </EmailParagraph>
         <VisitDetailsCard details={details} />
      </EmailLayout>
   );
}
