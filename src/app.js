import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';

import { corsMiddleware } from './config/cors.js';
import { connectDB } from './config/db.js';
import { sessionStore, sessionConfig } from './config/session.js';

import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import { bootstrapAdmin } from './lib/bootstrapAdmin.js';
import { loadEnv } from './config/env.js';

const app = express();

// Подключение БД и возможный автосоздание админа
connectDB().then(bootstrapAdmin).catch(console.error);

// Для корректных secure‑cookies за прокси
app.set('trust proxy', 1);

// Базовые мидлвары
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// CORS — строго ДО сессий и роутов
app.use(corsMiddleware);
app.options('*', corsMiddleware);

// Сессии (SameSite=None; Secure)
app.use(session({
  ...sessionConfig,
  store: sessionStore,
}));

// Технич. эндпоинты (уберут 404 HEAD / в логах)
app.head('/', (req, res) => res.sendStatus(200));
app.get('/', (req, res) => res.status(200).json({ ok: true, name: 'auth-backend', version: '1.0.0' }));
app.get('/favicon.ico', (req, res) => res.sendStatus(204));

// Основные роуты
app.use('/auth', authRoutes);
app.use('/users', usersRoutes);

// Health
app.get('/health', (req, res) => res.status(200).json({ ok: true }));

// Глобальный обработчик ошибок
const { NODE_ENV } = loadEnv();
app.use((err, req, res, next) => {
  // Ошибка от cors(origin) — сделаем явный 403
  if (err && err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS: origin not allowed' });
  }

  console.error('[error]', err);
  const status = err.status || 500;
  res.status(status).json({
    error: NODE_ENV === 'production' ? 'Internal error' : err.message,
  });
});

export default app;
