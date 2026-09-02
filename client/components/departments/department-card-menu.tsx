'use client';

import { Button } from '@/components/ui/button';
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuGroup,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToggleDepartmentStatus } from '@/hooks/use-departments';
import type { Department } from '@/types/department.types';
import { Ellipsis, Pen, Pencil } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { EditDepartmentDialog } from './edit-department-dialog';
import { ToggleDepartmentDialog } from './toggle-department-dialog';
import { useTranslation } from '@/lib/i18n';

type DepartmentCardMenuProps = {
   department: Department;
};

export function DepartmentCardMenu({ department }: DepartmentCardMenuProps) {
   const { t } = useTranslation();
   const [editDialogOpen, setEditDialogOpen] = React.useState(false);
   const [statusDialogOpen, setStatusDialogOpen] = React.useState(false);

   const { mutate: toggleStatus, isPending: isToggling } =
      useToggleDepartmentStatus();

   const handleStatusConfirm = () => {
      toggleStatus(
         { id: department.id, isActive: !department.isActive },
         {
            onSuccess: () =>
               toast.success(
                  t(
                     department.isActive
                        ? 'departments.toast.disabled'
                        : 'departments.toast.enabled',
                     { name: department.name },
                  ),
               ),
            onError: (error) =>
               toast.error(
                  error.response?.data.message ??
                     t('departments.toast.updateFailed'),
               ),
            onSettled: () => setStatusDialogOpen(false),
         },
      );
   };

   return (
      <>
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Button variant="ghost" size="sm">
                  <Ellipsis />
               </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
               <DropdownMenuGroup>
                  <DropdownMenuItem
                     onSelect={(e) => {
                        e.preventDefault();
                        setEditDialogOpen(true);
                     }}
                  >
                     <Pencil className="size-4" />
                     {t('departments.form.edit')}
                  </DropdownMenuItem>
               </DropdownMenuGroup>

               <DropdownMenuSeparator />

               <DropdownMenuGroup>
                  <DropdownMenuItem
                     variant={department.isActive ? 'destructive' : 'default'}
                     onSelect={(e) => {
                        e.preventDefault();
                        setStatusDialogOpen(true);
                     }}
                  >
                     {t(
                        department.isActive
                           ? 'departments.menu.disable'
                           : 'departments.menu.enable',
                     )}
                  </DropdownMenuItem>
               </DropdownMenuGroup>
            </DropdownMenuContent>
         </DropdownMenu>

         <EditDepartmentDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            department={department}
         />

         <ToggleDepartmentDialog
            open={statusDialogOpen}
            onOpenChange={setStatusDialogOpen}
            isActive={department.isActive}
            departmentName={department.name}
            onConfirm={handleStatusConfirm}
            isPending={isToggling}
         />
      </>
   );
}
