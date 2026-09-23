import mongoose from 'mongoose'
import { toClientJSON } from './plugins.js'

const message = new mongoose.Schema({
  from: { type: String, enum: ['owner', 'walker'], required: true },
  text: { type: String, required: true, trim: true, maxlength: 500 },
  at: { type: Date, default: Date.now },
})
toClientJSON(message)

const conversationSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ownerName: String,
    walkerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Walker', required: true },
    walkerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true }, // null for sample walkers
    walkerName: String,
    messages: [message],
  },
  { timestamps: true }
)
conversationSchema.index({ ownerId: 1, walkerId: 1 }, { unique: true })
toClientJSON(conversationSchema)

export const Conversation = mongoose.model('Conversation', conversationSchema)
