// src/middleware/optionalAuthLite.js
import jwt from 'jsonwebtoken';

/**
 * Опциональная авторизация:
 * - если есть пользователь из cookie‑сессии (passport session) → оставляем как есть
 * - если нет, пробуем Authorization: Bearer <JWT> (JWT_SECRET обязателен)
 * Ничего не требует — просто заполняет req.user, если получилось.
 */
export function optionalAuthLite(req, _res, next) {
  if (req.user) return next();

  const auth = req.headers.authorization || '';
  const [scheme, token] = auth.split(' ');

  if (scheme === 'Bearer' && token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const id = payload.sub || payload.id || payload._id || payload.userId || payload.uid;
      req.user = { id, ...payload };
    } catch {
      // тихо игнорируем — это optional
    }
  }
  next();
}

/**
 * Обязательная авторизация:
 * - допускает cookie‑сессию ИЛИ JWT
 * - если ничего нет — 401
 */
export function ensureAuthRequiredLite(req, res, next) {
  if (req.user) return next();

  const auth = req.headers.authorization || '';
  const [scheme, token] = auth.split(' ');

  if (scheme === 'Bearer' && token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const id = payload.sub || payload.id || payload._id || payload.userId || payload.uid;
      req.user = { id, ...payload };
      return next();
    } catch {
      // fallthrough
    }
  }
  return res.status(401).json({ error: 'Unauthorized' });
}
