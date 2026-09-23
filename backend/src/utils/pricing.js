import { PLATFORM_FEE_RATE } from './constants.js'

/** The server always calculates prices itself. It never trusts amounts sent by the browser. */
export function priceBreakdown(rate, hours) {
  const subtotal = rate * hours
  const fee = rate === 0 ? 0 : Math.round(subtotal * PLATFORM_FEE_RATE)
  return { subtotal, fee, total: subtotal + fee }
}
