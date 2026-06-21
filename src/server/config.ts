// Central runtime configuration, read from environment variables.
// In dev, values fall back to sensible local defaults so the app runs out of the box.

export const isProd = process.env.NODE_ENV === 'production'

export const config = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || (isProd ? '' : 'dev-insecure-secret-change-me'),
  // How long an auth session lasts.
  jwtMaxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
  cookieName: 'chess_token',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'chess',
    password: process.env.DB_PASSWORD || 'chess',
    database: process.env.DB_NAME || 'chess',
  },
}

if (isProd && !config.jwtSecret) {
  throw new Error('JWT_SECRET must be set in production')
}
