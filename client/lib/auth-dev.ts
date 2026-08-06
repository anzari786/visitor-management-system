import type { User } from '@/types/user.types';

/**
 * Mock user used only when a dev-bypass flag is enabled.
 * Safe to import from both server code (e.g. auth-server.ts) and
 * client code (e.g. the Zustand auth store) — this file has no
 * 'use client' or 'use server' directive and does no I/O.
 */
export const DEV_USER: User = {
   id: 0,
   firstName: 'Dev',
   lastName: 'Admin',
   username: 'dev.admin',
   role: 'admin', // swap to 'front_desk' to test that role instead
   isActive: true,
   mustChangePassword: false,
   createdAt: new Date().toISOString(),
   checkIns: 0,
   checkOuts: 0,
};
