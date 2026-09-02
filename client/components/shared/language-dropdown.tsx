'use client';

import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuLabel,
   DropdownMenuRadioGroup,
   DropdownMenuRadioItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { LOCALES, LOCALE_META, useTranslation, type Locale } from '@/lib/i18n';
import { Globe } from 'lucide-react';

type Props = {
   id?: string;
   className?: string;
   defaultOpen?: boolean;
   align?: 'start' | 'center' | 'end';
};

const itemClass =
   'cursor-pointer gap-2 pl-2 text-sm data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground [&>span]:hidden';

const LanguageDropdown = ({
   id,
   className,
   defaultOpen,
   align = 'end',
}: Props) => {
   const { locale, setLocale, t } = useTranslation();

   return (
      <DropdownMenu defaultOpen={defaultOpen}>
         <DropdownMenuTrigger asChild>
            <button
               id={id}
               type="button"
               aria-label={t('header.language')}
               className={cn(
                  'flex cursor-pointer items-center gap-1.5 rounded-full p-2 hover:bg-accent/80',
                  className,
               )}
            >
               <Globe size={16} />
               <span className="text-xs font-semibold uppercase">{locale}</span>
            </button>
         </DropdownMenuTrigger>

         <DropdownMenuContent className="w-52" align={align}>
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
               {t('header.language')}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuRadioGroup
               value={locale}
               onValueChange={(value) => setLocale(value as Locale)}
               className="flex flex-col gap-1"
            >
               {LOCALES.map((value) => (
                  <DropdownMenuRadioItem
                     key={value}
                     value={value}
                     className={itemClass}
                  >
                     <span className="flex size-6 shrink-0 items-center justify-center rounded-full border bg-muted text-[10px] font-semibold uppercase">
                        {value}
                     </span>
                     <span className="flex min-w-0 flex-col leading-tight">
                        <span className="truncate">
                           {LOCALE_META[value].label}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                           {LOCALE_META[value].englishLabel}
                        </span>
                     </span>
                  </DropdownMenuRadioItem>
               ))}
            </DropdownMenuRadioGroup>
         </DropdownMenuContent>
      </DropdownMenu>
   );
};

export default LanguageDropdown;
