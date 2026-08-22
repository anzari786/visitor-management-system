import { Router } from 'express';
import {
   getVisitors,
   getVisitor,
   createVisitor,
   patchVisitor,
   getVisitorHistoryList,
} from './visitor.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
   listVisitorsSchema,
   visitorIdParamSchema,
   createVisitorSchema,
   updateVisitorSchema,
   visitorHistoryQuerySchema,
} from './visitor.validation.js';

const router = Router();

router.get('/', requireAuth, validate(listVisitorsSchema), getVisitors);
router.post('/', requireAuth, validate(createVisitorSchema), createVisitor);
router.get('/:id', requireAuth, validate(visitorIdParamSchema), getVisitor);
router.patch('/:id', requireAuth, validate(updateVisitorSchema), patchVisitor);
router.get(
   '/:id/history',
   requireAuth,
   validate(visitorHistoryQuerySchema),
   getVisitorHistoryList,
);

export default router;
