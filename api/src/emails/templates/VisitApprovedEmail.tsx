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

export function VisitApprovedEmail({
   visitorName,
   details,
}: {
   visitorName: string;
   details: VisitEmailDetails;
}) {
   return (
      <EmailLayout preview={`Visit ${details.visitCode} has been approved`}>
         <StatusBadge status="APPROVED" />
         <EmailHeading>Your visit is approved</EmailHeading>
         <EmailParagraph>
            Hi {visitorName}, your visit request has been approved. Please bring
            a valid ID and keep your visit code ready when you arrive at reception.
         </EmailParagraph>
         <VisitDetailsCard details={details} />
         <EmailParagraph>
            Present visit code {details.visitCode} (or your QR code) at reception
            for check-in.
         </EmailParagraph>
      </EmailLayout>
   );
}
