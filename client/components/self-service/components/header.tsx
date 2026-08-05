'use client';

import LanguageDropdown from '@/components/shared/language-dropdown';
import Image from 'next/image';
import Link from 'next/link';

const Header = () => {
   return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 shadow-sm">
         <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-3 sm:px-6">
            <Link href="#" className="flex items-center gap-3">
               <div className="rounded-xl border bg-card p-1">
                  <Image
                     src="/logo.jpeg"
                     alt="Ethiopian Agricultural Transformation Institute logo"
                     width={40}
                     height={40}
                     priority
                     className="h-9 w-9 object-contain"
                  />
               </div>

               <div className="leading-tight">
                  <h1 className="text-sm font-semibold tracking-tight sm:text-base">
                     Visitor Management System
                  </h1>

                  <p className="text-xs text-muted-foreground">
                     Ethiopian Agricultural Transformation Institute
                  </p>
               </div>
            </Link>

            <LanguageDropdown id="language-dropdown-trigger" />
         </div>
      </header>
   );
};

export default Header;
