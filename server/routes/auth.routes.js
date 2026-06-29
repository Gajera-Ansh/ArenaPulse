// Auth routes - POST register, POST login, GET me

import { Router } from 'express';
import { register, login, googleLogin, getMe, requestForgotPasswordOTP, verifyForgotPasswordOTP, resetPassword } from '../controllers/auth.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/me', authMiddleware, getMe);
router.post('/forgot-password-otp', requestForgotPasswordOTP);
router.post('/verify-forgot-password-otp', verifyForgotPasswordOTP);
router.post('/reset-password', resetPassword);

export default router;
