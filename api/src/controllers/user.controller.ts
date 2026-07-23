import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import type { Prisma } from '../generated/prisma/client.js';
import {
   NotFoundError,
   ConflictError,
   BadRequestError,
} from '../lib/errors.js';

const userSelect = {
   id: true,
   firstName: true,
   lastName: true,
   username: true,
   phone: true,
   isActive: true,
   mustChangePassword: true,
   lastLoginAt: true, // add this
   createdAt: true,
   userRoles: {
      select: {
         role: {
            select: {
               name: true,
            },
         },
      },
   },
   _count: {
      select: {
         checkedInVisits: true,
         checkedOutVisits: true,
      },
   },
} satisfies Prisma.UserSelect;

type UserWithCounts = Prisma.UserGetPayload<{ select: typeof userSelect }>;

// Maps the Prisma shape onto the frontend `User` type
// (checkIns/checkOuts flattened out of _count; roles from UserRole).
const formatUser = (user: UserWithCounts) => ({
   id: user.id,
   firstName: user.firstName,
   lastName: user.lastName,
   username: user.username,
   phone: user.phone ?? undefined,
   roles: user.userRoles.map((userRole) => userRole.role.name),
   isActive: user.isActive,
   mustChangePassword: user.mustChangePassword,
   lastLoginAt: user.lastLoginAt ?? undefined, // add this
   createdAt: user.createdAt,
   checkIns: user._count.checkedInVisits,
   checkOuts: user._count.checkedOutVisits,
});

const generateTempPassword = () => crypto.randomBytes(6).toString('base64url');

export const getUsers = async (req: Request, res: Response) => {
   const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: userSelect,
   });

   return res.status(200).json({
      success: true,
      data: users.map(formatUser),
   });
};

export const getUserById = async (req: Request, res: Response) => {
   const id = Number(req.params.id);

   const user = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
   });

   if (!user) {
      throw new NotFoundError('User not found');
   }

   return res.status(200).json({
      success: true,
      data: formatUser(user),
   });
};

export const createUser = async (req: Request, res: Response) => {
   const { firstName, lastName, username, phone, role, password } = req.body;

   const existingUser = await prisma.user.findUnique({
      where: { username },
   });

   if (existingUser) {
      throw new ConflictError('Username already exists');
   }

   const roleRecord = await prisma.role.findUnique({
      where: { name: role },
   });

   if (!roleRecord) {
      throw new BadRequestError('Invalid role');
   }

   const passwordHash = await bcrypt.hash(password, 12);

   const user = await prisma.user.create({
      data: {
         firstName,
         lastName,
         username,
         phone,
         passwordHash,
         userRoles: {
            create: {
               roleId: roleRecord.id,
            },
         },
         // mustChangePassword defaults to true in the schema
      },
      select: userSelect,
   });

   return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: formatUser(user),
   });
};

export const updateUser = async (req: Request, res: Response) => {
   const id = Number(req.params.id);
   const { firstName, lastName, username, phone } = req.body;

   const existingUser = await prisma.user.findUnique({ where: { id } });

   if (!existingUser) {
      throw new NotFoundError('User not found');
   }

   const usernameTaken = await prisma.user.findFirst({
      where: { username, NOT: { id } },
   });

   if (usernameTaken) {
      throw new ConflictError('Username already exists');
   }

   const updatedUser = await prisma.user.update({
      where: { id },
      data: { firstName, lastName, username, phone },
      select: userSelect,
   });

   return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: formatUser(updatedUser),
   });
};

export const changeUserRole = async (req: Request, res: Response) => {
   const id = Number(req.params.id);
   const { role } = req.body;

   const existingUser = await prisma.user.findUnique({ where: { id } });

   if (!existingUser) {
      throw new NotFoundError('User not found');
   }

   const roleRecord = await prisma.role.findUnique({
      where: { name: role },
   });

   if (!roleRecord) {
      throw new BadRequestError('Invalid role');
   }

   // Prevent an admin from demoting themselves out of admin
   if (req.session.userId === id && role !== 'admin') {
      throw new BadRequestError('You cannot change your own role');
   }

   const updatedUser = await prisma.user.update({
      where: { id },
      data: {
         userRoles: {
            deleteMany: {},
            create: {
               roleId: roleRecord.id,
            },
         },
      },
      select: userSelect,
   });

   return res.status(200).json({
      success: true,
      message: 'Role updated successfully',
      data: formatUser(updatedUser),
   });
};

export const updateUserStatus = async (req: Request, res: Response) => {
   const id = Number(req.params.id);
   const { isActive } = req.body;

   const user = await prisma.user.findUnique({ where: { id } });

   if (!user) {
      throw new NotFoundError('User not found');
   }

   if (req.session.userId === id && isActive === false) {
      throw new BadRequestError('You cannot deactivate your own account');
   }

   const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: userSelect,
   });

   return res.status(200).json({
      success: true,
      message: isActive
         ? 'User activated successfully'
         : 'User deactivated successfully',
      data: formatUser(updatedUser),
   });
};

// Generates a temp password, forces a change on next login.
export const resetUserPassword = async (req: Request, res: Response) => {
   const id = Number(req.params.id);

   const user = await prisma.user.findUnique({ where: { id } });

   if (!user) {
      throw new NotFoundError('User not found');
   }

   const tempPassword = generateTempPassword();
   const passwordHash = await bcrypt.hash(tempPassword, 12);

   await prisma.user.update({
      where: { id },
      data: {
         passwordHash,
         mustChangePassword: true,
      },
   });

   // tempPassword is only ever available in this response — not stored in plaintext
   return res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      data: { tempPassword },
   });
};

export const deleteUser = async (req: Request, res: Response) => {
   const id = Number(req.params.id);

   const user = await prisma.user.findUnique({ where: { id } });

   if (!user) {
      throw new NotFoundError('User not found');
   }

   if (req.session.userId === id) {
      throw new BadRequestError('You cannot delete your own account');
   }

   await prisma.user.delete({
      where: { id },
   });

   return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
   });
};
