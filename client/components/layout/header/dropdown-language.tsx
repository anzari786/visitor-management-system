'use client';

import { type ReactElement } from 'react';
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuRadioGroup,
   DropdownMenuRadioItem,
   DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LOCALES, LOCALE_META, useTranslation, type Locale } from '@/lib/i18n';

type Props = {
   trigger: ReactElement;
   defaultOpen?: boolean;
   align?: 'start' | 'center' | 'end';
};

const itemClass =
   'cursor-pointer gap-2 pl-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground [&>span:first-child]:hidden';

export default function LanguageDropdown({
   trigger,
   defaultOpen,
   align = 'end',
}: Props) {
   const { locale, setLocale, t } = useTranslation();

   return (
      <DropdownMenu defaultOpen={defaultOpen}>
         <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>

         <DropdownMenuContent
            className="w-50 max-w-[calc(100vw-1rem)] border-border bg-popover text-popover-foreground"
            align={align}
         >
            <DropdownMenuRadioGroup
               value={locale}
               onValueChange={(value) => setLocale(value as Locale)}
               className="flex flex-col gap-2"
            >
               {LOCALES.map((value) => (
                  <DropdownMenuRadioItem
                     key={value}
                     value={value}
                     className={itemClass}
                  >
                     <div className="min-w-0 truncate">
                        {`${LOCALE_META[value].label} (${LOCALE_META[value].englishLabel})`}
                     </div>
                  </DropdownMenuRadioItem>
               ))}
            </DropdownMenuRadioGroup>
         </DropdownMenuContent>
      </DropdownMenu>
   );
}
