import mongoose from 'mongoose'
import { ROLES } from '../utils/constants.js'
import { toClientJSON } from './plugins.js'

const contact = new mongoose.Schema(
  { name: { type: String, trim: true }, phone: { type: String, trim: true }, relation: { type: String, trim: true } },
  { _id: false }
)
const vet = new mongoose.Schema({ name: { type: String, trim: true }, phone: { type: String, trim: true } }, { _id: false })

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true },
    phone: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    bio: { type: String, trim: true, maxlength: 500, default: '' },
    emergencyContact: { type: contact, default: null },
    vet: { type: vet, default: null },
    isDemo: { type: Boolean, default: false }, // sample people that "reply" in chat during development
  },
  { timestamps: true }
)
toClientJSON(userSchema)
contact.plugin(toClientJSON)
vet.plugin(toClientJSON)

export const User = mongoose.model('User', userSchema)
