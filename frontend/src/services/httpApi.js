/**
 * The real PawMate API client. Same method names and return shapes as mockApi.js,
 * so pages and components never need to know which one is running.
 * Endpoints are documented in server/README.md.
 */
import { MAX_PRICE } from '../data/constants.js'
import { ApiError, request, tokenStore } from './http.js'

const pick = (obj, keys) => Object.fromEntries(keys.filter(k => obj[k] !== undefined).map(k => [k, obj[k]]))
const notFoundToNull = err => {
  if (err instanceof ApiError && [400, 404].includes(err.status)) return null
  throw err
}

export const httpApi = {
  /* ------------------------------ auth ------------------------------ */
  async getSession() {
    if (!tokenStore.get()) return null
    try {
      return (await request('GET', '/auth/me')).user
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return null
      throw err
    }
  },

  async login({ email, password }) {
    const { token, user } = await request('POST', '/auth/login', { body: { email, password } })
    tokenStore.set(token)
    return user
  },

  async signup(data) {
    const { token, user } = await request('POST', '/auth/signup', { body: pick(data, ['name', 'email', 'password', 'phone', 'city', 'role']) })
    tokenStore.set(token)
    return user
  },

  async logout() {
    tokenStore.clear()
  },

  async updateUser(_id, patch) {
    return (await request('PATCH', '/users/me', { body: patch })).user
  },

  async addRole(_id, role) {
    return (await request('POST', '/users/me/roles', { body: { role } })).user
  },

  /* ----------------------------- walkers ----------------------------- */
  async getWalkers(f = {}) {
    const query = {
      location: f.location, petType: f.petType, service: f.service, availability: f.availability,
      free: f.free, maxPrice: f.maxPrice && f.maxPrice < MAX_PRICE ? f.maxPrice : undefined,
      minRating: f.minRating, verified: f.verified, sort: f.sort,
    }
    return (await request('GET', '/walkers', { query })).walkers
  },

  async getWalker(id) {
    try {
      return (await request('GET', `/walkers/${id}`)).walker
    } catch (err) {
      return notFoundToNull(err)
    }
  },

  async getWalkerByUser() {
    return (await request('GET', '/walkers/me')).walker
  },

  async createWalkerProfile(_userId, data) {
    const body = pick(data, ['city', 'area', 'headline', 'bio', 'experienceYears', 'services', 'petTypes', 'pricing', 'price', 'days', 'slots'])
    return request('POST', '/walkers', { body }) // { walker, user }
  },

  async updateWalker(id, patch) {
    return (await request('PATCH', `/walkers/${id}`, { body: patch })).walker
  },

  /** Sends the ID document (a File) for review. */
  async submitVerification(id, file) {
    const form = new FormData()
    form.append('document', file)
    return (await request('POST', `/walkers/${id}/verification`, { form })).walker
  },

  async getWalkerReviews(walkerId) {
    try {
      return (await request('GET', `/walkers/${walkerId}/reviews`)).reviews
    } catch {
      return []
    }
  },

  /* ------------------------------- pets ------------------------------ */
  async getPets() {
    return (await request('GET', '/pets')).pets
  },

  async savePet(_ownerId, pet) {
    const body = pick(pet, ['name', 'type', 'breed', 'age', 'vaccinated', 'instructions'])
    body.age = Number(body.age)
    const res = pet.id ? await request('PUT', `/pets/${pet.id}`, { body }) : await request('POST', '/pets', { body })
    return res.pet
  },

  async deletePet(id) {
    await request('DELETE', `/pets/${id}`)
  },

  /* ----------------------------- bookings ---------------------------- */
  async getBookings({ ownerId }) {
    return (await request('GET', '/bookings', { query: { as: ownerId ? 'owner' : 'walker' } })).bookings
  },

  async getBookedSlots(walkerId) {
    try {
      return (await request('GET', `/walkers/${walkerId}/booked-slots`)).slots
    } catch {
      return []
    }
  },

  async createBooking(payload) {
    const body = pick(payload, ['walkerId', 'petId', 'service', 'date', 'slot', 'hours', 'address', 'instructions', 'emergency', 'payMethod', 'cardLast4'])
    return (await request('POST', '/bookings', { body })).booking
  },

  async updateBookingStatus(id, status, { reason } = {}) {
    return (await request('PATCH', `/bookings/${id}/status`, { body: { status, reason } })).booking
  },

  /* ----------------------------- reviews ----------------------------- */
  async addReview({ bookingId, rating, text }) {
    return (await request('POST', '/reviews', { body: { bookingId, rating, text } })).review
  },

  /* ------------------------------ chat ------------------------------- */
  async getConversations() {
    return (await request('GET', '/conversations')).conversations
  },

  async getOrCreateConversation(owner, walkerId) {
    return (await request('POST', '/conversations', { body: { walkerId, ownerId: owner?.id } })).conversation
  },

  async sendMessage(conversationId, _from, text) {
    return (await request('POST', `/conversations/${conversationId}/messages`, { body: { text } })).conversation
  },

  /** Replies come from real people now (the chat page polls for new messages). Kept so the mock and real clients match. */
  async simulateReply() {
    return null
  },

  /* ----------------------------- contact ----------------------------- */
  async submitContact(form) {
    return request('POST', '/contact', { body: pick(form, ['name', 'email', 'topic', 'message']) }) // { ticket }
  },
}
