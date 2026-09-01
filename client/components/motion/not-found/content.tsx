'use client';

import { NotFoundStacked } from './stacked';
import { useTranslation } from '@/lib/i18n';

/**
 * Client wrapper so the 404 copy follows the selected language
 * (`app/not-found.tsx` is a server component).
 */
export function NotFoundContent() {
   const { t } = useTranslation();

   return (
      <NotFoundStacked
         code="404"
         title={t('notFound.title')}
         description={t('notFound.description')}
         homeHref="/dashboard"
         homeLabel={t('notFound.action')}
      />
   );
}
