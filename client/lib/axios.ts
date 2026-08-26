import axios from 'axios';
import { useAuthStore } from '@/store/auth-store';

export const api = axios.create({
   baseURL: process.env.NEXT_PUBLIC_API_URL,
   withCredentials: true, // sends the session cookie automatically on every request
   headers: {
      'Content-Type': 'application/json',
   },
});

const PUBLIC_API_PATHS = [
   '/auth/login',
   '/auth/password/setup/',
   '/public/',
   '/self-service/',
   '/employees/search',
];

api.interceptors.response.use(
   (response) => response,
   (error) => {
      const url = error.config?.url ?? '';
      const isPublicApiCall = PUBLIC_API_PATHS.some((p) => url.includes(p));

      if (error.response?.status === 401 && !isPublicApiCall) {
         useAuthStore.getState().clearAuth();
         if (window.location.pathname !== '/login') {
            window.location.href = '/login';
         }
      }
      return Promise.reject(error);
   },
);
