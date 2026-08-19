import * as React from 'react';
import { EmailLayout } from '../components/EmailLayout.js';
import {
   EmailHeading,
   EmailParagraph,
   PrimaryButton,
   StatusBadge,
} from '../components/EmailElements.js';
import {
   VisitDetailsCard,
   type VisitEmailDetails,
} from '../components/VisitDetailsCard.js';

export function VisitApprovalRequestHostEmail({
   hostName,
   details,
   reviewUrl,
}: {
   hostName: string;
   details: VisitEmailDetails;
   reviewUrl: string;
}) {
   const visitorLabel =
      (details.visitors?.length ?? 0) > 1
         ? `${details.visitors!.length} visitors are`
         : 'A visitor is';

   return (
      <EmailLayout preview="A visit request needs your approval">
         <StatusBadge status="PENDING" />
         <EmailHeading>Visit approval required</EmailHeading>
         <EmailParagraph>
            Hi {hostName}, {visitorLabel} requesting to visit you and need your
            approval before arrival.
         </EmailParagraph>
         <VisitDetailsCard details={details} />
         <PrimaryButton href={reviewUrl}>Review request</PrimaryButton>
         <EmailParagraph>
            Please approve, reject, or reschedule this visit from the host portal.
         </EmailParagraph>
      </EmailLayout>
   );
}
