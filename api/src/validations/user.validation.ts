import { z } from 'zod';
import { idParamSchema } from './shared.validation.js';

const phoneSchema = z.string().trim().min(7).max(20).optional();
const usernameSchema = z
   .string()
   .trim()
   .min(3)
   .max(30)
   .regex(/^[a-zA-Z0-9_]+$/);

// Role.name is a unique string slug in the roles table (e.g. "admin", "front_desk").
// Existence is checked against the DB in the controller.
const roleNameSchema = z
   .string()
   .trim()
   .min(1)
   .max(50)
   .regex(/^[a-z][a-z0-9_]*$/);

export const createUserSchema = z.object({
   body: z.object({
      firstName: z.string().trim().min(1).max(50),
      lastName: z.string().trim().min(1).max(50),
      username: usernameSchema,
      phone: phoneSchema,
      role: roleNameSchema,
      password: z.string().min(8).max(72),
   }),
});

export const updateUserSchema = z.object({
   params: idParamSchema.shape.params,

   body: z.object({
      firstName: z.string().trim().min(1).max(50),
      lastName: z.string().trim().min(1).max(50),
      username: usernameSchema,
      phone: phoneSchema,
   }),
});

export const changeUserRoleSchema = z.object({
   params: idParamSchema.shape.params,

   body: z.object({
      role: roleNameSchema,
   }),
});

export const updateUserStatusSchema = z.object({
   params: idParamSchema.shape.params,

   body: z.object({
      isActive: z.boolean(),
   }),
});
