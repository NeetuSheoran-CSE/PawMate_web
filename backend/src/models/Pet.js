import mongoose from 'mongoose'
import { PET_TYPE_IDS } from '../utils/constants.js'
import { toClientJSON } from './plugins.js'

const petSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    type: { type: String, enum: PET_TYPE_IDS, required: true },
    breed: { type: String, required: true, trim: true, maxlength: 80 },
    age: { type: Number, min: 0, max: 30, required: true },
    vaccinated: { type: Boolean, default: true },
    instructions: { type: String, trim: true, maxlength: 1000, default: '' },
  },
  { timestamps: true }
)
toClientJSON(petSchema)

export const Pet = mongoose.model('Pet', petSchema)
