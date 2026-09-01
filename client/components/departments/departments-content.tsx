'use client';

import { Plus } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Content } from '@/components/shared/content';
import CreateDepartment from './create-department';
import { DepartmentCardGrid } from './department-card-grid';
import { useCreateDepartment, useDepartments } from '@/hooks/use-departments';
import type { CreateDepartmentFormValues } from '@/lib/validations/department.schema';
import { useTranslation } from '@/lib/i18n';

export function DepartmentsContent() {
   const { t } = useTranslation();
   const [open, setOpen] = React.useState(false);
   const { data: departments = [] } = useDepartments();
   const { mutateAsync: createDepartment } = useCreateDepartment();

   async function handleCreateDepartment(values: CreateDepartmentFormValues) {
      try {
         await createDepartment(values);
         toast.success(t('departments.toast.created'));
         setOpen(false);
      } catch (error) {
         const message =
            (error as import('axios').AxiosError<{ message: string }>)?.response
               ?.data?.message ??
            t('departments.toast.createFailed');

         toast.error(message);
         throw error;
      }
   }

   return (
      <Content
         subtitle={
            <p>
               <span className="text-foreground font-medium">
                  {t('departments.countConfigured', {
                     count: departments.length,
                  })}
               </span>{' '}
               {t('departments.subtitleSuffix')}
            </p>
         }
         actionButton={
            <Button
               size="sm"
               onClick={() => setOpen(true)}
               className="gap-2 sm:gap-3 h-8 sm:h-9 text-xs sm:text-sm bg-linear-to-b from-foreground to-foreground/90 text-background"
            >
               <Plus className="size-3 sm:size-4" />
               <span className="hidden sm:inline">
                  {t('departments.new')}
               </span>
               <span className="sm:hidden">{t('departments.newShort')}</span>
            </Button>
         }
      >
         <DepartmentCardGrid />
         <CreateDepartment
            open={open}
            onOpenChange={setOpen}
            onSubmit={handleCreateDepartment}
         />
      </Content>
   );
}
