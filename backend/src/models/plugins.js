import mongoose from 'mongoose'

/**
 * Makes every model's JSON look the way the React app expects:
 * `_id` becomes a string `id`, ObjectId references become strings, and internals are hidden.
 */
export function toClientJSON(schema) {
  schema.set('toJSON', {
    transform(_doc, ret) {
      if (ret._id != null) ret.id = String(ret._id)
      delete ret._id
      delete ret.__v
      delete ret.passwordHash
      delete ret.idFilePath
      delete ret.ratingSum
      for (const key of Object.keys(ret)) {
        if (ret[key] instanceof mongoose.Types.ObjectId) ret[key] = String(ret[key])
      }
      return ret
    },
  })
}
