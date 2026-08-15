import * as React from 'react';
import { EmailLayout } from '../components/EmailLayout.js';
import {
   EmailHeading,
   EmailParagraph,
   PrimaryButton,
   InfoRow,
} from '../components/EmailElements.js';

export function PasswordSetupInvitationEmail({
   firstName,
   username,
   setupUrl,
   expiresInHours,
}: {
   firstName: string;
   username: string;
   setupUrl: string;
   expiresInHours: number;
}) {
   return (
      <EmailLayout preview="Create your ATI VMS password">
         <EmailHeading>Set up your password</EmailHeading>
         <EmailParagraph>
            Hi {firstName}, an administrator created a local account for you on
            ATI VMS. Use the button below to create your password and sign in.
         </EmailParagraph>
         <InfoRow label="Username" value={username} />
         <PrimaryButton href={setupUrl}>Create password</PrimaryButton>
         <EmailParagraph>
            This link expires in {expiresInHours} hours and can only be used once.
            If you did not expect this email, you can ignore it.
         </EmailParagraph>
      </EmailLayout>
   );
}
