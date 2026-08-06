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
         checkedInVisits: true,
         checkedOutVisits: true,
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
   roles: user.userRoles.map((userRole) => userRole.role.name),
   isActive: user.isActive,
   mustChangePassword: user.mustChangePassword,
   createdAt: user.createdAt,
   checkIns: user._count.checkedInVisits,
   checkOuts: user._count.checkedOutVisits,
});

export const login = async (req: Request, res: Response) => {
   const { username, password } = req.body;

   const user = await prisma.user.findUnique({
      where: { username },
      select: { ...userSelect, passwordHash: true },
   });

   if (!user) {
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

// New — matches authService.updateProfile() / PATCH /auth/me
export const updateProfile = async (req: Request, res: Response) => {
   const userId = req.session.userId;
   const { username, phone } = req.body;

   const usernameTaken = await prisma.user.findFirst({
      where: { username, NOT: { id: userId } },
   });

   if (usernameTaken) {
      throw new ConflictError('Username already exists');
   }

   const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { username, phone },
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

   if (!user) {
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
      data: { passwordHash },
   });

   const roles = user.userRoles.map((userRole) => userRole.role.name);

   req.session.regenerate((error) => {
      if (error) {
         return res.status(500).json({
            success: false,
            message: 'Session regeneration failed',
         });
      }

      req.session.userId = user.id;
      req.session.roles = roles;

      return res.status(200).json({
         success: true,
         message: 'Password changed successfully',
      });
   });
};

export const forceChangePassword = async (req: Request, res: Response) => {
   const userId = req.session.userId;
   const { newPassword } = req.body;

   const user = await prisma.user.findUnique({ where: { id: userId } });

   if (!user) {
      throw new NotFoundError('User not found');
   }

   if (!user.mustChangePassword) {
      throw new BadRequestError(
         'Password change is not required for this account',
      );
   }

   const passwordHash = await bcrypt.hash(newPassword, 12);

   const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
         passwordHash,
         mustChangePassword: false,
      },
      select: userSelect,
   });

   const roles = updatedUser.userRoles.map((userRole) => userRole.role.name);

   req.session.regenerate((error) => {
      if (error) {
         return res.status(500).json({
            success: false,
            message: 'Session regeneration failed',
         });
      }

      req.session.userId = updatedUser.id;
      req.session.roles = roles;

      return res.status(200).json({
         success: true,
         message: 'Password updated successfully',
         data: formatUser(updatedUser),
      });
   });
};

export const checkUsername = async (req: Request, res: Response) => {
   const { username } = req.query as { username: string };

   const existingUser = await prisma.user.findUnique({
      where: { username },
   });

   return res.status(200).json({
      success: true,
      data: { available: !existingUser },
   });
};
