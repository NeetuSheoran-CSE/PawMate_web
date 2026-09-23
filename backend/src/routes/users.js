import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { Walker } from '../models/Walker.js'
import { Conversation } from '../models/Conversation.js'
import { getMyWalker, phoneField } from '../utils/helpers.js'
import { publicUser } from '../utils/serialize.js'

const router = Router()
router.use(requireAuth)

const optionalPhone = phoneField.or(z.literal(''))

const patchSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: phoneField.optional(),
  city: z.string().trim().min(1).max(80).optional(),
  bio: z.string().trim().max(500).optional(),
  emergencyContact: z
    .object({ name: z.string().trim().min(1).max(80), phone: phoneField, relation: z.string().trim().min(1).max(40) })
    .nullable()
    .optional(),
  vet: z.object({ name: z.string().trim().min(1).max(120), phone: optionalPhone.optional() }).nullable().optional(),
})

router.patch('/me', validate(patchSchema), async (req, res) => {
  const user = req.user
  Object.assign(user, req.valid.body)
  await user.save()

  if (req.valid.body.name) {
    // keep the names shown on walker cards and chats in step with the account name
    await Walker.updateMany({ userId: user._id }, { $set: { name: user.name } })
    await Conversation.updateMany({ ownerId: user._id }, { $set: { ownerName: user.name } })
    await Conversation.updateMany({ walkerUserId: user._id }, { $set: { walkerName: user.name } })
  }
  res.json({ user: publicUser(user, await getMyWalker(user)) })
})

router.post('/me/roles', validate(z.object({ role: z.enum(['owner', 'walker']) })), async (req, res) => {
  if (req.user.role !== req.valid.body.role) req.user.role = 'both'
  await req.user.save()
  res.json({ user: publicUser(req.user, await getMyWalker(req.user)) })
})

export default router
