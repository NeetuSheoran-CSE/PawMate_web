/**
 * Offline mock of the PawMate API (no server needed).
 *
 * It has the same methods and return shapes as httpApi.js, and is used only when the app is
 * started with VITE_USE_MOCK=true. Data lives in localStorage.
 * Passwords are stored in plain text here ONLY because this is a demo.
 */
import { seedDb } from '../data/seed.js'
import { BOOKING_STATUS as S, MAX_PRICE } from '../data/constants.js'
import { priceBreakdown, todayISO } from '../utils/format.js'

const DB_KEY = 'pawmate_db_v1'
const SESSION_KEY = 'pawmate_session_v1'

let memory = null // fallback if localStorage is blocked

const wait = (ms = 350) => new Promise(r => setTimeout(r, ms))
const uid = prefix => `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

function readDb() {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  if (memory) return memory
  const db = seedDb()
  writeDb(db)
  return db
}

function writeDb(db) {
  memory = db
  try { localStorage.setItem(DB_KEY, JSON.stringify(db)) } catch { /* ignore */ }
}

const getSessionId = () => {
  try { return localStorage.getItem(SESSION_KEY) } catch { return null }
}
const setSessionId = id => {
  try { id ? localStorage.setItem(SESSION_KEY, id) : localStorage.removeItem(SESSION_KEY) } catch { /* ignore */ }
}

const hydrateWalker = w => ({ ...w, verified: w.verification?.id === 'verified' })

function publicUser(db, u) {
  if (!u) return null
  const { password, ...rest } = u
  void password
  const w = db.walkers.find(x => x.userId === u.id)
  return { ...rest, walkerId: w ? w.id : null }
}

const shortName = full => {
  const [first, last] = full.trim().split(/\s+/)
  return last ? `${first} ${last[0]}.` : first
}

const fail = message => { throw new Error(message) }

export const mockApi = {
  /* ------------------------------ auth ------------------------------ */
  async getSession() {
    await wait(120)
    const id = getSessionId()
    if (!id) return null
    const db = readDb()
    return publicUser(db, db.users.find(u => u.id === id))
  },

  async login({ email, password }) {
    await wait()
    const db = readDb()
    const u = db.users.find(x => x.email.toLowerCase() === String(email).trim().toLowerCase())
    if (!u || u.password !== password) fail('Incorrect email or password.')
    setSessionId(u.id)
    return publicUser(db, u)
  },

  async signup({ name, email, password, phone, city, role }) {
    await wait()
    const db = readDb()
    if (db.users.some(x => x.email.toLowerCase() === email.trim().toLowerCase())) {
      fail('An account with this email already exists. Try logging in.')
    }
    const u = {
      id: uid('u'), name: name.trim(), email: email.trim(), password, role, phone: phone || '', city: city || '',
      bio: '', emergencyContact: null, vet: null, createdAt: new Date().toISOString(),
    }
    db.users.push(u)
    writeDb(db)
    setSessionId(u.id)
    return publicUser(db, u)
  },

  async logout() {
    await wait(100)
    setSessionId(null)
  },

  async updateUser(id, patch) {
    await wait()
    const db = readDb()
    const u = db.users.find(x => x.id === id) || fail('User not found.')
    const allowed = ['name', 'phone', 'city', 'bio', 'emergencyContact', 'vet']
    allowed.forEach(k => { if (k in patch) u[k] = patch[k] })
    writeDb(db)
    return publicUser(db, u)
  },

  async addRole(id, role) {
    await wait()
    const db = readDb()
    const u = db.users.find(x => x.id === id) || fail('User not found.')
    if (u.role !== role) u.role = 'both'
    writeDb(db)
    return publicUser(db, u)
  },

  /* ----------------------------- walkers ----------------------------- */
  async getWalkers(f = {}) {
    await wait(450)
    const db = readDb()
    let list = db.walkers.filter(w => w.active !== false).map(hydrateWalker)

    const tokens = (f.location || '').toLowerCase().split(/[\s,]+/).filter(Boolean)
    if (tokens.length) {
      list = list.filter(w => {
        const hay = `${w.area} ${w.city}`.toLowerCase()
        return tokens.every(t => hay.includes(t))
      })
    }
    if (f.petType) list = list.filter(w => w.petTypes.includes(f.petType))
    if (f.service) list = list.filter(w => w.services.includes(f.service))
    if (f.availability) {
      list = list.filter(w => {
        const { days, slots } = w.availability
        switch (f.availability) {
          case 'weekdays': return days.some(d => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(d))
          case 'weekends': return days.some(d => ['Sat', 'Sun'].includes(d))
          default: return slots.includes(f.availability) // morning | afternoon | evening
        }
      })
    }
    if (f.free) list = list.filter(w => w.price === 0)
    else if (f.maxPrice && f.maxPrice < MAX_PRICE) list = list.filter(w => w.price <= f.maxPrice)
    if (f.minRating) list = list.filter(w => w.rating >= f.minRating)
    if (f.verified) list = list.filter(w => w.verified)

    const sorters = {
      recommended: (a, b) => b.rating * Math.log(b.reviewCount + 2) - a.rating * Math.log(a.reviewCount + 2),
      priceLow: (a, b) => a.price - b.price,
      priceHigh: (a, b) => b.price - a.price,
      rating: (a, b) => b.rating - a.rating,
      experience: (a, b) => b.experienceYears - a.experienceYears,
    }
    return list.sort(sorters[f.sort] || sorters.recommended)
  },

  async getWalker(id) {
    await wait(300)
    const w = readDb().walkers.find(x => x.id === id)
    return w ? hydrateWalker(w) : null
  },

  async getWalkerByUser(userId) {
    await wait(200)
    const w = readDb().walkers.find(x => x.userId === userId)
    return w ? hydrateWalker(w) : null
  },

  async createWalkerProfile(userId, data) {
    await wait(600)
    const db = readDb()
    const user = db.users.find(u => u.id === userId) || fail('User not found.')
    if (db.walkers.some(w => w.userId === userId)) fail('You already have a walker profile.')
    const walker = {
      id: uid('w'), userId, name: user.name, tone: Math.floor(Math.random() * 6), photo: null, active: true,
      rating: 0, reviewCount: 0, completedJobs: 0, joined: new Date().toISOString().slice(0, 7),
      languages: ['English', 'Hindi'], responseTime: 'New on PawMate',
      verification: { id: data.idFileName ? 'pending' : 'none', phone: 'pending', background: 'none' },
      idFileName: data.idFileName || '',
      city: data.city, area: data.area, headline: data.headline, bio: data.bio,
      experienceYears: Number(data.experienceYears) || 0,
      price: data.pricing === 'free' ? 0 : Number(data.price),
      services: data.services, petTypes: data.petTypes,
      availability: { days: data.days, slots: data.slots },
    }
    db.walkers.push(walker)
    if (user.role === 'owner') user.role = 'both'
    writeDb(db)
    return { walker: hydrateWalker(walker), user: publicUser(db, user) }
  },

  async updateWalker(id, patch) {
    await wait(400)
    const db = readDb()
    const w = db.walkers.find(x => x.id === id) || fail('Walker not found.')
    Object.assign(w, patch)
    writeDb(db)
    return hydrateWalker(w)
  },

  async submitVerification(id, file) {
    const idFileName = typeof file === 'string' ? file : file.name
    await wait(500)
    const db = readDb()
    const w = db.walkers.find(x => x.id === id) || fail('Walker not found.')
    w.verification = { ...w.verification, id: 'pending' }
    w.idFileName = idFileName
    writeDb(db)
    return hydrateWalker(w)
  },

  async getWalkerReviews(walkerId) {
    await wait(250)
    return readDb().reviews.filter(r => r.walkerId === walkerId).sort((a, b) => b.date.localeCompare(a.date))
  },

  /* ------------------------------- pets ------------------------------ */
  async getPets(ownerId) {
    await wait(250)
    return readDb().pets.filter(p => p.ownerId === ownerId)
  },

  async savePet(ownerId, pet) {
    await wait(350)
    const db = readDb()
    const clean = {
      name: pet.name.trim(), type: pet.type, breed: pet.breed.trim(), age: Number(pet.age),
      vaccinated: !!pet.vaccinated, instructions: (pet.instructions || '').trim(),
    }
    if (pet.id) {
      const existing = db.pets.find(p => p.id === pet.id) || fail('Pet not found.')
      Object.assign(existing, clean)
      writeDb(db)
      return existing
    }
    const created = { id: uid('p'), ownerId, ...clean }
    db.pets.push(created)
    writeDb(db)
    return created
  },

  async deletePet(id) {
    await wait(300)
    const db = readDb()
    db.pets = db.pets.filter(p => p.id !== id)
    writeDb(db)
  },

  /* ----------------------------- bookings ---------------------------- */
  async getBookings({ ownerId, walkerId }) {
    await wait(400)
    const db = readDb()
    return db.bookings.filter(b => (ownerId ? b.ownerId === ownerId : true) && (walkerId ? b.walkerId === walkerId : true))
  },

  /** Dates and slots already taken (Pending or Accepted) for a walker. */
  async getBookedSlots(walkerId) {
    await wait(150)
    return readDb().bookings
      .filter(b => b.walkerId === walkerId && [S.PENDING, S.ACCEPTED].includes(b.status))
      .map(b => ({ date: b.date, slot: b.slot }))
  },

  async createBooking(payload) {
    await wait(700)
    const db = readDb()
    const w = db.walkers.find(x => x.id === payload.walkerId) || fail('Walker not found.')
    if (payload.date < todayISO()) fail('Please choose a date that is not in the past.')
    const taken = db.bookings.some(b =>
      b.walkerId === w.id && b.date === payload.date && b.slot === payload.slot && [S.PENDING, S.ACCEPTED].includes(b.status))
    if (taken) fail('That slot was just taken. Please choose another time.')

    const { subtotal, fee, total } = priceBreakdown(w.price, payload.hours)
    const now = new Date().toISOString()
    const paymentStatus = w.price === 0 ? 'Free' : payload.payMethod === 'cash' ? 'Pay on completion' : 'Authorized'
    const booking = {
      id: uid('b'), ...payload, walkerName: w.name, price: w.price, subtotal, fee, total,
      paymentStatus, status: S.PENDING, reviewed: false, createdAt: now,
      statusHistory: [{ status: S.PENDING, at: now, by: 'owner' }],
    }
    db.bookings.push(booking)

    // make sure the two of them can chat
    if (!db.conversations.some(c => c.ownerId === booking.ownerId && c.walkerId === w.id)) {
      db.conversations.push({
        id: uid('c'), ownerId: booking.ownerId, ownerName: booking.ownerName, walkerId: w.id, walkerName: w.name, messages: [],
      })
    }
    writeDb(db)
    return booking
  },

  async updateBookingStatus(id, status, { by, reason } = {}) {
    await wait(500)
    const db = readDb()
    const b = db.bookings.find(x => x.id === id) || fail('Booking not found.')
    const allowed = {
      [S.PENDING]: [S.ACCEPTED, S.CANCELLED],
      [S.ACCEPTED]: [S.COMPLETED, S.CANCELLED],
    }
    if (!(allowed[b.status] || []).includes(status)) fail(`A ${b.status.toLowerCase()} booking cannot be marked ${status.toLowerCase()}.`)

    b.status = status
    b.statusHistory.push({ status, at: new Date().toISOString(), by })
    if (status === S.CANCELLED) {
      b.cancelReason = reason || ''
      b.cancelledBy = by
      if (b.paymentStatus === 'Authorized') b.paymentStatus = 'Refunded'
      if (b.paymentStatus === 'Pay on completion') b.paymentStatus = 'Not charged'
    }
    if (status === S.COMPLETED) {
      if (['Authorized', 'Pay on completion'].includes(b.paymentStatus)) b.paymentStatus = 'Paid'
      const w = db.walkers.find(x => x.id === b.walkerId)
      if (w) w.completedJobs = (w.completedJobs || 0) + 1
    }
    writeDb(db)
    return b
  },

  /* ----------------------------- reviews ----------------------------- */
  async addReview({ bookingId, rating, text }) {
    await wait(500)
    const db = readDb()
    const b = db.bookings.find(x => x.id === bookingId) || fail('Booking not found.')
    if (b.status !== S.COMPLETED) fail('You can review a booking once it is completed.')
    if (b.reviewed) fail('You have already reviewed this booking.')
    const w = db.walkers.find(x => x.id === b.walkerId)
    const review = {
      id: uid('r'), walkerId: b.walkerId, ownerId: b.ownerId, bookingId,
      ownerName: shortName(b.ownerName),
      rating, text: text.trim(), date: todayISO(),
    }
    db.reviews.push(review)
    b.reviewed = true
    if (w) {
      const total = w.rating * w.reviewCount + rating
      w.reviewCount += 1
      w.rating = Math.round((total / w.reviewCount) * 10) / 10
    }
    writeDb(db)
    return review
  },

  /* ------------------------------ chat ------------------------------- */
  async getConversations(user) {
    await wait(300)
    const db = readDb()
    return db.conversations
      .filter(c => c.ownerId === user.id || (user.walkerId && c.walkerId === user.walkerId))
      .map(c => {
        const as = c.ownerId === user.id ? 'owner' : 'walker'
        const last = c.messages[c.messages.length - 1] || null
        return { ...c, as, otherName: as === 'owner' ? c.walkerName : c.ownerName, last }
      })
      .sort((a, b) => (b.last?.at || '').localeCompare(a.last?.at || ''))
  },

  async getOrCreateConversation(owner, walkerId) {
    await wait(250)
    const db = readDb()
    const w = db.walkers.find(x => x.id === walkerId) || fail('Walker not found.')
    let c = db.conversations.find(x => x.ownerId === owner.id && x.walkerId === walkerId)
    if (!c) {
      c = { id: uid('c'), ownerId: owner.id, ownerName: owner.name, walkerId, walkerName: w.name, messages: [] }
      db.conversations.push(c)
      writeDb(db)
    }
    return c
  },

  async sendMessage(conversationId, from, text) {
    await wait(150)
    const db = readDb()
    const c = db.conversations.find(x => x.id === conversationId) || fail('Conversation not found.')
    c.messages.push({ id: uid('m'), from, text: text.trim(), at: new Date().toISOString() })
    writeDb(db)
    setTimeout(() => mockApi.simulateReply(conversationId), 0)
    return c
  },

  /** Demo only: the other person "replies" so the chat feels alive. */
  async simulateReply(conversationId) {
    await wait(1500)
    const db = readDb()
    const c = db.conversations.find(x => x.id === conversationId)
    if (!c || !c.messages.length) return c
    const last = c.messages[c.messages.length - 1]
    const from = last.from === 'owner' ? 'walker' : 'owner'
    const replies = from === 'walker'
      ? ['Sounds good! I will make sure everything is done as you described.', 'Thanks for the details. I am happy to help.', 'Got it! Feel free to share anything else about your pet.']
      : ['Thank you, that works for us!', 'Great, thanks for letting me know.', 'Perfect. See you then!']
    c.messages.push({ id: uid('m'), from, text: replies[Math.floor(Math.random() * replies.length)], at: new Date().toISOString() })
    writeDb(db)
    return c
  },

  /* ----------------------------- contact ----------------------------- */
  async submitContact(form) {
    await wait(700)
    const db = readDb()
    const ticket = `PM-${Math.floor(1000 + Math.random() * 9000)}`
    db.contactMessages.push({ id: uid('t'), ticket, ...form, createdAt: new Date().toISOString() })
    writeDb(db)
    return { ticket }
  },

  /** Handy while developing: wipes local data and restores the sample data. */
  async resetDemoData() {
    memory = null
    try { localStorage.removeItem(DB_KEY); localStorage.removeItem(SESSION_KEY) } catch { /* ignore */ }
    readDb()
  },
}
