// Every validator returns an error message, or '' when the value is fine.
export const required = label => v =>
  Array.isArray(v) ? (v.length ? '' : `Choose at least one ${label.toLowerCase()}`) : String(v ?? '').trim() ? '' : `${label} is required`

export const minLength = (n, label) => v =>
  String(v ?? '').trim().length >= n ? '' : `${label} needs at least ${n} characters`

export const email = v =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v ?? '').trim()) ? '' : 'Enter a valid email address'

export const phone = v =>
  /^(?:\+?91)?[6-9]\d{9}$/.test(String(v ?? '').replace(/[\s-]/g, '')) ? '' : 'Enter a valid 10-digit mobile number'

export const password = v =>
  String(v ?? '').length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v)
    ? ''
    : 'Use at least 8 characters with a letter and a number'

export const numberBetween = (min, max, label) => v => {
  const n = Number(v)
  return v !== '' && !Number.isNaN(n) && n >= min && n <= max ? '' : `${label} must be between ${min} and ${max}`
}

export const upiId = v => (/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(String(v ?? '').trim()) ? '' : 'Enter a valid UPI ID, like name@bank')

export const cardNumber = v =>
  String(v ?? '').replace(/\s/g, '').length === 16 ? '' : 'Enter the 16-digit card number'

export const cardExpiry = v => {
  const m = /^(\d{2})\/(\d{2})$/.exec(String(v ?? ''))
  if (!m) return 'Use the MM/YY format'
  const month = Number(m[1])
  const year = 2000 + Number(m[2])
  if (month < 1 || month > 12) return 'Enter a valid month'
  const now = new Date()
  const end = new Date(year, month, 0, 23, 59)
  return end >= now ? '' : 'This card has expired'
}

export const cardCvv = v => (/^\d{3,4}$/.test(String(v ?? '')) ? '' : 'Enter the 3 or 4 digit CVV')

// Run validators in order and return the first message.
export const compose = (...fns) => (v, all) => {
  for (const fn of fns) {
    const msg = fn(v, all)
    if (msg) return msg
  }
  return ''
}

// Only run a validator when a condition on the whole form is true.
export const when = (predicate, fn) => (v, all) => (predicate(all) ? fn(v, all) : '')
