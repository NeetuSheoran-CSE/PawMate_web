import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { objectIdParam, validate } from '../middleware/validate.js'
import { Pet } from '../models/Pet.js'
import { notFound } from '../utils/httpError.js'
import { PET_TYPE_IDS } from '../utils/constants.js'

const router = Router()
router.use(requireAuth, requireRole('owner', 'both'))

const petSchema = z.object({
  name: z.string().trim().min(1, 'Pet name is required').max(60),
  type: z.enum(PET_TYPE_IDS),
  breed: z.string().trim().min(1, 'Breed is required').max(80),
  age: z.coerce.number().min(0).max(30),
  vaccinated: z.boolean().optional(),
  instructions: z.string().trim().max(1000).optional(),
})

router.get('/', async (req, res) => {
  res.json({ pets: await Pet.find({ ownerId: req.user._id }).sort({ createdAt: 1 }) })
})

router.post('/', validate(petSchema), async (req, res) => {
  const pet = await Pet.create({ ...req.valid.body, ownerId: req.user._id })
  res.status(201).json({ pet })
})

router.put('/:id', objectIdParam(), validate(petSchema), async (req, res) => {
  const pet = await Pet.findOneAndUpdate({ _id: req.params.id, ownerId: req.user._id }, { $set: req.valid.body }, { returnDocument: 'after' })
  if (!pet) throw notFound('Pet not found.')
  res.json({ pet })
})

router.delete('/:id', objectIdParam(), async (req, res) => {
  const result = await Pet.deleteOne({ _id: req.params.id, ownerId: req.user._id })
  if (!result.deletedCount) throw notFound('Pet not found.')
  res.status(204).end()
})

export default router
