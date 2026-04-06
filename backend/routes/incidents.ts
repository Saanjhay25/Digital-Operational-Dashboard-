import { Router } from 'express';
import { getIncidents, getIncidentById, createIncident, updateIncident, deleteIncident, assignIncident } from '../controllers/incidentController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', protect, getIncidents);
router.post('/:id/assign', protect, admin, assignIncident);
router.get('/:id', protect, getIncidentById);
router.post('/', protect, createIncident);
router.put('/:id', protect, updateIncident);
router.delete('/:id', protect, deleteIncident);

export default router;
