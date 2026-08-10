'use client';

import { MOCK_USERS } from '@/data/mock-users';
import type {
   CreateUserPayload,
   UpdateUserPayload,
   User,
   UserRole,
} from '@/types/user.types';
import { create } from 'zustand';

type MockUsersState = {
   users: User[];
   createUser: (payload: CreateUserPayload) => User;
   updateUser: (payload: UpdateUserPayload) => User;
   changeRole: (id: number, role: UserRole) => User;
   toggleStatus: (id: number, isActive: boolean) => User;
   resetPassword: (id: number) => { tempPassword: string };
   getById: (id: number) => User | undefined;
};

function nextId(users: User[]) {
   return users.reduce((max, user) => Math.max(max, user.id), 0) + 1;
}

function generateTempPassword() {
   const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
   let password = '';
   for (let i = 0; i < 10; i++) {
      password += alphabet[Math.floor(Math.random() * alphabet.length)];
   }
   return password;
}

/**
 * In-memory users store used while the Users page is mock-driven.
 * Swap call sites to `usersService` + react-query when the API is ready.
 */
export const useMockUsersStore = create<MockUsersState>((set, get) => ({
   users: MOCK_USERS,

   getById: (id) => get().users.find((user) => user.id === id),

   createUser: (payload) => {
      const user: User = {
         id: nextId(get().users),
         firstName: payload.firstName,
         lastName: payload.lastName,
         username: payload.username,
         phone: payload.phone,
         role: payload.role,
         isActive: true,
         mustChangePassword: true,
         lastLoginAt: undefined,
         createdAt: new Date().toISOString(),
         checkIns: 0,
         checkOuts: 0,
      };

      set((state) => ({ users: [user, ...state.users] }));
      return user;
   },

   updateUser: (payload) => {
      let updated: User | undefined;

      set((state) => ({
         users: state.users.map((user) => {
            if (user.id !== payload.id) return user;
            updated = {
               ...user,
               firstName: payload.firstName,
               lastName: payload.lastName,
               username: payload.username,
               phone: payload.phone,
               role: payload.role,
            };
            return updated;
         }),
      }));

      if (!updated) {
         throw new Error('User not found');
      }

      return updated;
   },

   changeRole: (id, role) => {
      let updated: User | undefined;

      set((state) => ({
         users: state.users.map((user) => {
            if (user.id !== id) return user;
            updated = { ...user, role };
            return updated;
         }),
      }));

      if (!updated) {
         throw new Error('User not found');
      }

      return updated;
   },

   toggleStatus: (id, isActive) => {
      let updated: User | undefined;

      set((state) => ({
         users: state.users.map((user) => {
            if (user.id !== id) return user;
            updated = { ...user, isActive };
            return updated;
         }),
      }));

      if (!updated) {
         throw new Error('User not found');
      }

      return updated;
   },

   resetPassword: (id) => {
      const user = get().getById(id);
      if (!user) {
         throw new Error('User not found');
      }

      set((state) => ({
         users: state.users.map((item) =>
            item.id === id ? { ...item, mustChangePassword: true } : item,
         ),
      }));

      return { tempPassword: generateTempPassword() };
   },
}));
