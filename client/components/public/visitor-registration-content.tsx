'use client';

import { useTranslation } from '@/lib/i18n';

export function VisitorRegistrationContent() {
   const { t } = useTranslation();

   return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
         <h1 className="text-xl font-semibold">{t('publicReg.stubTitle')}</h1>
         <p className="mt-2 text-muted-foreground">{t('publicReg.stubBody')}</p>
      </div>
   );
}
