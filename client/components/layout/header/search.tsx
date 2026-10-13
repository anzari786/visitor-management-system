'use client';

import { useEffect, useState } from 'react';
import { SearchIcon } from 'lucide-react';
import { Kbd } from '@/components/ui/kbd';
import { useTranslation } from '@/lib/i18n';

type SearchProps = {
   onOpen: () => void;
};

export default function Search({ onOpen }: SearchProps) {
   const { t } = useTranslation();
   const [modKey, setModKey] = useState('⌘');

   useEffect(() => {
      const isMac =
         /Mac|iPhone|iPad|iPod/.test(navigator.platform) ||
         navigator.userAgent.includes('Mac');
      setModKey(isMac ? '⌘' : 'Ctrl');
   }, []);

   return (
      <button
         type="button"
         onClick={onOpen}
         aria-label={t('common.search')}
         className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-accent sm:w-auto sm:min-w-56 sm:justify-start sm:gap-2 sm:rounded-md sm:border sm:border-border sm:px-3 sm:py-1.5 sm:hover:bg-transparent cursor-pointer"
      >
         <SearchIcon size={16} className="text-muted-foreground shrink-0" />
         <span className="hidden text-sm font-normal text-muted-foreground sm:block sm:flex-1 sm:text-left">
            {t('header.searchPlaceholder')}
         </span>
         <span className="hidden sm:inline-flex items-center gap-1 shrink-0">
            <Kbd>{modKey}</Kbd>
            <Kbd>K</Kbd>
         </span>
      </button>
   );
}
