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

export function VisitorArrivedHostEmail({
   hostName,
   arrivedVisitors,
   details,
}: {
   hostName: string;
   arrivedVisitors: Array<{ name: string; email?: string | null }>;
   details: VisitEmailDetails;
}) {
   const names = arrivedVisitors.map((v) => v.name).join(', ');
   const heading =
      arrivedVisitors.length > 1
         ? 'Visitors have arrived'
         : 'Your visitor has arrived';

   return (
      <EmailLayout preview={`${names} checked in for visit ${details.visitCode}`}>
         <StatusBadge status="ARRIVED" />
         <EmailHeading>{heading}</EmailHeading>
         <EmailParagraph>
            Hi {hostName}, {names}{' '}
            {arrivedVisitors.length > 1 ? 'have' : 'has'} checked in at reception
            for visit {details.visitCode}.
         </EmailParagraph>
         <VisitDetailsCard
            details={{
               ...details,
               visitors: arrivedVisitors,
            }}
         />
      </EmailLayout>
   );
}
