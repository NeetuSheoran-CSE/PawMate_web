import { PLATFORM_FEE_RATE, WEEKDAYS } from '../data/constants.js'

export const formatINR = n => `₹${Number(n || 0).toLocaleString('en-IN')}`
export const pad = n => String(n).padStart(2, '0')
export const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const parseISO = s => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const todayISO = () => toISO(new Date())
export const addDays = (d, n) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
export const weekdayOf = d => WEEKDAYS[(d.getDay() + 6) % 7]

export const formatDate = (iso, opts = { weekday: 'short', day: 'numeric', month: 'short' }) =>
  parseISO(iso).toLocaleDateString('en-IN', opts)
export const formatDateTime = iso =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
export const formatTime = iso =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
export const formatMonthYear = d => d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

export const initials = (name = '?') =>
  name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase()).join('')

export function daysSummary(days = []) {
  if (days.length === 7) return 'Every day'
  const set = new Set(days)
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  if (days.length === 5 && weekdays.every(d => set.has(d))) return 'Mon – Fri'
  if (days.length === 2 && set.has('Sat') && set.has('Sun')) return 'Weekends'
  return WEEKDAYS.filter(d => set.has(d)).join(', ')
}

export function priceBreakdown(rate, hours) {
  const subtotal = rate * hours
  const fee = rate === 0 ? 0 : Math.round(subtotal * PLATFORM_FEE_RATE)
  return { subtotal, fee, total: subtotal + fee }
}

export const formatCard = v =>
  v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
export const formatExpiry = v => {
  const d = v.replace(/\D/g, '').slice(0, 4)
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
}
