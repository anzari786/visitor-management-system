'use client';

import type { ReactNode } from 'react';
import { WelcomeSection } from './welcome-section';

type ContentProps = {
   subtitle: ReactNode;
   actionButton?: ReactNode;
   children?: ReactNode;
   className?: string;
};

/**
 * Shared dashboard page shell — welcome header + padded content area.
 * Parents supply page-specific `subtitle` and optional `actionButton`.
 */
export function Content({
   subtitle,
   actionButton,
   children,
   className,
}: ContentProps) {
   return (
      <main
         className={
            className ??
            'p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 bg-background w-full'
         }
      >
         <WelcomeSection subtitle={subtitle} actionButton={actionButton} />
         {children}
      </main>
   );
}
