export class HttpError extends Error {
  constructor(status, message, details) {
    super(message)
    this.status = status
    this.details = details
  }
}

export const badRequest = (m, d) => new HttpError(400, m, d)
export const unauthorized = m => new HttpError(401, m || 'Please log in to continue.')
export const forbidden = m => new HttpError(403, m || 'You do not have permission to do that.')
export const notFound = m => new HttpError(404, m || 'Not found.')
export const conflict = m => new HttpError(409, m)
