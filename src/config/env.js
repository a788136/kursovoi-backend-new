import dotenv from 'dotenv';
dotenv.config();

export function loadEnv() {
  const {
    NODE_ENV = 'development',
    PORT = '10000',
    MONGO_URI,
    SESSION_SECRET,
    CLIENT_URL,
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
    ADMIN_NAME = 'Admin'
  } = process.env;

  if (!MONGO_URI) throw new Error('MONGO_URI is required');
  if (!SESSION_SECRET) throw new Error('SESSION_SECRET is required');
  if (!CLIENT_URL) throw new Error('CLIENT_URL is required');

  // Только домены, без путей. Можно маски для превью: https://app-*.vercel.app
  const CLIENT_ORIGINS = CLIENT_URL
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  return {
    NODE_ENV,
    PORT: Number(PORT),
    MONGO_URI,
    SESSION_SECRET,
    CLIENT_ORIGINS,
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
    ADMIN_NAME
  };
}
