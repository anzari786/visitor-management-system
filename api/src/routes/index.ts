import { Router } from 'express';

import authRoutes from '../modules/auth/auth.routes.js';
// TODO: Remove after SSO integration
import localAuthRoutes from '../modules/local-auth/local-auth.routes.js';

import dashboardRoutes from './dashboard.routes.js';
import reportRoutes from './report.routes.js';
import settingRoutes from './setting.routes.js';

import userRoutes from '../modules/users/user.routes.js';
import employeeRoutes from '../modules/employees/employee.routes.js';
import visitorRoutes from '../modules/visitors/visitor.routes.js';

import visitRoutes from '../modules/visits/visit.routes.js';
import invitationRoutes from '../modules/invitations/invitation.routes.js';
import visitAttendanceRoutes from '../modules/visit-attendances/visit-attendance.routes.js';

import badgeRoutes from '../modules/badges/badge.routes.js';
import notificationRoutes from '../modules/notifications/notification.routes.js';

const router = Router();

// Authentication
router.use('/auth', authRoutes);
// TODO: Remove after SSO integration
// Temporary local username/password auth, used only until SSO is wired up.
// Logout and "current user" stay on the routes above — this only adds
// /auth/local/login and /auth/local/change-password.
router.use('/auth/local', localAuthRoutes);

// Dashboard & Reports
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);

// Administration
router.use('/users', userRoutes);
router.use('/settings', settingRoutes);

// Directory
router.use('/employees', employeeRoutes);
router.use('/visitors', visitorRoutes);

// Visitor Management
router.use('/visits', visitRoutes);
router.use('/visit-attendance', visitAttendanceRoutes);
router.use('/invitations', invitationRoutes);

// Operations
router.use('/badges', badgeRoutes);
router.use('/notifications', notificationRoutes);

export default router;
