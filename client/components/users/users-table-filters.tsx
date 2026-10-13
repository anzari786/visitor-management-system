'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';
import { USER_ROLE_KEYS, useTranslation } from '@/lib/i18n';
import { useDebounce } from '@/hooks/use-debounce';
import type { UserRole, UserStatusFilter } from '@/types/user.types';
import type { TranslationKey } from '@/lib/i18n';
import { Search, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';

export const statusFilterKeys = {
   active: 'status.active',
   inactive: 'status.inactive',
} as const satisfies Record<UserStatusFilter, TranslationKey>;

export const roleFilterKeys = USER_ROLE_KEYS;

export function UsersTableFilters() {
   const { t } = useTranslation();
   const router = useRouter();
   const pathname = usePathname();
   const searchParams = useSearchParams();

   const search = searchParams.get('search') ?? '';
   const statusFilter =
      (searchParams.get('status') as UserStatusFilter | 'all') || 'all';
   const roleFilter = (searchParams.get('role') as UserRole | 'all') || 'all';

   const [searchInput, setSearchInput] = React.useState(search);
   const debouncedSearch = useDebounce(searchInput, 300);
   const lastPushedSearch = React.useRef(search);

   const updateParams = React.useCallback(
      (updates: Record<string, string | number | null | undefined>) => {
         const params = new URLSearchParams(searchParams.toString());

         Object.entries(updates).forEach(([key, value]) => {
            if (
               value === null ||
               value === undefined ||
               value === '' ||
               value === 'all'
            ) {
               params.delete(key);
            } else {
               params.set(key, String(value));
            }
         });

         router.push(`${pathname}?${params.toString()}`, { scroll: false });
      },
      [pathname, router, searchParams],
   );

   React.useEffect(() => {
      if (search !== lastPushedSearch.current) {
         setSearchInput(search);
         lastPushedSearch.current = search;
      }
   }, [search]);

   React.useEffect(() => {
      if (debouncedSearch === search) return;
      lastPushedSearch.current = debouncedSearch;
      updateParams({ search: debouncedSearch, page: 1 });
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [debouncedSearch]);

   const hasActiveFilters =
      Boolean(search) || statusFilter !== 'all' || roleFilter !== 'all';

   const clearAllFilters = () => {
      setSearchInput('');
      updateParams({
         search: null,
         status: null,
         role: null,
         page: 1,
      });
   };

   return (
      <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
         <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative w-full sm:max-w-xs">
               <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
               <Input
                  placeholder={t('users.filters.searchPlaceholder')}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="h-9 bg-background pl-8"
               />
            </div>

            <Select
               value={roleFilter}
               onValueChange={(value) =>
                  updateParams({ role: value, page: 1 })
               }
            >
               <SelectTrigger className="h-9 w-full bg-background sm:w-[160px]">
                  <SelectValue placeholder={t('users.col.role')} />
               </SelectTrigger>
               <SelectContent>
                  <SelectItem value="all">
                     {t('users.filters.allRoles')}
                  </SelectItem>
                  {(Object.keys(roleFilterKeys) as UserRole[]).map((role) => (
                     <SelectItem key={role} value={role}>
                        {t(roleFilterKeys[role])}
                     </SelectItem>
                  ))}
               </SelectContent>
            </Select>

            <Select
               value={statusFilter}
               onValueChange={(value) =>
                  updateParams({ status: value, page: 1 })
               }
            >
               <SelectTrigger className="h-9 w-full bg-background sm:w-[150px]">
                  <SelectValue placeholder={t('common.status')} />
               </SelectTrigger>
               <SelectContent>
                  <SelectItem value="all">
                     {t('users.filters.allStatuses')}
                  </SelectItem>
                  {(Object.keys(statusFilterKeys) as UserStatusFilter[]).map(
                     (status) => (
                        <SelectItem key={status} value={status}>
                           {t(statusFilterKeys[status])}
                        </SelectItem>
                     ),
                  )}
               </SelectContent>
            </Select>

            {hasActiveFilters && (
               <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 gap-1.5 self-start text-muted-foreground"
                  onClick={clearAllFilters}
               >
                  <X className="size-3.5" />
                  {t('common.clear')}
               </Button>
            )}
         </div>
      </div>
   );
}
