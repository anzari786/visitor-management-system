import type { Metadata } from 'next';
import { Geist, Geist_Mono, Noto_Sans_Ethiopic } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/components/providers/query-provider';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from '@/components/ui/sonner';
import { I18nProvider } from '@/lib/i18n';
import { getServerLocale } from '@/lib/i18n/server';

const geistSans = Geist({
   variable: '--font-geist-sans',
   subsets: ['latin'],
});

const geistMono = Geist_Mono({
   variable: '--font-geist-mono',
   subsets: ['latin'],
});

// Ge'ez script coverage for the Amharic and Tigrinya UI (see globals.css,
// where html[lang='am'|'ti'] puts this in front of the sans stack).
const notoSansEthiopic = Noto_Sans_Ethiopic({
   variable: '--font-ethiopic',
   subsets: ['ethiopic'],
   display: 'swap',
});

export const metadata: Metadata = {
   title: 'ATI - Visitor management system',
   icons: {
      icon: '/logo.png',
      shortcut: '/logo.png',
      apple: '/logo.png',
   },
};

export default async function RootLayout({
   children,
}: Readonly<{
   children: React.ReactNode;
}>) {
   // Read on the server so the first paint is already in the chosen language.
   const locale = await getServerLocale();

   return (
      <html lang={locale} suppressHydrationWarning>
         <body
            className={`${geistSans.variable} ${geistMono.variable} ${notoSansEthiopic.variable} antialiased`}
         >
            <I18nProvider initialLocale={locale}>
               <QueryProvider>
                  {children}
                  <ReactQueryDevtools initialIsOpen={false} />
               </QueryProvider>
               <Toaster />
            </I18nProvider>
         </body>
      </html>
   );
}
