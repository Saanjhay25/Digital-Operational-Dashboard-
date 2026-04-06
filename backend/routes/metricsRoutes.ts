import { Router } from 'express';
import { getErrorRate, getMetrics, simulateError, simulateDowntime } from '../controllers/metricsController.js';

const router = Router();

// GET /api/metrics/
router.get('/', getMetrics);

// GET /api/metrics/error-rate
router.get('/error-rate', getErrorRate);

// GET /api/metrics/simulate-error
router.get('/simulate-error', simulateError);

// GET /api/metrics/simulate-downtime
router.get('/simulate-downtime', simulateDowntime);

export default router;
