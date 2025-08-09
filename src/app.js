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
connectDB().then(bootstrapAdmin).catch(console.error);

app.set('trust proxy', 1);
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.use(corsMiddleware);
app.options('*', corsMiddleware);

app.use(session({
  ...sessionConfig,
  store: sessionStore
}));

app.get('/health', (req, res) => res.status(200).json({ ok: true }));

app.use('/auth', authRoutes);
app.use('/users', usersRoutes);

const { NODE_ENV } = loadEnv();
app.use((err, req, res, next) => {
  console.error('[error]', err);
  const status = err.status || 500;
  res.status(status).json({
    error: NODE_ENV === 'production' ? 'Internal error' : err.message
  });
});

export default app;
