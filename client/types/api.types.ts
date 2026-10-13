export type ApiResponse<T> = {
   success: boolean;
   data: T;
   message?: string;
};

export type PaginatedApiResponse<T> = ApiResponse<T> & {
   pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
   };
};

export interface ApiErrorResponse {
   success: false;
   message: string;
   code?:
      | 'INVALID_USERNAME'
      | 'INVALID_PASSWORD'
      | 'INVALID_SETUP_TOKEN'
      | 'EXPIRED_SETUP_TOKEN'
      | 'PASSWORD_ALREADY_SET';
}
