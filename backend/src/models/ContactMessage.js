import mongoose from 'mongoose'

const contactSchema = new mongoose.Schema(
  {
    ticket: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: String,
    email: String,
    topic: String,
    message: String,
  },
  { timestamps: true }
)

export const ContactMessage = mongoose.model('ContactMessage', contactSchema)
