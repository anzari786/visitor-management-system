import { redirect } from 'next/navigation';
import { ThemeProvider } from '@/components/theme-provider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import { EditProfileDialog } from '@/components/profile/edit-profile-dialog';
import { TooltipProvider } from '@/components/ui/tooltip';
import { getServerUser } from '@/lib/auth-server';
import type { CSSProperties } from 'react';

export default async function RootLayout({
   children,
}: Readonly<{
   children: React.ReactNode;
}>) {
   const user = await getServerUser();

   if (!user) {
      redirect('/login');
   }

   return (
      <div>
         <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
         >
            <SidebarProvider
               className="h-svh overflow-hidden bg-muted p-4"
               style={{ '--sidebar-width': '320px' } as CSSProperties}
            >
               <AppSidebar />
               <div className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-background border shadow-sm">
                  <Header />
                  <main className="flex-1 min-h-0 overflow-auto">
                     <TooltipProvider>{children}</TooltipProvider>
                  </main>
               </div>
               <EditProfileDialog />
            </SidebarProvider>
         </ThemeProvider>
      </div>
   );
}
