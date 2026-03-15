import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser, changeSelfPassword, resetUserPassword, updateProfile, getCurrentProfile } from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = Router();

// Profile and self-management
router.get('/profile', protect, getCurrentProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changeSelfPassword);

// User management (Admin only)
router.post('/', protect, admin, createUser);
router.get('/', protect, admin, getUsers);
router.put('/:username', protect, admin, updateUser);
router.delete('/:username', protect, admin, deleteUser);
router.post('/reset-password/:username', protect, admin, resetUserPassword);

export default router;
