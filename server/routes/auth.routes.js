// Auth routes - POST register, POST login, GET me

import { Router } from 'express';
import { register, login, googleLogin, getMe } from '../controllers/auth.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/me', authMiddleware, getMe);

export default router;
