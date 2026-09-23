import { config } from '../config.js'
import { HttpError } from '../utils/httpError.js'

export function notFoundHandler(req, res) {
  res.status(404).json({ error: { message: `No route for ${req.method} ${req.originalUrl}` } })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: { message: err.message, details: err.details } })
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: { message: 'That already exists.' } })
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: { message: 'That file is too large. Please choose one under 5 MB.' } })
  }
  if (err.name === 'MulterError') {
    return res.status(400).json({ error: { message: 'The file could not be uploaded.' } })
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: { message: 'That request is too large.' } })
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { message: 'The request body is not valid JSON.' } })
  }
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(400).json({ error: { message: 'Some of the details are not valid.' } })
  }
  if (!config.isTest) console.error(err)
  return res.status(500).json({ error: { message: 'Something went wrong on our side. Please try again.' } })
}
