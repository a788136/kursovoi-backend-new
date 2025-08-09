import cors from 'cors';
import { loadEnv } from './env.js';

const { CLIENT_ORIGINS } = loadEnv();

/** Поддержка масок вида https://app-*.vercel.app */
function matchOrigin(origin, patterns) {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    const o = `${url.protocol}//${url.host}`;
    return patterns.some(p => {
      const u = new URL(p.replace('*', 'example')); // проверка формата
      const pattern = p.replace(/\./g, '\\.').replace(/\*/g, '.*');
      const re = new RegExp('^' + pattern + '$', 'i');
      return re.test(o);
    });
  } catch {
    return false;
  }
}

export const corsMiddleware = cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // прямые curl/health
    const allowed = matchOrigin(origin, CLIENT_ORIGINS);
    if (allowed) return callback(null, true);
    console.warn('[CORS] Blocked origin:', origin, 'Allowed:', CLIENT_ORIGINS);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});
