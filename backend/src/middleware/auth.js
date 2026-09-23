import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { User } from '../models/User.js'
import { forbidden, unauthorized } from '../utils/httpError.js'

export const signToken = user => jwt.sign({ sub: String(user._id) }, config.jwtSecret, { expiresIn: config.jwtExpiresIn })

/** Requires `Authorization: Bearer <token>`. Puts the user on `req.user`. */
export async function requireAuth(req, _res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) throw unauthorized('Please log in to continue.')

  let payload
  try {
    payload = jwt.verify(token, config.jwtSecret)
  } catch {
    throw unauthorized('Your session has expired. Please log in again.')
  }
  const user = await User.findById(payload.sub)
  if (!user) throw unauthorized('Your session has expired. Please log in again.')
  req.user = user
  next()
}

export const requireRole = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) throw forbidden('Your account type cannot do that.')
  next()
}
