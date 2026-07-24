import { Router } from 'express';

import authRoutes from '../modules/auth/auth.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import departmentRoutes from './department.routes.js';
import reportRoutes from './report.routes.js';
import settingRoutes from './setting.routes.js';
import userRoutes from './user.routes.js';
import visitRoutes from './visit.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);

router.use('/users', userRoutes);
router.use('/visits', visitRoutes);
router.use('/departments', departmentRoutes);

router.use('/settings', settingRoutes);
router.use('/reports', reportRoutes);

export default router;
