'use client';

import type { ReactNode } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useTranslation } from '@/lib/i18n';

type WelcomeSectionProps = {
   subtitle: ReactNode;
   actionButton?: ReactNode;
};

export function WelcomeSection({
   subtitle,
   actionButton,
}: WelcomeSectionProps) {
   const { t } = useTranslation();
   const user = useAuthStore((state) => state.user);
   const displayName = user?.firstName ?? t('dashboard.welcomeGuest');

   return (
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6">
         <div className="space-y-2 sm:space-y-5">
            <h2 className="text-lg sm:text-[22px] font-semibold leading-relaxed">
               {t('dashboard.welcomeBack', { name: displayName })}
            </h2>
            <div className="text-sm sm:text-base text-muted-foreground">
               {subtitle}
            </div>
         </div>

         {actionButton ? (
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
               {actionButton}
            </div>
         ) : null}
      </div>
   );
}
