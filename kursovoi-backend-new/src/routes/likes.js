// src/routes/likes.js
import { Router } from 'express';
import mongoose from 'mongoose';
import { optionalAuthLite, ensureAuthRequiredLite } from '../middleware/optionalAuthLite.js';

// Модель Item должна иметь поле likes: [ObjectId] (по умолчанию [])
// Если у тебя другое имя модели/схема — скажи, подгоню.
const Item = mongoose.models.Item || mongoose.model('Item');

const router = Router();

/**
 * GET /items/:id/likes
 * Публичный (optional auth): возвращает { count, liked }
 */
router.get('/items/:id/likes', optionalAuthLite, async (req, res) => {
  try {
    const { id } = req.params;

    const item = await Item.findById(id).select('likes').lean();
    if (!item) return res.status(404).json({ error: 'Not found' });

    const likes = Array.isArray(item.likes) ? item.likes : [];
    const count = likes.length;

    let liked = false;
    const userId = req.user?.id || req.user?._id;
    if (userId) {
      const uid = String(userId);
      liked = likes.some((u) => String(u) === uid);
    }

    return res.json({ count, liked });
  } catch (e) {
    return res.status(500).json({ error: 'Internal error' });
  }
});

/**
 * POST /items/:id/like
 * Требует auth (сессия или Bearer).
 * Ставит лайк текущего пользователя.
 */
router.post('/items/:id/like', ensureAuthRequiredLite, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ error: 'Not found' });

    if (!Array.isArray(item.likes)) item.likes = [];

    const uid = String(userId);
    const already = item.likes.some((u) => String(u) === uid);
    if (!already) {
      item.likes.push(userId);
      await item.save();
    }

    return res.json({ ok: true, count: item.likes.length, liked: true });
  } catch (e) {
    return res.status(500).json({ error: 'Internal error' });
  }
});

/**
 * DELETE /items/:id/like
 * Требует auth (сессия или Bearer).
 * Убирает лайк текущего пользователя.
 */
router.delete('/items/:id/like', ensureAuthRequiredLite, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ error: 'Not found' });

    const uid = String(userId);
    item.likes = (item.likes || []).filter((u) => String(u) !== uid);
    await item.save();

    return res.json({ ok: true, count: item.likes.length, liked: false });
  } catch (e) {
    return res.status(500).json({ error: 'Internal error' });
  }
});

export default router;
