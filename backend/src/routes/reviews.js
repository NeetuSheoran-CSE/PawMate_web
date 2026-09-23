import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { Booking } from '../models/Booking.js'
import { Review } from '../models/Review.js'
import { Walker } from '../models/Walker.js'
import { conflict, badRequest, notFound } from '../utils/httpError.js'
import { objectIdField, same, shortName } from '../utils/helpers.js'
import { todayISO } from '../utils/dates.js'

const router = Router()

const schema = z.object({
  bookingId: objectIdField,
  rating: z.coerce.number().int().min(1, 'Choose a star rating').max(5),
  text: z.string().trim().min(10, 'Write at least 10 characters').max(1000),
})

router.post('/', requireAuth, validate(schema), async (req, res) => {
  const { bookingId, rating, text } = req.valid.body
  const booking = await Booking.findById(bookingId)
  if (!booking || !same(booking.ownerId, req.user._id)) throw notFound('Booking not found.')
  if (booking.status !== 'Completed') throw badRequest('You can review a booking once it is completed.')

  // flip the flag first so a double click can never create two reviews
  const claimed = await Booking.findOneAndUpdate({ _id: booking._id, reviewed: false }, { $set: { reviewed: true } })
  if (!claimed) throw conflict('You have already reviewed this booking.')

  const review = await Review.create({
    walkerId: booking.walkerId, ownerId: req.user._id, bookingId: booking._id,
    ownerName: shortName(req.user.name), rating, text, date: todayISO(),
  })

  // one atomic increment keeps the totals right even if two reviews arrive together
  await Walker.updateOne({ _id: booking.walkerId }, { $inc: { ratingSum: rating, reviewCount: 1 } })
  const walker = await Walker.findById(booking.walkerId).select('+ratingSum')
  if (walker) {
    const avg = Math.round((walker.ratingSum / walker.reviewCount) * 10) / 10
    await Walker.updateOne({ _id: walker._id }, { $set: { rating: avg } })
  }
  res.status(201).json({ review })
})

export default router
