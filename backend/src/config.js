import dotenv from 'dotenv'
import path from 'node:path'

// the backend/ folder, no matter where the command is run from
const backendDir = path.resolve(import.meta.dirname, '..')

dotenv.config({ path: path.join(backendDir, '.env'), quiet: true })
const env = process.env
const isProd = env.NODE_ENV === 'production'

export const config = {
  env: env.NODE_ENV || 'development',
  isProd,
  isTest: env.NODE_ENV === 'test',
  port: Number(env.PORT) || 5000,
  mongoUri: env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pawmate',
  jwtSecret: env.JWT_SECRET || (isProd ? '' : 'dev-only-secret-change-me'),
  jwtExpiresIn: env.JWT_EXPIRES_IN || '7d',
  clientOrigins: (env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map(s => s.trim()).filter(Boolean),
  demoReplies: env.DEMO_REPLIES ? env.DEMO_REPLIES === 'true' : !isProd,
  timezone: env.APP_TIMEZONE || 'Asia/Kolkata',
  uploadDir: path.resolve(backendDir, env.UPLOAD_DIR || 'uploads'),
  adminToken: env.ADMIN_TOKEN || '',
  rateLimitMax: Number(env.RATE_LIMIT_MAX) || 600, // requests per 15 minutes per IP
  authRateLimitMax: Number(env.AUTH_RATE_LIMIT_MAX) || 30, // login/signup attempts per 15 minutes per IP
  serveClient: env.SERVE_CLIENT === 'true',
  clientDist: path.resolve(backendDir, env.CLIENT_DIST || '../frontend/dist'),
}

if (isProd && config.jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be set to a random string of at least 32 characters in production.')
}
