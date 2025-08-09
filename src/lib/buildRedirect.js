import { loadEnv } from '../config/env.js';

export function buildRedirect(path = '/') {
  const { CLIENT_ORIGINS } = loadEnv();
  const base = CLIENT_ORIGINS[0]; // первый домен из списка
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
