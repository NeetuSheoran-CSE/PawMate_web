import { config } from '../config.js'
import { WEEKDAYS } from './constants.js'

/** Today's date as YYYY-MM-DD in the app's timezone (India by default). */
export function todayISO(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: config.timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

/** Weekday name (Mon..Sun) for a YYYY-MM-DD string. */
export function weekdayOf(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return WEEKDAYS[(day + 6) % 7]
}

export function isRealDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
}
