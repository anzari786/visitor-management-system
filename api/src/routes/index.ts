import { Router } from 'express';

import authRoutes from '../modules/auth/auth.routes.js';

import dashboardRoutes from './dashboard.routes.js';
import reportRoutes from './report.routes.js';
import settingRoutes from './setting.routes.js';

import userRoutes from '../modules/users/user.routes.js';
import employeeRoutes from '../modules/employees/employee.routes.js';
import visitorRoutes from '../modules/visitors/visitor.routes.js';

import visitRoutes from '../modules/visits/visit.routes.js';
import visitAttendanceRoutes from '../modules/visit-attendances/visit-attendance.routes.js';

import badgeRoutes from '../modules/badges/badge.routes.js';
import notificationRoutes from '../modules/notifications/notification.routes.js';

const router = Router();

// Authentication (local login + company SSO)
router.use('/auth', authRoutes);

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

// Operations
router.use('/badges', badgeRoutes);
router.use('/notifications', notificationRoutes);

export default router;
