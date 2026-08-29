import type { User } from '@/types/user.types';

export const DEV_USER: User = {
   id: 0,
   firstName: 'Dev',
   lastName: 'Admin',
   username: 'dev.admin',
   role: 'admin',
   isActive: true,
   mustChangePassword: false,
   createdAt: new Date().toISOString(),
   checkIns: 0,
   checkOuts: 0,
};