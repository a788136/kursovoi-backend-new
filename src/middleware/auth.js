export function requireAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

export function attachUser(req, res, next) {
  req.authenticated = Boolean(req.session && req.session.userId);
  next();
}
