import cors from 'cors';
import { loadEnv } from './env.js';

const { CLIENT_ORIGINS } = loadEnv();

// Проверка origin по маске. Сравниваем целиком "protocol//host".
function isAllowed(origin) {
  if (!origin) return false;
  try {
    const u = new URL(origin);
    const candidate = `${u.protocol}//${u.host}`; // например, https://site.vercel.app

    return CLIENT_ORIGINS.some(pattern => {
      // pattern типа "https://app-*.vercel.app"
      const re = new RegExp(
        '^' +
          pattern
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*') +
        '$',
        'i'
      );
      return re.test(candidate);
    });
  } catch {
    return false;
  }
}

export const corsMiddleware = cors({
  // ВАЖНО: возвращаем конкретный origin (а не '*'), когда он разрешён
  origin(origin, cb) {
    // Для запросов без Origin (curl/health) CORS не нужен — пропускаем
    if (!origin) return cb(null, true);

    if (isAllowed(origin)) {
      return cb(null, origin);
    }

    console.warn('[CORS] Blocked origin:', origin, '| Allowed:', CLIENT_ORIGINS);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie'],
  optionsSuccessStatus: 204, // чтобы старые браузеры/прокси не спотыкались
});
