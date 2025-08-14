// src/app.js
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import passport from 'passport';
import 'dotenv/config';

// Passport стратегии (оставляем твои, ничего не удаляю)
import './config/passport.js';

// Роуты проекта (оставляю все твои)
import authRouter from './routes/auth.js';
import itemsRouter from './routes/items.js';

// Новый, исправленный роутер лайков (только он меняется)
import likesRouter from './routes/likes.js';

const app = express();

// === MongoDB подключение (для твоего лога и работы моделей) ===
const mongoUrl = process.env.MONGO_URI || '';
if (!mongoUrl) {
  throw new Error('MONGO_URI не задан. Укажи строку подключения к MongoDB в переменных окружения.');
}
mongoose
  .connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('[db] connected'))
  .catch((err) => {
    console.error('[db] connection error:', err);
    process.exit(1);
  });

// === Базовые мидлвары ===
app.use(morgan('combined'));
app.use(express.json());
app.use(cookieParser());

// === CORS ===
// В .env: CLIENT_URL=https://kursovaia-frontend.vercel.app,https://kursovaia-frontend-new-x29c.vercel.app,http://localhost:5173
const clientList = (process.env.CLIENT_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || clientList.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin ${origin}`));
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

// === Сессии (оставляю твою сессию, только убеждаюсь, что она на MongoStore) ===
const isProd = process.env.NODE_ENV === 'production' || !!process.env.RENDER;
app.set('trust proxy', 1);

app.use(
  session({
    name: 'sid',
    secret: process.env.SESSION_SECRET || 'change_me',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl,
      ttl: 60 * 60 * 24 * 7, // 7 дней
    }),
    cookie: {
      httpOnly: true,
      secure: isProd,                // в проде только через https
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

// === Passport (оставляю как было) ===
app.use(passport.initialize());
app.use(passport.session());

// === Роуты проекта (оставляю твоё подключение) ===
app.use('/auth', authRouter);
app.use('/items', itemsRouter);

// === Лайки: подключаем НОВЫЙ роутер как конечные маршруты ===
// ВАЖНО: тут мы НЕ используем твой старый ensureAuth с passport.authenticate('jwt')
// чтобы не было 500 "Unknown authentication strategy 'jwt'".
app.get('/items/:id/likes', likesRouter);
app.post('/items/:id/like', likesRouter);
app.delete('/items/:id/like', likesRouter);

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

export default app;
