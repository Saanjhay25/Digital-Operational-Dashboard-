import { Router } from 'express';
import { getMetrics, updateMetrics } from '../controllers/metricsController.js';

const router = Router();

router.get('/', getMetrics);
router.post('/', updateMetrics);

export default router;
