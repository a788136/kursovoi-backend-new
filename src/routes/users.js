import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { User } from '../models/User.js';

const router = Router();

/**
 * GET /users/me
 * Требует авторизации
 */
router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.session.userId).exec();
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user.toClient());
});

export default router;
