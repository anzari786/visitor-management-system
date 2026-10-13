'use client';

import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

type HostHeroSectionProps = {
   onCreateInvitation: () => void;
};

export function HostHeroSection({ onCreateInvitation }: HostHeroSectionProps) {
   const { t } = useTranslation();

   return (
      <section className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
         <div className="min-w-0 space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
               {t('host.hero.title')}
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
               {t('host.hero.description')}
            </p>
         </div>

         <Button
            type="button"
            size="lg"
            className="w-full shrink-0 cursor-pointer gap-2 sm:w-auto"
            onClick={onCreateInvitation}
         >
            <Send className="size-4" />
            {t('host.hero.createInvitation')}
         </Button>
      </section>
   );
}
