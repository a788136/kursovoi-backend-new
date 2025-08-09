import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { requireAuth, attachUser } from '../middleware/auth.js';

import passport from '../config/passport.js';
import { buildRedirect } from '../lib/buildRedirect.js';

const router = Router();

/**
 * POST /auth/login
 * body: { email, password }
 */
router.post('/login', attachUser, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const user = await User.findOne({ email: email.toLowerCase() }).exec();
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  if (user.isBlocked) return res.status(403).json({ error: 'User is blocked' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  req.session.userId = user._id.toString();
  res.json({ authenticated: true, user: user.toClient() });
});

/**
 * POST /auth/logout
 */
router.post('/logout', requireAuth, (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Failed to logout' });
    res.clearCookie('sid');
    return res.json({ ok: true });
  });
});

/**
 * GET /auth/me
 */
router.get('/me', attachUser, async (req, res) => {
  if (!req.session.userId) return res.json({ authenticated: false });
  const user = await User.findById(req.session.userId).exec();
  if (!user) return res.json({ authenticated: false });
  res.json({ authenticated: true, user: user.toClient() });
});

// === Google OAuth ===
/**
 * Старт: /auth/google
 * (через фронтовый прокси это будет /api/auth/google)
 */
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  prompt: 'select_account'
}));

/**
 * Callback: /auth/google/callback
 */
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: () => buildRedirect('/?error=oauth_failed') }),
  (req, res) => {
    // Успешная аутентификация → редирект на фронт
    return res.redirect(buildRedirect('/'));
  }
);
export default router;
