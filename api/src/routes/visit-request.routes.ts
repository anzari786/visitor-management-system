import { Router } from 'express';
import {
   approveVisitRequest,
   createVisitRequest,
   getVisitRequestById,
   getVisitRequests,
   rejectVisitRequest,
} from '../controllers/visit-request.controller.js';
import { requireAuth } from '../middlewares/require-auth.js';
import { requireRole } from '../middlewares/require-role.js';
import { validate } from '../middlewares/validate.js';
import {
   approveVisitRequestSchema,
   createVisitRequestSchema,
   rejectVisitRequestSchema,
   visitRequestIdParamSchema,
   visitRequestsQuerySchema,
} from '../validations/visit-request.validation.js';

const router = Router();

// Public self-service submission
router.post('/', validate(createVisitRequestSchema), createVisitRequest);

// Reception / admin review endpoints
router.use(requireAuth, requireRole('admin', 'front_desk'));

router.get('/', validate(visitRequestsQuerySchema), getVisitRequests);
router.get('/:id', validate(visitRequestIdParamSchema), getVisitRequestById);
router.patch(
   '/:id/approve',
   validate(approveVisitRequestSchema),
   approveVisitRequest,
);
router.patch(
   '/:id/reject',
   validate(rejectVisitRequestSchema),
   rejectVisitRequest,
);

export default router;
