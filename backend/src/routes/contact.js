import { Router } from 'express'
import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { config } from '../config.js'
import { validate } from '../middleware/validate.js'
import { ContactMessage } from '../models/ContactMessage.js'
import { CONTACT_TOPICS } from '../utils/constants.js'

const router = Router()

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  topic: z.enum(CONTACT_TOPICS),
  message: z.string().trim().min(20, 'Message needs at least 20 characters').max(3000),
})

router.post('/', validate(schema), async (req, res) => {
  // logged-in users get their account linked to the ticket; guests are welcome too
  let userId = null
  const header = req.headers.authorization || ''
  if (header.startsWith('Bearer ')) {
    try { userId = jwt.verify(header.slice(7), config.jwtSecret).sub } catch { /* guest */ }
  }
  for (let attempt = 0; attempt < 5; attempt++) {
    const ticket = `PM-${crypto.randomInt(100000, 999999)}`
    try {
      await ContactMessage.create({ ...req.valid.body, ticket, userId })
      return res.status(201).json({ ticket })
    } catch (err) {
      if (err.code !== 11000) throw err
    }
  }
  throw new Error('Could not create a ticket')
})

export default router
