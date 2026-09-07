import { useQuery } from '@tanstack/react-query';
import { departmentsService } from '@/services/departments.service';

export const departmentQueryKeys = {
   all: ['departments'] as const,
   lists: () => [...departmentQueryKeys.all, 'list'] as const,
   list: (activeOnly?: boolean) =>
      [...departmentQueryKeys.lists(), { activeOnly: !!activeOnly }] as const,
};

export function useDepartments(activeOnly?: boolean) {
   return useQuery({
      queryKey: departmentQueryKeys.list(activeOnly),
      queryFn: async () => {
         const { data } = await departmentsService.getAll({ activeOnly });
         return data.data;
      },
   });
}

