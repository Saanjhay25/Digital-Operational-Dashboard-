import express from 'express';
import { createRCA, getRCAByIncident, updateRCA, updateRCAStatus, getRCAAnalytics } from '../controllers/rcaController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/analytics', protect, getRCAAnalytics);
router.post('/', protect, createRCA);
router.get('/incident/:incidentId', protect, getRCAByIncident);
router.put('/:id', protect, updateRCA);
router.put('/:id/status', protect, updateRCAStatus);

export default router;
