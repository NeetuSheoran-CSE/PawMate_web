import mongoose from 'mongoose'
import { PAY_METHODS, PET_TYPE_IDS, SERVICE_IDS, SLOT_IDS } from '../utils/constants.js'
import { toClientJSON } from './plugins.js'

const contact = new mongoose.Schema({ name: String, phone: String, relation: String }, { _id: false })
const vet = new mongoose.Schema({ name: String, phone: String }, { _id: false })
const historyItem = new mongoose.Schema(
  { status: String, at: { type: Date, default: Date.now }, by: { type: String, enum: ['owner', 'walker'] } },
  { _id: false }
)

const bookingSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ownerName: String,
    ownerPhone: String,
    walkerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Walker', required: true, index: true },
    walkerName: String,

    // Snapshot of the pet at booking time, so later edits or deletes don't rewrite history
    petId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet' },
    petName: String,
    petType: { type: String, enum: PET_TYPE_IDS },
    petBreed: String,
    petInstructions: String,

    service: { type: String, enum: SERVICE_IDS, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    slot: { type: String, enum: SLOT_IDS, required: true },
    hours: { type: Number, required: true },
    address: String,
    instructions: { type: String, default: '' },
    emergency: { type: contact, default: null },
    vet: { type: vet, default: null },

    price: Number, // hourly rate at booking time
    subtotal: Number,
    fee: Number,
    total: Number,
    payMethod: { type: String, enum: [...PAY_METHODS, 'free'] },
    cardLast4: String, // the full card number is never sent to or stored by this server
    paymentStatus: { type: String, default: 'Authorized' },

    status: { type: String, enum: ['Pending', 'Accepted', 'Completed', 'Cancelled'], default: 'Pending', index: true },
    statusHistory: [historyItem],
    cancelReason: String,
    cancelledBy: { type: String, enum: ['owner', 'walker'] },
    reviewed: { type: Boolean, default: false },
  },
  { timestamps: true }
)
bookingSchema.index({ walkerId: 1, date: 1, slot: 1 })
toClientJSON(bookingSchema)

export const Booking = mongoose.model('Booking', bookingSchema)
