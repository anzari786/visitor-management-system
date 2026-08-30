'use client';

import { div } from 'motion/react-client';
import WalkInForm from './walk-in-form';

export function WalkInContent() {
   return (
      <div className="space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 lg:px-8">
         <div className="text-center">
            <h1 className="text-2xl font-semibold text-primary">
               Request Visit
            </h1>
            <p className="text-muted-foreground">
               Register a walk-in visitor and provide their visit details.
            </p>
         </div>
         <WalkInForm />
      </div>
   );
}
