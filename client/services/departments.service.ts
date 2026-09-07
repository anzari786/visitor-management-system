import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';

import type { Department } from '@/types/department.types';

export const departmentsService = {
   getAll(params?: { activeOnly?: boolean }) {
      return api.get<ApiResponse<Department[]>>('/departments', {
         params,
      });
   },

};
