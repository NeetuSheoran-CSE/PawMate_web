import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { objectIdParam, validate } from '../middleware/validate.js'
import { Booking } from '../models/Booking.js'
import { Conversation } from '../models/Conversation.js'
import { Pet } from '../models/Pet.js'
import { Walker } from '../models/Walker.js'
import { badRequest, conflict, forbidden, notFound } from '../utils/httpError.js'
import { getMyWalker, objectIdField, phoneField, same } from '../utils/helpers.js'
import { isRealDate, todayISO, weekdayOf } from '../utils/dates.js'
import { priceBreakdown } from '../utils/pricing.js'
import { bookingFor } from '../utils/serialize.js'
import { BOOKING_STATUS as S, HOUR_OPTIONS, PAY_METHODS, SERVICE_IDS, SLOT_IDS } from '../utils/constants.js'

const router = Router()
router.use(requireAuth)

/* ------------------------------- list -------------------------------- */
router.get('/', validate(z.object({ as: z.enum(['owner', 'walker']) }), 'query'), async (req, res) => {
  if (req.valid.query.as === 'owner') {
    const bookings = await Booking.find({ ownerId: req.user._id }).sort({ createdAt: -1 }).limit(300)
    return res.json({ bookings: bookings.map(b => bookingFor(b, 'owner')) })
  }
  const walker = await getMyWalker(req.user)
  if (!walker) return res.json({ bookings: [] })
  const bookings = await Booking.find({ walkerId: walker._id }).sort({ createdAt: -1 }).limit(300)
  return res.json({ bookings: bookings.map(b => bookingFor(b, 'walker')) })
})

router.get('/:id', objectIdParam(), async (req, res) => {
  const booking = await Booking.findById(req.params.id)
  if (!booking) throw notFound('Booking not found.')
  const walker = await Walker.findById(booking.walkerId).select('userId')
  const isOwner = same(booking.ownerId, req.user._id)
  const isWalker = same(walker?.userId, req.user._id)
  if (!isOwner && !isWalker) throw forbidden()
  res.json({ booking: bookingFor(booking, isOwner ? 'owner' : 'walker') })
})

/* ------------------------------ create ------------------------------- */
const createSchema = z.object({
  walkerId: objectIdField,
  petId: objectIdField,
  service: z.enum(SERVICE_IDS),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a valid date'),
  slot: z.enum(SLOT_IDS),
  hours: z.coerce.number().refine(h => HOUR_OPTIONS.includes(h), 'Choose a valid duration'),
  address: z.string().trim().min(10, 'Address needs at least 10 characters').max(300),
  instructions: z.string().trim().max(1000).default(''),
  emergency: z.object({ name: z.string().trim().min(1).max(80), phone: phoneField, relation: z.string().trim().min(1).max(40) }),
  payMethod: z.enum([...PAY_METHODS, 'free']).optional(),
  cardLast4: z.string().regex(/^\d{4}$/).optional(),
})

router.post('/', requireRole('owner', 'both'), validate(createSchema), async (req, res) => {
  const b = req.valid.body

  const walker = await Walker.findById(b.walkerId)
  if (!walker || !walker.active) throw notFound('Walker not found.')
  if (same(walker.userId, req.user._id)) throw badRequest('You cannot book yourself.')

  // the pet must belong to the person booking; details come from the database, not the browser
  const pet = await Pet.findOne({ _id: b.petId, ownerId: req.user._id })
  if (!pet) throw badRequest('Choose one of your own pets.')

  if (!walker.services.includes(b.service)) throw badRequest('This walker does not offer that service.')
  if (!walker.petTypes.includes(pet.type)) throw badRequest(`${walker.name.split(' ')[0]} does not look after ${pet.type === 'other' ? 'this kind of pet' : `${pet.type}s`}.`)

  if (!isRealDate(b.date)) throw badRequest('Pick a valid date.')
  if (b.date < todayISO()) throw badRequest('Please choose a date that is not in the past.')
  if (!walker.availability.days.includes(weekdayOf(b.date))) throw badRequest('This walker does not work on that day.')
  if (!walker.availability.slots.includes(b.slot)) throw badRequest('That time slot is not offered by this walker.')

  const taken = await Booking.exists({ walkerId: walker._id, date: b.date, slot: b.slot, status: { $in: [S.PENDING, S.ACCEPTED] } })
  if (taken) throw conflict('That slot was just taken. Please choose another time.')

  const { subtotal, fee, total } = priceBreakdown(walker.price, b.hours)
  const free = walker.price === 0
  const payMethod = free ? 'free' : b.payMethod && b.payMethod !== 'free' ? b.payMethod : null
  if (!payMethod) throw badRequest('Choose a payment method.')

  try {
    const booking = await Booking.create({
      ownerId: req.user._id, ownerName: req.user.name, ownerPhone: req.user.phone,
      walkerId: walker._id, walkerName: walker.name,
      petId: pet._id, petName: pet.name, petType: pet.type, petBreed: pet.breed, petInstructions: pet.instructions,
      service: b.service, date: b.date, slot: b.slot, hours: b.hours,
      address: b.address, instructions: b.instructions, emergency: b.emergency,
      vet: req.user.vet ? { name: req.user.vet.name, phone: req.user.vet.phone } : null,
      price: walker.price, subtotal, fee, total,
      payMethod, cardLast4: payMethod === 'card' ? b.cardLast4 : undefined,
      paymentStatus: free ? 'Free' : payMethod === 'cash' ? 'Pay on completion' : 'Authorized',
      status: S.PENDING,
      statusHistory: [{ status: S.PENDING, at: new Date(), by: 'owner' }],
    })

    // make sure the two of them can chat about this booking
    const exists = await Conversation.exists({ ownerId: req.user._id, walkerId: walker._id })
    if (!exists) {
      await Conversation.create({
        ownerId: req.user._id, ownerName: req.user.name, walkerId: walker._id, walkerName: walker.name, walkerUserId: walker.userId,
      }).catch(() => {})
    }
    res.status(201).json({ booking: bookingFor(booking, 'owner') })
  } catch (err) {
    if (err.code === 11000) throw conflict('That slot was just taken. Please choose another time.')
    throw err
  }
})

/* ------------------------- change the status ------------------------- */
const statusSchema = z.object({
  status: z.enum([S.ACCEPTED, S.COMPLETED, S.CANCELLED]),
  reason: z.string().trim().max(300).optional(),
})

const TRANSITIONS = {
  [S.PENDING]: [S.ACCEPTED, S.CANCELLED],
  [S.ACCEPTED]: [S.COMPLETED, S.CANCELLED],
}

router.patch('/:id/status', objectIdParam(), validate(statusSchema), async (req, res) => {
  const { status, reason } = req.valid.body
  const booking = await Booking.findById(req.params.id)
  if (!booking) throw notFound('Booking not found.')

  const walker = await Walker.findById(booking.walkerId).select('userId')
  const isOwner = same(booking.ownerId, req.user._id)
  const isWalker = same(walker?.userId, req.user._id)
  if (!isOwner && !isWalker) throw forbidden()
  const by = isWalker ? 'walker' : 'owner'

  // only the walker accepts or completes; either side can cancel
  if ([S.ACCEPTED, S.COMPLETED].includes(status) && by !== 'walker') throw forbidden('Only the walker can do that.')
  if (status === S.CANCELLED && (reason || '').length < 3) throw badRequest('Please add a short reason.')
  if (!(TRANSITIONS[booking.status] || []).includes(status)) {
    throw conflict(`A ${booking.status.toLowerCase()} booking cannot be marked ${status.toLowerCase()}.`)
  }

  const set = { status }
  if (status === S.CANCELLED) {
    set.cancelReason = reason
    set.cancelledBy = by
    if (booking.paymentStatus === 'Authorized') set.paymentStatus = 'Refunded'
    if (booking.paymentStatus === 'Pay on completion') set.paymentStatus = 'Not charged'
  }
  if (status === S.COMPLETED && ['Authorized', 'Pay on completion'].includes(booking.paymentStatus)) set.paymentStatus = 'Paid'

  // the filter on the current status makes sure two people can't apply conflicting changes at once
  const updated = await Booking.findOneAndUpdate(
    { _id: booking._id, status: booking.status },
    { $set: set, $push: { statusHistory: { status, at: new Date(), by } } },
    { returnDocument: 'after' }
  )
  if (!updated) throw conflict('This booking was just updated. Please refresh and try again.')

  if (status === S.COMPLETED) await Walker.updateOne({ _id: booking.walkerId }, { $inc: { completedJobs: 1 } })
  res.json({ booking: bookingFor(updated, by) })
})

export default router
