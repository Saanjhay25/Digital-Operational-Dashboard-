import { Router } from 'express';
import { getLogs } from '../controllers/logController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/logs?level=error&search=auth&limit=50
router.get('/', protect, getLogs);

export default router;
