import type { User } from '@/types/user.types';

export const DEV_USER: User = {
   id: 0,
   firstName: 'Dev',
   lastName: 'Admin',
   username: 'dev.admin',
   role: 'ADMIN', // Change this to another UserRole when testing a different role
   isActive: true,
   createdAt: new Date().toISOString(),
   checkIns: 0,
   checkOuts: 0,
};
