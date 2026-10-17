import { Router } from 'express';
import { login, register, requireUser, updateProfile } from './auth.js';
import { listVideos, publishVideo, deleteVideo } from './videos.js';

const router = Router();
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', requireUser, (req, res) => res.json({ user: req.user }));
router.patch('/auth/me', requireUser, updateProfile);
router.get('/videos', listVideos);
router.post('/videos', requireUser, publishVideo);
router.delete('/videos/:id', requireUser, deleteVideo);
export default router;
