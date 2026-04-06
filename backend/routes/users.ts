import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser, changeSelfPassword, resetUserPassword, updateProfile, getCurrentProfile, getOperators, updateAvailability } from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = Router();

// Profile and self-management
router.get('/profile', protect, getCurrentProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changeSelfPassword);

// User management
router.get('/operators', protect, getOperators);
router.put('/:id/availability', protect, updateAvailability);

// Admin only management
router.post('/', protect, admin, createUser);
router.get('/', protect, admin, getUsers);
router.put('/:email', protect, admin, updateUser);
router.delete('/:email', protect, admin, deleteUser);
router.post('/reset-password/:email', protect, admin, resetUserPassword);

export default router;
