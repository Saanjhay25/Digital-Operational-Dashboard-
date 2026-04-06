import { Router } from 'express';
import { registerUser, loginUser, googleLogin } from '../controllers/userController.js';

const router = Router();

// Health check for auth route
router.get('/status', (req, res) => {
    res.json({ status: 'Auth routes reachable' });
});

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);

export default router;
