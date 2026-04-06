import express from 'express';
import { generateReport } from '../controllers/reportController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/generate', protect, generateReport);

export default router;
