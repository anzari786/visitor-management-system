import { Skeleton } from '@/components/ui/skeleton';
import {
   Sidebar,
   SidebarContent,
   SidebarFooter,
   SidebarGroup,
   SidebarGroupLabel,
   SidebarHeader,
   SidebarMenu,
   SidebarMenuItem,
} from '@/components/ui/sidebar';
import Image from 'next/image';
import type * as React from 'react';

export function AppSidebarSkeleton({
   ...props
}: React.ComponentProps<typeof Sidebar>) {
   return (
      <Sidebar
         variant="floating"
         collapsible="offcanvas"
         className="p-4 h-full [&_[data-slot=sidebar-inner]]:h-full"
         {...props}
      >
         <div className="flex h-full flex-col gap-4 overflow-hidden">
            <SidebarHeader className="px-2 pt-3 pb-1">
               <div className="flex items-center gap-3 px-2.5 py-3">
                  <div className="flex aspect-square size-11 items-center justify-center rounded-xl border bg-card p-1 shrink-0">
                     <Image
                        src="/logo.jpeg"
                        alt="Ethiopian Agricultural Transformation Institute logo"
                        width={44}
                        height={44}
                        className="size-full object-contain"
                     />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                     <Skeleton className="h-5 w-12" />
                     <Skeleton className="h-4 w-full max-w-[13.5rem]" />
                  </div>
               </div>
            </SidebarHeader>

            <SidebarContent className="overflow-hidden px-2">
               <div className="space-y-4">
                  <SidebarGroup className="p-0">
                     <SidebarGroupLabel className="p-0">
                        <Skeleton className="h-3 w-20" />
                     </SidebarGroupLabel>
                     <SidebarMenu>
                        {Array.from({ length: 4 }).map((_, i) => (
                           <SidebarMenuItem key={`workspace-skel-${i}`}>
                              <div className="flex items-center gap-2 h-9 px-3">
                                 <Skeleton className="size-4 rounded-sm shrink-0" />
                                 <Skeleton className="h-3.5 w-24" />
                              </div>
                           </SidebarMenuItem>
                        ))}
                     </SidebarMenu>
                  </SidebarGroup>

                  <SidebarGroup className="p-0">
                     <SidebarGroupLabel className="p-0">
                        <Skeleton className="h-3 w-28" />
                     </SidebarGroupLabel>
                     <SidebarMenu>
                        {Array.from({ length: 3 }).map((_, i) => (
                           <SidebarMenuItem key={`admin-skel-${i}`}>
                              <div className="flex items-center gap-2 h-9 px-3">
                                 <Skeleton className="size-4 rounded-sm shrink-0" />
                                 <Skeleton className="h-3.5 w-28" />
                              </div>
                           </SidebarMenuItem>
                        ))}
                     </SidebarMenu>
                  </SidebarGroup>
               </div>
            </SidebarContent>

            <SidebarFooter className="px-2 pb-2">
               <div className="flex items-center gap-2 px-2 py-2">
                  <Skeleton className="size-8 rounded-full shrink-0" />
                  <div className="flex-1 min-w-0 space-y-1.5">
                     <Skeleton className="h-3.5 w-24" />
                     <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="size-4 shrink-0" />
               </div>
            </SidebarFooter>
         </div>
      </Sidebar>
   );
}
