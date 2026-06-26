// User routes - profile, avatar, search

import { Router } from 'express';
import { getUserById, updateProfile, updateAvatar, searchUsers } from '../controllers/user.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';

const router = Router();

router.get('/search', authMiddleware, searchUsers);
router.get('/:id', getUserById);
router.put('/profile', authMiddleware, updateProfile);
router.patch('/avatar', authMiddleware, upload.single('avatar'), updateAvatar);

export default router;
