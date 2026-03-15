import { Router } from 'express';
import { getIncidents, getIncidentById, createIncident, updateIncident, deleteIncident } from '../controllers/incidentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', protect, getIncidents);
router.get('/:id', protect, getIncidentById);
router.post('/', protect, createIncident);
router.put('/:id', protect, updateIncident);
router.delete('/:id', protect, deleteIncident);

export default router;
