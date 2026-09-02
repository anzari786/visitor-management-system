'use client';

import Image from 'next/image';
import Link from 'next/link';
import LanguageDropdown from '@/components/shared/language-dropdown';
import { useTranslation } from '@/lib/i18n';

type PortalHeaderProps = {
   homeHref?: string;
   languageDropdownId?: string;
};

/**
 * Shared sticky header for public-facing portals (Self Service, Host Portal).
 */
export function PortalHeader({
   homeHref = '/',
   languageDropdownId = 'language-dropdown-trigger',
}: PortalHeaderProps) {
   const { t } = useTranslation();

   return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/80">
         <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-3 sm:px-6">
            <Link href={homeHref} className="flex items-center gap-3">
               <div className="rounded-xl border bg-card p-1">
                  <Image
                     src="/logo.png"
                     alt={t('nav.logoAlt')}
                     width={40}
                     height={40}
                     priority
                     className="h-9 w-9 object-contain"
                  />
               </div>

               <div className="leading-tight">
                  <h1 className="text-sm font-semibold tracking-tight sm:text-base">
                     {t('nav.brandSubtitle')}
                  </h1>

                  <p className="text-xs text-muted-foreground">
                     {t('portal.orgName')}
                  </p>
               </div>
            </Link>

            <LanguageDropdown id={languageDropdownId} />
         </div>
      </header>
   );
}
