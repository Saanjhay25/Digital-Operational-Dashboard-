import { Router } from 'express';
import { getActivities, createActivity } from '../controllers/activityController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', protect, getActivities);
router.post('/', protect, createActivity);

export default router;
