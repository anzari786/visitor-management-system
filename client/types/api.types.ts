export type ApiResponse<T> = {
   success: boolean;
   data: T;
   message?: string;
};

export interface ApiErrorResponse {
   success: false;
   message: string;
   code?:
      | 'INVALID_USERNAME'
      | 'INVALID_PASSWORD'
      | 'INVALID_CREDENTIALS'
      | 'PASSWORD_CHANGE_REQUIRED';
}
