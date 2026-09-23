import mongoose from 'mongoose'
import { PET_TYPE_IDS, SERVICE_IDS, SLOT_IDS, WEEKDAYS } from '../utils/constants.js'
import { toClientJSON } from './plugins.js'

const state = { type: String, enum: ['none', 'pending', 'verified'], default: 'none' }
const verification = new mongoose.Schema({ id: state, phone: state, background: state }, { _id: false })
const availability = new mongoose.Schema(
  { days: [{ type: String, enum: WEEKDAYS }], slots: [{ type: String, enum: SLOT_IDS }] },
  { _id: false }
)

const walkerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true }, // null = sample profile
    name: { type: String, required: true, trim: true },
    tone: { type: Number, default: 0 },
    photo: { type: String, default: null },
    active: { type: Boolean, default: true },
    city: { type: String, required: true, trim: true },
    area: { type: String, required: true, trim: true },
    headline: { type: String, required: true, trim: true, maxlength: 140 },
    bio: { type: String, required: true, trim: true, maxlength: 1200 },
    experienceYears: { type: Number, min: 0, max: 50, default: 0 },
    price: { type: Number, min: 0, max: 1000, required: true }, // rupees per hour, 0 = free volunteer
    services: [{ type: String, enum: SERVICE_IDS }],
    petTypes: [{ type: String, enum: PET_TYPE_IDS }],
    availability: { type: availability, required: true },
    languages: { type: [String], default: ['English', 'Hindi'] },
    responseTime: { type: String, default: 'New on PawMate' },
    verification: { type: verification, default: () => ({}) },
    idFileName: { type: String, default: '' },
    idFilePath: { type: String, select: false }, // private: never sent to the browser
    rating: { type: Number, default: 0 },
    ratingSum: { type: Number, default: 0, select: false },
    reviewCount: { type: Number, default: 0 },
    completedJobs: { type: Number, default: 0 },
    joined: { type: String }, // YYYY-MM
  },
  { timestamps: true }
)
walkerSchema.index({ active: 1, city: 1, area: 1 })
toClientJSON(walkerSchema)

export const Walker = mongoose.model('Walker', walkerSchema)
