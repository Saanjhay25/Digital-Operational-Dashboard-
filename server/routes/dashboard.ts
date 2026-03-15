import express from 'express';
import { getLogs, getClusters, getNotifications, markNotificationRead, getAnalytics, createNotification } from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/logs', getLogs);
router.get('/clusters', getClusters);
router.get('/notifications', getNotifications);
router.post('/notifications', createNotification);
router.patch('/notifications/:id/read', markNotificationRead);
router.get('/analytics', getAnalytics);

export default router;
