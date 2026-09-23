import mongoose from 'mongoose'
import { badRequest } from '../utils/httpError.js'

/** validate(schema, 'body' | 'query' | 'params') puts the cleaned data on req.valid[source]. */
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source])
  if (!result.success) {
    const issues = result.error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
    const first = issues[0]
    throw badRequest(first?.field ? `${first.field}: ${first.message}` : first?.message || 'Invalid request.', issues)
  }
  req.valid = { ...(req.valid || {}), [source]: result.data }
  next()
}

/** Rejects malformed ids early so they never reach the database. */
export const objectIdParam = (name = 'id') => (req, _res, next) => {
  if (!mongoose.isValidObjectId(req.params[name])) throw badRequest('That link does not look right.')
  next()
}
