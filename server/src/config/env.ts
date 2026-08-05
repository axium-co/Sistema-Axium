import 'dotenv/config';

export const env = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'axium-jwt-secret-dev',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CORS_ORIGIN:
    process.env.CORS_ORIGIN ||
    'http://localhost:5173,https://sistema.axiumcompany.com.br',
};
