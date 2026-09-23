import { z } from 'zod'
import { Walker } from '../models/Walker.js'

export const same = (a, b) => a != null && b != null && String(a) === String(b)
export const getMyWalker = user => Walker.findOne({ userId: user._id })

const phoneRe = /^(?:\+?91)?[6-9]\d{9}$/
export const phoneField = z.string().trim().refine(v => phoneRe.test(v.replace(/[\s-]/g, '')), 'Enter a valid 10-digit mobile number')
export const objectIdField = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id')

export const shortName = full => {
  const [first, last] = String(full).trim().split(/\s+/)
  return last ? `${first} ${last[0].toUpperCase()}.` : first
}
