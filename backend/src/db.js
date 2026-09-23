import mongoose from 'mongoose'
import { config } from './config.js'
import { Booking } from './models/Booking.js'

mongoose.set('strictQuery', true)

export async function connectDb(uri = config.mongoUri) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 })
  await ensureIndexes()
  return mongoose.connection
}

/**
 * Two active bookings (Pending or Accepted) can never share the same walker, date and slot.
 * A partial unique index enforces this even when two requests arrive at the same moment.
 * Some MongoDB-compatible servers do not support partial indexes, so a failure here is only a warning.
 */
async function ensureIndexes() {
  try {
    await Booking.collection.createIndex(
      { walkerId: 1, date: 1, slot: 1 },
      { unique: true, partialFilterExpression: { status: { $in: ['Pending', 'Accepted'] } }, name: 'one_active_booking_per_slot' }
    )
  } catch (err) {
    console.warn(`[db] Could not create the slot-uniqueness index (${err.message}). The API still checks slots in code.`)
  }
}

export const disconnectDb = () => mongoose.disconnect()
