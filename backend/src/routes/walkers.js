import { Router } from 'express'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import multer from 'multer'
import { z } from 'zod'
import { config } from '../config.js'
import { requireAuth } from '../middleware/auth.js'
import { objectIdParam, validate } from '../middleware/validate.js'
import { Walker } from '../models/Walker.js'
import { Review } from '../models/Review.js'
import { Booking } from '../models/Booking.js'
import { badRequest, conflict, forbidden, notFound } from '../utils/httpError.js'
import { escapeRegex } from '../utils/escapeRegex.js'
import { getMyWalker, same } from '../utils/helpers.js'
import { publicUser, publicWalker } from '../utils/serialize.js'
import { todayISO } from '../utils/dates.js'
import { PET_TYPE_IDS, SERVICE_IDS, SLOT_IDS, WEEKDAYS } from '../utils/constants.js'

const router = Router()

/* ------------------------------ search ------------------------------ */
const flag = z.enum(['1', 'true']).optional()
const searchSchema = z.object({
  location: z.string().trim().max(100).optional(),
  petType: z.enum(PET_TYPE_IDS).optional(),
  service: z.enum(SERVICE_IDS).optional(),
  availability: z.enum(['weekdays', 'weekends', ...SLOT_IDS]).optional(),
  free: flag,
  maxPrice: z.coerce.number().min(0).max(1000).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  verified: flag,
  sort: z.enum(['recommended', 'priceLow', 'priceHigh', 'rating', 'experience']).optional(),
})

const SORTERS = {
  recommended: (a, b) => b.rating * Math.log(b.reviewCount + 2) - a.rating * Math.log(a.reviewCount + 2),
  priceLow: (a, b) => a.price - b.price,
  priceHigh: (a, b) => b.price - a.price,
  rating: (a, b) => b.rating - a.rating,
  experience: (a, b) => b.experienceYears - a.experienceYears,
}

router.get('/', validate(searchSchema, 'query'), async (req, res) => {
  const f = req.valid.query
  const query = { active: { $ne: false } }

  // every word typed must appear in the area or the city, so "sector 45 gurugram" works
  const tokens = (f.location || '').split(/[\s,]+/).filter(Boolean).slice(0, 6)
  if (tokens.length) {
    query.$and = tokens.map(t => {
      const re = new RegExp(escapeRegex(t), 'i')
      return { $or: [{ area: re }, { city: re }] }
    })
  }
  if (f.petType) query.petTypes = f.petType
  if (f.service) query.services = f.service
  if (f.availability === 'weekdays') query['availability.days'] = { $in: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] }
  else if (f.availability === 'weekends') query['availability.days'] = { $in: ['Sat', 'Sun'] }
  else if (f.availability) query['availability.slots'] = f.availability
  if (f.free) query.price = 0
  else if (f.maxPrice != null && f.maxPrice < 500) query.price = { $lte: f.maxPrice }
  if (f.minRating) query.rating = { $gte: f.minRating }
  if (f.verified) query['verification.id'] = 'verified'

  const walkers = (await Walker.find(query).limit(200)).map(publicWalker)
  res.json({ walkers: walkers.sort(SORTERS[f.sort] || SORTERS.recommended) })
})

router.get('/me', requireAuth, async (req, res) => {
  const walker = await getMyWalker(req.user)
  res.json({ walker: walker ? publicWalker(walker) : null })
})

router.get('/:id', objectIdParam(), async (req, res) => {
  const walker = await Walker.findById(req.params.id)
  if (!walker) throw notFound('Walker not found.')
  res.json({ walker: publicWalker(walker) })
})

router.get('/:id/reviews', objectIdParam(), async (req, res) => {
  const reviews = await Review.find({ walkerId: req.params.id }).sort({ date: -1, createdAt: -1 }).limit(100)
  res.json({ reviews })
})

/** Public and minimal: only which date and slot are taken, nothing about who booked. */
router.get('/:id/booked-slots', objectIdParam(), async (req, res) => {
  const bookings = await Booking.find({
    walkerId: req.params.id,
    status: { $in: ['Pending', 'Accepted'] },
    date: { $gte: todayISO() },
  }).select('date slot')
  res.json({ slots: bookings.map(b => ({ date: b.date, slot: b.slot })) })
})

/* ------------------------- create and update ------------------------ */
const profileFields = {
  city: z.string().trim().min(1, 'City is required').max(80),
  area: z.string().trim().min(1, 'Area is required').max(80),
  headline: z.string().trim().min(10, 'Headline needs at least 10 characters').max(140),
  bio: z.string().trim().min(40, 'Bio needs at least 40 characters').max(1200),
  experienceYears: z.coerce.number().min(0).max(50),
  services: z.array(z.enum(SERVICE_IDS)).min(1, 'Choose at least one service'),
  petTypes: z.array(z.enum(PET_TYPE_IDS)).min(1, 'Choose at least one pet type'),
}
const availabilitySchema = z.object({
  days: z.array(z.enum(WEEKDAYS)).min(1, 'Choose at least one day'),
  slots: z.array(z.enum(SLOT_IDS)).min(1, 'Choose at least one time slot'),
})
const priceField = z.coerce.number().refine(p => p === 0 || (p >= 50 && p <= 1000), 'Price must be free or between 50 and 1000')

const createSchema = z
  .object({
    ...profileFields,
    pricing: z.enum(['paid', 'free']),
    price: priceField.optional(),
    days: availabilitySchema.shape.days,
    slots: availabilitySchema.shape.slots,
  })
  .refine(v => v.pricing === 'free' || (v.price != null && v.price >= 50), { path: ['price'], message: 'Enter a price between 50 and 1000' })

router.post('/', requireAuth, validate(createSchema), async (req, res) => {
  if (await getMyWalker(req.user)) throw conflict('You already have a walker profile.')
  const v = req.valid.body
  const walker = await Walker.create({
    userId: req.user._id,
    name: req.user.name,
    tone: Math.floor(Math.random() * 6),
    city: v.city, area: v.area, headline: v.headline, bio: v.bio, experienceYears: v.experienceYears,
    services: v.services, petTypes: v.petTypes,
    price: v.pricing === 'free' ? 0 : v.price,
    availability: { days: v.days, slots: v.slots },
    verification: { id: 'none', phone: req.user.phone ? 'pending' : 'none', background: 'none' },
    joined: todayISO().slice(0, 7),
  })
  if (req.user.role === 'owner') {
    req.user.role = 'both'
    await req.user.save()
  }
  res.status(201).json({ walker: publicWalker(walker), user: publicUser(req.user, walker) })
})

const patchSchema = z.object({
  ...Object.fromEntries(Object.entries(profileFields).map(([k, s]) => [k, s.optional()])),
  availability: availabilitySchema.optional(),
  price: priceField.optional(),
  active: z.boolean().optional(),
})

router.patch('/:id', requireAuth, objectIdParam(), validate(patchSchema), async (req, res) => {
  const walker = await Walker.findById(req.params.id)
  if (!walker) throw notFound('Walker not found.')
  if (!same(walker.userId, req.user._id)) throw forbidden('You can only edit your own profile.')
  Object.assign(walker, req.valid.body)
  await walker.save()
  res.json({ walker: publicWalker(walker) })
})

/* --------------------- ID upload (verification) --------------------- */
const ALLOWED = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'application/pdf': '.pdf' }
const idDir = path.join(config.uploadDir, 'ids')

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      fs.mkdirSync(idDir, { recursive: true })
      cb(null, idDir)
    },
    // random names, and the extension comes from the checked mime type, never from the user's file name
    filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${ALLOWED[file.mimetype]}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => (ALLOWED[file.mimetype] ? cb(null, true) : cb(badRequest('Please upload a JPG, PNG, WebP or PDF file.'))),
})

const removeFile = p => p && fs.promises.unlink(p).catch(() => {})

router.post('/:id/verification', requireAuth, objectIdParam(), upload.single('document'), async (req, res) => {
  const file = req.file
  try {
    const walker = await Walker.findById(req.params.id).select('+idFilePath')
    if (!walker) throw notFound('Walker not found.')
    if (!same(walker.userId, req.user._id)) throw forbidden('You can only verify your own profile.')
    if (!file) throw badRequest('Please attach your ID document.')
    if (walker.verification.id === 'verified') throw conflict('Your ID is already verified.')

    await removeFile(walker.idFilePath)
    walker.idFilePath = file.path
    walker.idFileName = path.basename(file.originalname).slice(0, 120)
    walker.verification.id = 'pending'
    await walker.save()
    res.json({ walker: publicWalker(walker) })
  } catch (err) {
    await removeFile(file?.path)
    throw err
  }
})

export default router
