import mongoose from 'mongoose'
import { toClientJSON } from './plugins.js'

const reviewSchema = new mongoose.Schema(
  {
    walkerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Walker', required: true, index: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    ownerName: String, // shown publicly as "Riya K."
    rating: { type: Number, min: 1, max: 5, required: true },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    date: { type: String, required: true }, // YYYY-MM-DD
  },
  { timestamps: true }
)
toClientJSON(reviewSchema)

export const Review = mongoose.model('Review', reviewSchema)
