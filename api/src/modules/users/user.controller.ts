import type { Request, Response } from 'express';
import type { z } from 'zod';
import {
   createUser,
   listUsers,
   getUserById,
   updateUser,
   assignRole,
   removeRole,
   resetLocalPassword,
   formatUserDetail,
   formatUserSummary,
} from './user.service.js';
import type {
   createUserSchema,
   listUsersSchema,
   userIdParamSchema,
   updateUserSchema,
   assignRoleSchema,
   removeRoleParamSchema,
   resetPasswordParamSchema,
} from './user.validation.js';

type CreateUserBody = z.infer<typeof createUserSchema>['body'];
type ListUsersQuery = z.infer<typeof listUsersSchema>['query'];
type UserIdParams = z.infer<typeof userIdParamSchema>['params'];
type UpdateUserParams = z.infer<typeof updateUserSchema>['params'];
type UpdateUserBody = z.infer<typeof updateUserSchema>['body'];
type AssignRoleParams = z.infer<typeof assignRoleSchema>['params'];
type AssignRoleBody = z.infer<typeof assignRoleSchema>['body'];
type RemoveRoleParams = z.infer<typeof removeRoleParamSchema>['params'];
type ResetPasswordParams = z.infer<typeof resetPasswordParamSchema>['params'];

export const postUser = async (req: Request, res: Response) => {
   const input = req.validatedBody as CreateUserBody;

   const user = await createUser(input);

   return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: formatUserDetail(user),
   });
};

export const getUsers = async (req: Request, res: Response) => {
   const { search, isActive, role, page, limit } =
      req.validatedQuery as ListUsersQuery;

   const { users, meta } = await listUsers({
      search,
      isActive: isActive === undefined ? undefined : isActive === 'true',
      role,
      page,
      limit,
   });

   return res.status(200).json({
      success: true,
      data: users.map(formatUserSummary),
      pagination: meta,
   });
};

export const getUser = async (req: Request, res: Response) => {
   const { id } = req.validatedParams as UserIdParams;

   const user = await getUserById(id);

   return res.status(200).json({
      success: true,
      data: formatUserDetail(user),
   });
};

export const patchUser = async (req: Request, res: Response) => {
   const { id } = req.validatedParams as UpdateUserParams;
   const input = req.validatedBody as UpdateUserBody;

   const user = await updateUser(id, input);

   return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: formatUserDetail(user),
   });
};

export const postUserRole = async (req: Request, res: Response) => {
   const { id } = req.validatedParams as AssignRoleParams;
   const { role } = req.validatedBody as AssignRoleBody;

   const user = await assignRole(id, role);

   return res.status(200).json({
      success: true,
      message: 'Role assigned successfully',
      data: formatUserDetail(user),
   });
};

export const deleteUserRole = async (req: Request, res: Response) => {
   const { id, role } = req.validatedParams as RemoveRoleParams;

   const user = await removeRole(id, role);

   return res.status(200).json({
      success: true,
      message: 'Role removed successfully',
      data: formatUserDetail(user),
   });
};

export const postResetPassword = async (req: Request, res: Response) => {
   const { id } = req.validatedParams as ResetPasswordParams;

   const data = await resetLocalPassword(id, req.session.userId!);

   return res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      data,
   });
};
