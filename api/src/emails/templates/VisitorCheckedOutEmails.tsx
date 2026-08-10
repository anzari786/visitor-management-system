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

export function VisitorCheckedOutHostEmail({
   hostName,
   checkedOutVisitors,
   details,
}: {
   hostName: string;
   checkedOutVisitors: Array<{ name: string; email?: string | null }>;
   details: VisitEmailDetails;
}) {
   const names = checkedOutVisitors.map((v) => v.name).join(', ');

   return (
      <EmailLayout
         preview={`${names} checked out from visit ${details.visitCode}`}
      >
         <StatusBadge status="CHECKED_OUT" />
         <EmailHeading>
            {checkedOutVisitors.length > 1
               ? 'Visitors checked out'
               : 'Visitor checked out'}
         </EmailHeading>
         <EmailParagraph>
            Hi {hostName}, {names}{' '}
            {checkedOutVisitors.length > 1 ? 'have' : 'has'} checked out from
            visit {details.visitCode}.
         </EmailParagraph>
         <VisitDetailsCard
            details={{
               ...details,
               visitors: checkedOutVisitors,
            }}
         />
      </EmailLayout>
   );
}

export function VisitorCheckedOutVisitorEmail({
   visitorName,
   details,
}: {
   visitorName: string;
   details: VisitEmailDetails;
}) {
   return (
      <EmailLayout preview={`Checkout confirmed for visit ${details.visitCode}`}>
         <StatusBadge status="CHECKED_OUT" />
         <EmailHeading>Checkout confirmed</EmailHeading>
         <EmailParagraph>
            Hi {visitorName}, thank you for visiting. Your checkout for visit{' '}
            {details.visitCode} has been recorded successfully.
         </EmailParagraph>
         <VisitDetailsCard details={details} />
         <EmailParagraph>We look forward to seeing you again.</EmailParagraph>
      </EmailLayout>
   );
}
