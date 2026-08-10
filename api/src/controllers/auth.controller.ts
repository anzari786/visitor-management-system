import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';
import type { Prisma } from '../generated/prisma/client.js';
import {
   UnauthorizedError,
   ForbiddenError,
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
   avatar: true,
   isActive: true,
   mustChangePassword: true,
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
         attendancesCheckedIn: true,
         attendancesCheckedOut: true,
      },
   },
} satisfies Prisma.UserSelect;

type UserWithCounts = Prisma.UserGetPayload<{ select: typeof userSelect }>;

const formatUser = (user: UserWithCounts) => ({
   id: String(user.id),
   firstName: user.firstName,
   lastName: user.lastName,
   username: user.username,
   phone: user.phone ?? undefined,
   avatar: user.avatar ?? undefined,
   roles: user.userRoles.map((userRole) => userRole.role.name),
   isActive: user.isActive,
   mustChangePassword: user.mustChangePassword,
   createdAt: user.createdAt,
   checkIns: user._count.attendancesCheckedIn,
   checkOuts: user._count.attendancesCheckedOut,
});

export const login = async (req: Request, res: Response) => {
   const { username, password } = req.body;

   const user = await prisma.user.findUnique({
      where: { username },
      select: { ...userSelect, passwordHash: true },
   });

   if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Invalid credentials', 'INVALID_USERNAME');
   }

   const isValidPassword = await bcrypt.compare(password, user.passwordHash);

   if (!isValidPassword) {
      throw new UnauthorizedError('Invalid credentials', 'INVALID_PASSWORD');
   }

   if (!user.isActive) {
      throw new ForbiddenError('Account disabled');
   }

   const roles = user.userRoles.map((userRole) => userRole.role.name);

   req.session.regenerate(async (error) => {
      if (error) {
         return res.status(500).json({
            success: false,
            message: 'Session error',
         });
      }

      req.session.userId = user.id;
      req.session.roles = roles;

      await prisma.user.update({
         where: { id: user.id },
         data: { lastLoginAt: new Date() },
         select: userSelect,
      });

      return res.status(200).json({
         success: true,
         message: 'Login successful',
         data: { user: formatUser(user) },
      });
   });
};

export const logout = (req: Request, res: Response) => {
   req.session.destroy((error) => {
      if (error) {
         return res.status(500).json({
            success: false,
            message: 'Logout failed',
         });
      }

      res.clearCookie('vms.sid');

      return res.status(200).json({
         success: true,
         message: 'Logged out successfully',
      });
   });
};

export const getCurrentUser = async (req: Request, res: Response) => {
   const userId = req.session.userId;

   const user = await prisma.user.findUnique({
      where: { id: userId },
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

export const updateProfile = async (req: Request, res: Response) => {
   const userId = req.session.userId;
   const { firstName, lastName, username, phone, avatar } = req.body;

   const usernameTaken = await prisma.user.findFirst({
      where: { username, NOT: { id: userId } },
   });

   if (usernameTaken) {
      throw new ConflictError('Username already exists');
   }

   const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
         firstName,
         lastName,
         username,
         phone,
         ...(avatar !== undefined
            ? { avatar: avatar === '' || avatar === null ? null : avatar }
            : {}),
      },
      select: userSelect,
   });

   return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: formatUser(updatedUser),
   });
};

export const changePassword = async (req: Request, res: Response) => {
   const userId = req.session.userId;
   const { currentPassword, newPassword } = req.body;

   const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
         id: true,
         passwordHash: true,
         userRoles: {
            select: {
               role: {
                  select: {
                     name: true,
                  },
               },
            },
         },
      },
   });

   if (!user || !user.passwordHash) {
      throw new NotFoundError('User not found');
   }

   const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
   );

   if (!isCurrentPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
   }

   const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);

   if (isSamePassword) {
      throw new BadRequestError(
         'New password must be different from current password',
      );
   }

   const passwordHash = await bcrypt.hash(newPassword, 12);

   await prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: false },
   });

   return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
   });
};

export const forceChangePassword = async (req: Request, res: Response) => {
   const userId = req.session.userId;
   const { newPassword } = req.body;

   const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
         id: true,
         passwordHash: true,
         mustChangePassword: true,
      },
   });

   if (!user || !user.passwordHash) {
      throw new NotFoundError('User not found');
   }

   if (!user.mustChangePassword) {
      throw new BadRequestError('Password change is not required');
   }

   const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);

   if (isSamePassword) {
      throw new BadRequestError(
         'New password must be different from current password',
      );
   }

   const passwordHash = await bcrypt.hash(newPassword, 12);

   const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: false },
      select: userSelect,
   });

   return res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      data: formatUser(updatedUser),
   });
};

export const checkUsername = async (req: Request, res: Response) => {
   const username = String(req.query.username ?? '');
   const currentUserId = req.session.userId;

   const existing = await prisma.user.findFirst({
      where: {
         username,
         ...(currentUserId ? { NOT: { id: currentUserId } } : {}),
      },
      select: { id: true },
   });

   return res.status(200).json({
      success: true,
      data: { available: !existing },
   });
};
