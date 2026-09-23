import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import mongoose from 'mongoose'
import rateLimit from 'express-rate-limit'
import { config } from './config.js'
import { errorHandler, notFoundHandler } from './middleware/error.js'
import auth from './routes/auth.js'
import users from './routes/users.js'
import walkers from './routes/walkers.js'
import pets from './routes/pets.js'
import bookings from './routes/bookings.js'
import reviews from './routes/reviews.js'
import conversations from './routes/conversations.js'
import contact from './routes/contact.js'
import admin from './routes/admin.js'

export function createApp() {
  const app = express()
  if (config.isProd) app.set('trust proxy', 1) // behind Render, Railway, Nginx etc.
  app.disable('x-powered-by')

  app.use(helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'img-src': ["'self'", 'data:', 'https:'], // walker photos can be hosted anywhere over https
        'upgrade-insecure-requests': config.isProd ? [] : null, // would break http://localhost
      },
    },
    hsts: config.isProd,
  }))
  app.use(cors({
    origin(origin, cb) {
      // no Origin header means curl, Postman or a server: allow. Browsers must be on the allow-list.
      if (!origin || config.clientOrigins.includes(origin)) return cb(null, true)
      return cb(null, false)
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  }))
  app.use(express.json({ limit: '100kb' }))
  if (!config.isTest) app.use(morgan(config.isProd ? 'combined' : 'dev'))

  const limit = (windowMs, max, message) =>
    rateLimit({ windowMs, limit: config.isTest ? 100000 : max, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: { message } } })

  app.use('/api', limit(15 * 60 * 1000, config.rateLimitMax, 'Too many requests. Please slow down.'))
  app.get('/api/health', (_req, res) => res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }))

  app.use('/api/auth', limit(15 * 60 * 1000, config.authRateLimitMax, 'Too many attempts. Please try again in a few minutes.'), auth)
  app.use('/api/users', users)
  app.use('/api/walkers', walkers)
  app.use('/api/pets', pets)
  app.use('/api/bookings', bookings)
  app.use('/api/reviews', reviews)
  app.use('/api/conversations', conversations)
  app.use('/api/contact', limit(60 * 60 * 1000, 10, 'You have sent a lot of messages. Please try again later.'), contact)
  app.use('/api/admin', admin)

  // Optional: serve the built React app from this same server (one deployment instead of two)
  if (config.serveClient && fs.existsSync(path.join(config.clientDist, 'index.html'))) {
    app.use(express.static(config.clientDist, { index: false, maxAge: '1h' }))
    app.get('/{*splat}', (req, res, next) => (req.path.startsWith('/api') ? next() : res.sendFile(path.join(config.clientDist, 'index.html'))))
  }

  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}
