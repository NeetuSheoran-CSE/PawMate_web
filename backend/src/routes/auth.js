import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { User } from '../models/User.js'
import { requireAuth, signToken } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { conflict, unauthorized } from '../utils/httpError.js'
import { getMyWalker, phoneField } from '../utils/helpers.js'
import { publicUser } from '../utils/serialize.js'
import { ROLES } from '../utils/constants.js'

const router = Router()

const email = z.string().trim().toLowerCase().email('Enter a valid email address')
const password = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(72, 'Use 72 characters or fewer')
  .regex(/[A-Za-z]/, 'Include at least one letter')
  .regex(/\d/, 'Include at least one number')

const signupSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name').max(80),
  email,
  password,
  phone: phoneField.optional().or(z.literal('')),
  city: z.string().trim().max(80).optional(),
  role: z.enum(ROLES),
})
const loginSchema = z.object({ email, password: z.string().min(1, 'Password is required').max(200) })

// A throwaway hash so logins for unknown emails take as long as real ones
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12)

router.post('/signup', validate(signupSchema), async (req, res) => {
  const { name, email, password, phone, city, role } = req.valid.body
  if (await User.exists({ email })) throw conflict('An account with this email already exists. Try logging in.')
  const passwordHash = await bcrypt.hash(password, 12)
  const user = await User.create({ name, email, passwordHash, phone: phone || '', city: city || '', role })
  res.status(201).json({ token: signToken(user), user: publicUser(user, null) })
})

router.post('/login', validate(loginSchema), async (req, res) => {
  const { email, password } = req.valid.body
  const user = await User.findOne({ email }).select('+passwordHash')
  const ok = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH)
  if (!user || !ok) throw unauthorized('Incorrect email or password.')
  const walker = await getMyWalker(user)
  res.json({ token: signToken(user), user: publicUser(user, walker) })
})

router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: publicUser(req.user, await getMyWalker(req.user)) })
})

export default router
