import { Router } from 'express'
import crypto from 'node:crypto'
import { z } from 'zod'
import { config } from '../config.js'
import { objectIdParam, validate } from '../middleware/validate.js'
import { Walker } from '../models/Walker.js'
import { notFound } from '../utils/httpError.js'
import { publicWalker } from '../utils/serialize.js'

const router = Router()

/** Minimal admin access for reviewing IDs. Off unless ADMIN_TOKEN is set. Replace with real admin accounts later. */
router.use((req, res, next) => {
  const given = Buffer.from(String(req.headers['x-admin-token'] || ''))
  const real = Buffer.from(config.adminToken)
  const ok = config.adminToken && given.length === real.length && crypto.timingSafeEqual(given, real)
  if (!ok) return res.status(404).json({ error: { message: 'Not found.' } })
  return next()
})

const state = z.enum(['none', 'pending', 'verified'])

router.patch('/walkers/:id/verification', objectIdParam(), validate(z.object({ id: state.optional(), phone: state.optional(), background: state.optional() })), async (req, res) => {
  const walker = await Walker.findById(req.params.id)
  if (!walker) throw notFound('Walker not found.')
  for (const [k, v] of Object.entries(req.valid.body)) walker.verification[k] = v
  await walker.save()
  res.json({ walker: publicWalker(walker) })
})

export default router
