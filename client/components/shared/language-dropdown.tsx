'use client';

import { useState } from 'react';
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuRadioGroup,
   DropdownMenuRadioItem,
   DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import Image from 'next/image';

type Props = {
   id?: string;
   className?: string;
   defaultOpen?: boolean;
   align?: 'start' | 'center' | 'end';
};

type Language = {
   value: string;
   label: string;
   icon: string;
};

const LANGUAGES: Language[] = [
   {
      value: 'english',
      label: 'English (UK)',
      icon: 'https://images.shadcnspace.com/assets/flags/flag-us.svg',
   },
   {
      value: 'chinese',
      label: '中国人 (Chinese)',
      icon: 'https://images.shadcnspace.com/assets/flags/flag-china.svg',
   },
   {
      value: 'french',
      label: 'français (French)',
      icon: 'https://images.shadcnspace.com/assets/flags/flag-france.svg',
   },
   {
      value: 'arabic',
      label: 'عربي (Arabic)',
      icon: 'https://images.shadcnspace.com/assets/flags/flag-australia.svg',
   },
];

const itemClass =
   'cursor-pointer gap-2 pl-2 text-sm data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground [&>span]:hidden';

const LanguageDropdown = ({
   id,
   className,
   defaultOpen,
   align = 'end',
}: Props) => {
   const [language, setLanguage] = useState(LANGUAGES[0].value);

   const selectedLanguage =
      LANGUAGES.find((lang) => lang.value === language) ?? LANGUAGES[0];

   return (
      <DropdownMenu defaultOpen={defaultOpen}>
         <DropdownMenuTrigger asChild>
            <div
               id={id}
               className={cn(
                  'rounded-md hover:bg-accent/80 cursor-pointer p-2',
                  className,
               )}
            >
               <Image
                  src={selectedLanguage.icon}
                  alt={selectedLanguage.label}
                  width={19}
                  height={19}
                  className="rounded-md"
               />
            </div>
         </DropdownMenuTrigger>

         <DropdownMenuContent className="w-50" align={align}>
            <DropdownMenuRadioGroup
               value={language}
               onValueChange={setLanguage}
               className="flex flex-col gap-2"
            >
               {LANGUAGES.map(({ value, label, icon }) => (
                  <DropdownMenuRadioItem
                     key={value}
                     value={value}
                     className={itemClass}
                  >
                     <Image
                        src={icon}
                        alt={label}
                        width={16}
                        height={16}
                        className="rounded-full"
                     />
                     {label}
                  </DropdownMenuRadioItem>
               ))}
            </DropdownMenuRadioGroup>
         </DropdownMenuContent>
      </DropdownMenu>
   );
};

export default LanguageDropdown;
