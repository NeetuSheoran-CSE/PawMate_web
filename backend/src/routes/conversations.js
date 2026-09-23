import { Router } from 'express'
import { z } from 'zod'
import { config } from '../config.js'
import { requireAuth } from '../middleware/auth.js'
import { objectIdParam, validate } from '../middleware/validate.js'
import { Booking } from '../models/Booking.js'
import { Conversation } from '../models/Conversation.js'
import { User } from '../models/User.js'
import { Walker } from '../models/Walker.js'
import { forbidden, notFound } from '../utils/httpError.js'
import { objectIdField, same } from '../utils/helpers.js'

const router = Router()
router.use(requireAuth)

const sideOf = (conv, user) => (same(conv.ownerId, user._id) ? 'owner' : same(conv.walkerUserId, user._id) ? 'walker' : null)

function shape(conv, user) {
  const as = sideOf(conv, user)
  const json = conv.toJSON()
  json.messages = json.messages.slice(-200)
  return { ...json, as, otherName: as === 'owner' ? json.walkerName : json.ownerName, last: json.messages.at(-1) || null }
}

async function loadFor(id, user) {
  const conv = await Conversation.findById(id)
  if (!conv) throw notFound('Conversation not found.')
  if (!sideOf(conv, user)) throw forbidden()
  return conv
}

router.get('/', async (req, res) => {
  const list = await Conversation.find({ $or: [{ ownerId: req.user._id }, { walkerUserId: req.user._id }] })
  const shaped = list.map(c => shape(c, req.user))
  shaped.sort((a, b) => String(b.last?.at || b.updatedAt).localeCompare(String(a.last?.at || a.updatedAt)))
  res.json({ conversations: shaped })
})

const startSchema = z.object({ walkerId: objectIdField, ownerId: objectIdField.optional() })

router.post('/', validate(startSchema), async (req, res) => {
  const walker = await Walker.findById(req.valid.body.walkerId)
  if (!walker) throw notFound('Walker not found.')

  let ownerId = req.user._id
  if (same(walker.userId, req.user._id)) {
    // a walker can message an owner once that owner has sent them a request
    ownerId = req.valid.body.ownerId
    if (!ownerId || !(await Booking.exists({ ownerId, walkerId: walker._id }))) {
      throw forbidden('You can message owners once they send you a request.')
    }
  } else if (!['owner', 'both'].includes(req.user.role)) {
    throw forbidden('Your account type cannot start a chat.')
  }

  const owner = await User.findById(ownerId)
  if (!owner) throw notFound('Owner not found.')

  let conv = await Conversation.findOne({ ownerId: owner._id, walkerId: walker._id })
  if (!conv) {
    try {
      conv = await Conversation.create({ ownerId: owner._id, ownerName: owner.name, walkerId: walker._id, walkerName: walker.name, walkerUserId: walker.userId })
    } catch (err) {
      if (err.code !== 11000) throw err
      conv = await Conversation.findOne({ ownerId: owner._id, walkerId: walker._id })
    }
  }
  res.json({ conversation: shape(conv, req.user) })
})

router.get('/:id', objectIdParam(), async (req, res) => {
  res.json({ conversation: shape(await loadFor(req.params.id, req.user), req.user) })
})

router.post('/:id/messages', objectIdParam(), validate(z.object({ text: z.string().trim().min(1).max(500) })), async (req, res) => {
  const conv = await loadFor(req.params.id, req.user)
  const from = sideOf(conv, req.user)
  const updated = await Conversation.findByIdAndUpdate(conv._id, { $push: { messages: { from, text: req.valid.body.text, at: new Date() } } }, { returnDocument: 'after' })
  maybeDemoReply(updated, from)
  res.status(201).json({ conversation: shape(updated, req.user) })
})

/**
 * Development helper: sample walkers and sample owners have no real person behind them,
 * so they send a friendly canned reply. Turn it off with DEMO_REPLIES=false.
 */
async function maybeDemoReply(conv, from) {
  if (!config.demoReplies) return
  try {
    const demo = from === 'owner' ? !conv.walkerUserId : !!(await User.findById(conv.ownerId).select('isDemo'))?.isDemo
    if (!demo) return
    const replies = from === 'owner'
      ? ['Sounds good! I will make sure everything is done as you described.', 'Thanks for the details. I am happy to help.', 'Got it! Feel free to share anything else about your pet.']
      : ['Thank you, that works for us!', 'Great, thanks for letting me know.', 'Perfect. See you then!']
    const timer = setTimeout(() => {
      Conversation.updateOne(
        { _id: conv._id },
        { $push: { messages: { from: from === 'owner' ? 'walker' : 'owner', text: replies[Math.floor(Math.random() * replies.length)], at: new Date() } } }
      ).catch(() => {})
    }, 1500)
    timer.unref?.()
  } catch { /* the demo reply is optional */ }
}

export default router
