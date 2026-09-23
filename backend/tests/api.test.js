// Integration tests: they run the real API against a real (empty, throw-away) MongoDB database.
//   TEST_MONGODB_URI=mongodb://127.0.0.1:27017/pawmate_test npm test
import test, { describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-1234'
process.env.MONGODB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/pawmate_test'
process.env.DEMO_REPLIES = 'false'
process.env.ADMIN_TOKEN = 'admin-token-for-tests-1234567890'
process.env.UPLOAD_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'pawmate-uploads-'))

const { createApp } = await import('../src/app.js')
const { connectDb, disconnectDb } = await import('../src/db.js')
const { seedDatabase, DEMO_PASSWORD } = await import('../src/seed/seed.js')

let server
let base
before(async () => {
  await connectDb()
  await seedDatabase({ reset: true })
  server = createApp().listen(0)
  base = `http://127.0.0.1:${server.address().port}/api`
})
after(async () => {
  await new Promise(r => server.close(r))
  await disconnectDb()
  fs.rmSync(process.env.UPLOAD_DIR, { recursive: true, force: true })
})

async function call(method, url, { token, body, form } = {}) {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (body) headers['Content-Type'] = 'application/json'
  const res = await fetch(base + url, { method, headers, body: form || (body ? JSON.stringify(body) : undefined) })
  const text = await res.text()
  return { status: res.status, body: text ? JSON.parse(text) : null }
}
const login = async email => (await call('POST', '/auth/login', { body: { email, password: DEMO_PASSWORD } })).body
const ownerLogin = () => login('owner@pawmate.com')
const walkerLogin = () => login('walker@pawmate.com')

// a future date that falls on a working day for Ananya (Mon to Sat)
function futureDate(minDays = 20) {
  for (let i = minDays; i < minDays + 10; i++) {
    const d = new Date(Date.now() + i * 864e5)
    if (d.getUTCDay() !== 0) return d.toISOString().slice(0, 10)
  }
}
function futureSunday() {
  for (let i = 20; i < 40; i++) {
    const d = new Date(Date.now() + i * 864e5)
    if (d.getUTCDay() === 0) return d.toISOString().slice(0, 10)
  }
}
const bookingBody = (o, pet, extra = {}) => ({
  walkerId: o.walkerId, petId: pet.id, service: 'walking', date: futureDate(), slot: 'morning', hours: 1,
  address: 'B-204 Park View Apartments, Sector 45', instructions: '',
  emergency: { name: 'Sanjay Kapoor', phone: '98111 22334', relation: 'Parent' }, payMethod: 'upi', ...extra,
})

describe('basics and security', () => {
  test('health check', async () => {
    const r = await call('GET', '/health')
    assert.equal(r.status, 200)
    assert.equal(r.body.database, 'connected')
  })
  test('unknown routes and bad JSON return clean errors', async () => {
    assert.equal((await call('GET', '/nope')).status, 404)
    const res = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad' })
    assert.equal(res.status, 400)
  })
  test('protected routes need a token', async () => {
    assert.equal((await call('GET', '/bookings?as=owner')).status, 401)
    assert.equal((await call('GET', '/pets')).status, 401)
    assert.equal((await call('GET', '/auth/me', { token: 'garbage' })).status, 401)
  })
})

describe('auth', () => {
  test('signup validates input', async () => {
    const weak = await call('POST', '/auth/signup', { body: { name: 'Test', email: 'weak@example.com', password: 'short', role: 'owner' } })
    assert.equal(weak.status, 400)
    const bad = await call('POST', '/auth/signup', { body: { name: 'Test User', email: 'not-an-email', password: 'Password1', role: 'owner' } })
    assert.equal(bad.status, 400)
    const role = await call('POST', '/auth/signup', { body: { name: 'Test User', email: 'x@example.com', password: 'Password1', role: 'admin' } })
    assert.equal(role.status, 400)
  })
  test('signup, duplicate, login and /me', async () => {
    const body = { name: 'Meera Test', email: 'Meera.Test@Example.com', password: 'Password1', phone: '98765 12345', city: 'Gurugram', role: 'owner' }
    const s = await call('POST', '/auth/signup', { body })
    assert.equal(s.status, 201)
    assert.ok(s.body.token)
    assert.equal(s.body.user.email, 'meera.test@example.com')
    assert.equal(s.body.user.passwordHash, undefined)
    assert.equal(s.body.user.walkerId, null)
    assert.equal((await call('POST', '/auth/signup', { body })).status, 409)
    assert.equal((await call('POST', '/auth/login', { body: { email: body.email, password: 'wrong-pass1' } })).status, 401)
    assert.equal((await call('POST', '/auth/login', { body: { email: 'nobody@example.com', password: 'Password1' } })).status, 401)
    const l = await call('POST', '/auth/login', { body: { email: body.email, password: body.password } })
    assert.equal(l.status, 200)
    const me = await call('GET', '/auth/me', { token: l.body.token })
    assert.equal(me.body.user.name, 'Meera Test')
  })
  test('demo walker account knows its walker profile', async () => {
    const w = await walkerLogin()
    assert.ok(w.user.walkerId)
  })
})

describe('walker search', () => {
  test('lists every sample walker with derived fields', async () => {
    const r = await call('GET', '/walkers')
    assert.equal(r.body.walkers.length, 9)
    const a = r.body.walkers.find(x => x.name === 'Ananya Verma')
    assert.equal(a.verified, true)
    assert.equal(a.ratingSum, undefined)
    assert.equal(a.idFilePath, undefined)
    assert.equal(typeof a.id, 'string')
  })
  test('filters', async () => {
    const q = async s => (await call('GET', `/walkers${s}`)).body.walkers.map(w => w.name)
    assert.deepEqual((await q('?free=1')).sort(), ['Kavya Nair', 'Meera Iyer'])
    assert.deepEqual(await q('?location=sector%2045'), ['Ananya Verma'])
    assert.ok((await q('?petType=rabbit')).includes('Simran Kaur'))
    assert.ok(!(await q('?maxPrice=200')).includes('Arjun Singh'))
    assert.ok(!(await q('?verified=1')).includes('Aditya Joshi'))
    assert.ok(!(await q('?availability=weekends')).includes('Aditya Joshi')) // weekdays only
    assert.ok((await q('?availability=morning')).includes('Vikram Rao'))
    assert.equal((await q('?location=mumbai')).length, 0)
    assert.equal((await q('?sort=priceLow'))[0], 'Kavya Nair')
  })
  test('rejects bad and malicious input', async () => {
    assert.equal((await call('GET', '/walkers?petType=dragon')).status, 400)
    // Express reads `location[$ne]` as a plain unknown key, so the operator is ignored and never reaches MongoDB
    const injected = await call('GET', '/walkers?location[$ne]=x')
    assert.equal(injected.status, 200)
    assert.equal(injected.body.walkers.length, (await call('GET', '/walkers')).body.walkers.length)
    assert.equal((await call('GET', '/walkers?location=%7B%22%24ne%22%3A%22x%22%7D')).body.walkers.length, 0)
    assert.equal((await call('GET', '/walkers/not-an-id')).status, 400)
    assert.equal((await call('GET', '/walkers/aaaaaaaaaaaaaaaaaaaaaaaa')).status, 404)
  })
  test('regex characters in location are treated as plain text', async () => {
    const r = await call('GET', '/walkers?location=.*')
    assert.equal(r.status, 200)
    assert.equal(r.body.walkers.length, 0)
  })
})

describe('pets', () => {
  test('owner manages their own pets only', async () => {
    const o = await ownerLogin()
    const list = await call('GET', '/pets', { token: o.token })
    assert.equal(list.body.pets.length, 2)
    const bad = await call('POST', '/pets', { token: o.token, body: { name: '', type: 'dog', breed: 'x', age: 2 } })
    assert.equal(bad.status, 400)
    const c = await call('POST', '/pets', { token: o.token, body: { name: 'Coco', type: 'dog', breed: 'Beagle', age: '2', instructions: 'Loves toys' } })
    assert.equal(c.status, 201)
    assert.equal(c.body.pet.age, 2)
    const u = await call('PUT', `/pets/${c.body.pet.id}`, { token: o.token, body: { name: 'Coco', type: 'dog', breed: 'Beagle', age: 3 } })
    assert.equal(u.body.pet.age, 3)

    const other = (await call('POST', '/auth/signup', { body: { name: 'Other Owner', email: 'other.owner@example.com', password: 'Password1', role: 'owner' } })).body
    assert.equal((await call('DELETE', `/pets/${c.body.pet.id}`, { token: other.token })).status, 404)
    assert.equal((await call('PUT', `/pets/${c.body.pet.id}`, { token: other.token, body: { name: 'Hacked', type: 'dog', breed: 'x', age: 1 } })).status, 404)
    assert.equal((await call('DELETE', `/pets/${c.body.pet.id}`, { token: o.token })).status, 204)
  })
  test('walker-only accounts cannot use pets', async () => {
    const w = await walkerLogin()
    assert.equal((await call('GET', '/pets', { token: w.token })).status, 403)
  })
})

describe('bookings', () => {
  test('full lifecycle: request, redaction, accept, complete, permissions', async () => {
    const o = await ownerLogin()
    const w = await walkerLogin()
    const pets = (await call('GET', '/pets', { token: o.token })).body.pets
    const bruno = pets.find(p => p.name === 'Bruno')
    const misty = pets.find(p => p.name === 'Misty')
    const walkerId = w.user.walkerId
    const b = { walkerId }

    // the server calculates the price itself
    const created = await call('POST', '/bookings', { token: o.token, body: { ...bookingBody(b, bruno), total: 1, price: 1, status: 'Completed' } })
    assert.equal(created.status, 201)
    assert.equal(created.body.booking.status, 'Pending')
    assert.equal(created.body.booking.total, 194) // 180 + 8% fee
    assert.equal(created.body.booking.paymentStatus, 'Authorized')
    const id = created.body.booking.id

    // same slot again, wrong day, past date, wrong pet type, someone else's pet
    assert.equal((await call('POST', '/bookings', { token: o.token, body: bookingBody(b, bruno, { date: created.body.booking.date }) })).status, 409)
    assert.equal((await call('POST', '/bookings', { token: o.token, body: bookingBody(b, bruno, { date: futureSunday() }) })).status, 400)
    assert.equal((await call('POST', '/bookings', { token: o.token, body: bookingBody(b, bruno, { date: '2020-01-01' }) })).status, 400)
    assert.equal((await call('POST', '/bookings', { token: o.token, body: bookingBody(b, bruno, { date: '2030-02-31' }) })).status, 400)
    assert.equal((await call('POST', '/bookings', { token: o.token, body: bookingBody(b, bruno, { slot: 'afternoon' }) })).status, 400)
    const allWalkers = (await call('GET', '/walkers')).body.walkers
    const rohan = allWalkers.find(x => x.name === 'Rohan Mehta') // dogs only
    assert.equal((await call('POST', '/bookings', { token: o.token, body: bookingBody({ walkerId: rohan.id }, misty, { date: futureDate(25) }) })).status, 400)
    const stranger = (await call('POST', '/auth/signup', { body: { name: 'Stranger Danger', email: 'stranger@example.com', password: 'Password1', role: 'owner' } })).body
    assert.equal((await call('POST', '/bookings', { token: stranger.token, body: bookingBody(b, bruno, { date: futureDate(30) }) })).status, 400)

    // booked slots are public but anonymous
    const slots = await call('GET', `/walkers/${walkerId}/booked-slots`)
    assert.ok(slots.body.slots.some(s => s.date === created.body.booking.date && s.slot === 'morning'))
    assert.deepEqual(Object.keys(slots.body.slots[0]).sort(), ['date', 'slot'])

    // walker sees it, with private details hidden until accepted
    const walkerView = (await call('GET', '/bookings?as=walker', { token: w.token })).body.bookings
    const pending = walkerView.find(x => x.id === id)
    assert.equal(pending.address, '')
    assert.equal(pending.emergency, null)
    assert.equal(pending.ownerPhone, '')
    assert.equal(pending.petName, 'Bruno')

    // permissions
    assert.equal((await call('PATCH', `/bookings/${id}/status`, { token: o.token, body: { status: 'Accepted' } })).status, 403)
    assert.equal((await call('PATCH', `/bookings/${id}/status`, { token: stranger.token, body: { status: 'Cancelled', reason: 'nope nope' } })).status, 403)
    assert.equal((await call('GET', `/bookings/${id}`, { token: stranger.token })).status, 403)
    assert.equal((await call('PATCH', `/bookings/${id}/status`, { token: w.token, body: { status: 'Completed' } })).status, 409)

    const accepted = await call('PATCH', `/bookings/${id}/status`, { token: w.token, body: { status: 'Accepted' } })
    assert.equal(accepted.status, 200)
    assert.equal(accepted.body.booking.status, 'Accepted')
    assert.ok(accepted.body.booking.address.length > 5)
    assert.equal(accepted.body.booking.emergency.name, 'Sanjay Kapoor')
    assert.equal((await call('PATCH', `/bookings/${id}/status`, { token: w.token, body: { status: 'Accepted' } })).status, 409)

    const before = (await call('GET', `/walkers/${walkerId}`)).body.walker.completedJobs
    const done = await call('PATCH', `/bookings/${id}/status`, { token: w.token, body: { status: 'Completed' } })
    assert.equal(done.body.booking.paymentStatus, 'Paid')
    assert.equal(done.body.booking.statusHistory.length, 3)
    assert.equal((await call('GET', `/walkers/${walkerId}`)).body.walker.completedJobs, before + 1)
    assert.equal((await call('PATCH', `/bookings/${id}/status`, { token: o.token, body: { status: 'Cancelled', reason: 'changed my mind' } })).status, 409)
  })

  test('cancelling needs a reason and refunds the payment', async () => {
    const o = await ownerLogin()
    const w = await walkerLogin()
    const bruno = (await call('GET', '/pets', { token: o.token })).body.pets.find(p => p.name === 'Bruno')
    const created = await call('POST', '/bookings', { token: o.token, body: bookingBody({ walkerId: w.user.walkerId }, bruno, { date: futureDate(40), slot: 'evening' }) })
    const id = created.body.booking.id
    assert.equal((await call('PATCH', `/bookings/${id}/status`, { token: o.token, body: { status: 'Cancelled' } })).status, 400)
    const c = await call('PATCH', `/bookings/${id}/status`, { token: o.token, body: { status: 'Cancelled', reason: 'Plans changed' } })
    assert.equal(c.body.booking.status, 'Cancelled')
    assert.equal(c.body.booking.cancelledBy, 'owner')
    assert.equal(c.body.booking.paymentStatus, 'Refunded')
    // the slot is free again
    const again = await call('POST', '/bookings', { token: o.token, body: bookingBody({ walkerId: w.user.walkerId }, bruno, { date: futureDate(40), slot: 'evening' }) })
    assert.equal(again.status, 201)
  })

  test('volunteer bookings are free and need no payment method', async () => {
    const o = await ownerLogin()
    const bruno = (await call('GET', '/pets', { token: o.token })).body.pets.find(p => p.name === 'Bruno')
    const kavya = (await call('GET', '/walkers?free=1')).body.walkers.find(x => x.name === 'Kavya Nair')
    let date
    for (let i = 20; i < 40; i++) { const d = new Date(Date.now() + i * 864e5); if ([1, 3, 5].includes(d.getUTCDay())) { date = d.toISOString().slice(0, 10); break } }
    const r = await call('POST', '/bookings', { token: o.token, body: { ...bookingBody({ walkerId: kavya.id }, bruno, { date, slot: 'evening' }), payMethod: undefined } })
    assert.equal(r.status, 201)
    assert.equal(r.body.booking.total, 0)
    assert.equal(r.body.booking.paymentStatus, 'Free')
  })

  test('paid bookings require a payment method', async () => {
    const o = await ownerLogin()
    const w = await walkerLogin()
    const bruno = (await call('GET', '/pets', { token: o.token })).body.pets.find(p => p.name === 'Bruno')
    const r = await call('POST', '/bookings', { token: o.token, body: { ...bookingBody({ walkerId: w.user.walkerId }, bruno, { date: futureDate(50) }), payMethod: undefined } })
    assert.equal(r.status, 400)
  })

  test('a walker cannot book themselves', async () => {
    const wk = await walkerLogin()
    await call('POST', '/users/me/roles', { token: wk.token, body: { role: 'owner' } })
    const pet = (await call('POST', '/pets', { token: wk.token, body: { name: 'Solo', type: 'dog', breed: 'Mix', age: 1 } })).body.pet
    const r = await call('POST', '/bookings', { token: wk.token, body: bookingBody({ walkerId: wk.user.walkerId }, pet, { date: futureDate(55) }) })
    assert.equal(r.status, 400)
  })
})

describe('reviews', () => {
  test('only the owner of a completed booking can review, once', async () => {
    const o = await ownerLogin()
    const w = await walkerLogin()
    const bookings = (await call('GET', '/bookings?as=owner', { token: o.token })).body.bookings
    const completed = bookings.find(b => b.status === 'Completed' && !b.reviewed)
    const pending = bookings.find(b => b.status === 'Pending')
    assert.ok(completed && pending)

    assert.equal((await call('POST', '/reviews', { token: o.token, body: { bookingId: pending.id, rating: 5, text: 'Not done yet, really' } })).status, 400)
    assert.equal((await call('POST', '/reviews', { token: w.token, body: { bookingId: completed.id, rating: 5, text: 'Reviewing as the wrong person' } })).status, 404)
    assert.equal((await call('POST', '/reviews', { token: o.token, body: { bookingId: completed.id, rating: 7, text: 'Rating is out of range' } })).status, 400)
    assert.equal((await call('POST', '/reviews', { token: o.token, body: { bookingId: completed.id, rating: 5, text: 'short' } })).status, 400)

    const before = (await call('GET', `/walkers/${completed.walkerId}`)).body.walker
    const ok = await call('POST', '/reviews', { token: o.token, body: { bookingId: completed.id, rating: 5, text: 'Wonderful walker, would book again' } })
    assert.equal(ok.status, 201)
    assert.equal(ok.body.review.ownerName, 'Riya K.')
    const after = (await call('GET', `/walkers/${completed.walkerId}`)).body.walker
    assert.equal(after.reviewCount, before.reviewCount + 1)
    assert.ok(after.rating >= 4.8)
    const list = await call('GET', `/walkers/${completed.walkerId}/reviews`)
    assert.ok(list.body.reviews.some(r => r.text.startsWith('Wonderful walker')))
    assert.equal((await call('POST', '/reviews', { token: o.token, body: { bookingId: completed.id, rating: 5, text: 'Trying to review a second time' } })).status, 409)
  })
})

describe('conversations', () => {
  test('participants can chat, outsiders cannot', async () => {
    const o = await ownerLogin()
    const w = await walkerLogin()
    const list = await call('GET', '/conversations', { token: o.token })
    const conv = list.body.conversations.find(c => c.walkerName === 'Ananya Verma')
    assert.ok(conv)
    assert.equal(conv.as, 'owner')
    assert.equal(conv.otherName, 'Ananya Verma')
    assert.equal(conv.messages.length >= 3, true)

    const sent = await call('POST', `/conversations/${conv.id}/messages`, { token: o.token, body: { text: '  Thanks again!  ' } })
    assert.equal(sent.status, 201)
    assert.equal(sent.body.conversation.last.text, 'Thanks again!')
    assert.equal(sent.body.conversation.last.from, 'owner')
    assert.equal((await call('POST', `/conversations/${conv.id}/messages`, { token: o.token, body: { text: '   ' } })).status, 400)

    const theirs = (await call('GET', '/conversations', { token: w.token })).body.conversations.find(c => c.id === conv.id)
    assert.equal(theirs.as, 'walker')
    assert.equal(theirs.otherName, 'Riya Kapoor')
    const reply = await call('POST', `/conversations/${conv.id}/messages`, { token: w.token, body: { text: 'Any time!' } })
    assert.equal(reply.body.conversation.last.from, 'walker')

    const outsider = (await call('POST', '/auth/signup', { body: { name: 'Nosy Person', email: 'nosy@example.com', password: 'Password1', role: 'owner' } })).body
    assert.equal((await call('GET', `/conversations/${conv.id}`, { token: outsider.token })).status, 403)
    assert.equal((await call('POST', `/conversations/${conv.id}/messages`, { token: outsider.token, body: { text: 'hi' } })).status, 403)
  })
  test('owners can start a chat with any walker; walkers only with owners who requested them', async () => {
    const o = await ownerLogin()
    const w = await walkerLogin()
    const rohan = (await call('GET', '/walkers')).body.walkers.find(x => x.name === 'Rohan Mehta')
    const started = await call('POST', '/conversations', { token: o.token, body: { walkerId: rohan.id } })
    assert.equal(started.status, 200)
    const again = await call('POST', '/conversations', { token: o.token, body: { walkerId: rohan.id } })
    assert.equal(again.body.conversation.id, started.body.conversation.id)

    const stranger = (await call('POST', '/auth/signup', { body: { name: 'New Person', email: 'newperson@example.com', password: 'Password1', role: 'owner' } })).body
    const denied = await call('POST', '/conversations', { token: w.token, body: { walkerId: w.user.walkerId, ownerId: stranger.user.id } })
    assert.equal(denied.status, 403)
    const karanId = (await call('GET', '/bookings?as=walker', { token: w.token })).body.bookings.find(b => b.ownerName === 'Karan Malhotra').ownerId
    const allowed = await call('POST', '/conversations', { token: w.token, body: { walkerId: w.user.walkerId, ownerId: karanId } })
    assert.equal(allowed.status, 200)
    assert.equal(allowed.body.conversation.as, 'walker')
  })
})

describe('profiles, roles and walker registration', () => {
  test('updating account details', async () => {
    const o = await ownerLogin()
    assert.equal((await call('PATCH', '/users/me', { token: o.token, body: { phone: '12345' } })).status, 400)
    const r = await call('PATCH', '/users/me', { token: o.token, body: { city: 'Delhi', emergencyContact: { name: 'Sanjay', phone: '98111 22334', relation: 'Parent' }, vet: { name: 'Vet One', phone: '' } } })
    assert.equal(r.body.user.city, 'Delhi')
    assert.equal(r.body.user.emergencyContact.name, 'Sanjay')
    const cleared = await call('PATCH', '/users/me', { token: o.token, body: { vet: null } })
    assert.equal(cleared.body.user.vet, null)
    await call('PATCH', '/users/me', { token: o.token, body: { city: 'Gurugram' } })
  })

  test('becoming a walker, editing, uploading an ID and admin review', async () => {
    const su = await call('POST', '/auth/signup', { body: { name: 'Isha Walker', email: 'isha@example.com', password: 'Password1', phone: '98765 00000', city: 'Gurugram', role: 'walker' } })
    const token = su.body.token
    const profile = {
      city: 'Gurugram', area: 'Sector 21', headline: 'Loves dogs and long walks', bio: 'I have walked friends dogs for years and am happy to follow any routine you set for your pet.',
      experienceYears: '2', services: ['walking'], petTypes: ['dog'], pricing: 'paid', price: '150', days: ['Sat', 'Sun'], slots: ['morning'],
    }
    assert.equal((await call('POST', '/walkers', { token, body: { ...profile, bio: 'too short' } })).status, 400)
    assert.equal((await call('POST', '/walkers', { token, body: { ...profile, services: [] } })).status, 400)
    assert.equal((await call('POST', '/walkers', { token, body: { ...profile, price: '10' } })).status, 400)
    const created = await call('POST', '/walkers', { token, body: profile })
    assert.equal(created.status, 201)
    const walker = created.body.walker
    assert.equal(walker.name, 'Isha Walker')
    assert.equal(walker.price, 150)
    assert.equal(walker.verified, false)
    assert.equal(created.body.user.walkerId, walker.id)
    assert.equal((await call('POST', '/walkers', { token, body: profile })).status, 409)
    assert.equal((await call('GET', '/walkers/me', { token })).body.walker.id, walker.id)

    // free volunteer profile update, and other people cannot edit it
    const patched = await call('PATCH', `/walkers/${walker.id}`, { token, body: { price: 0, availability: { days: ['Mon'], slots: ['evening'] } } })
    assert.equal(patched.body.walker.price, 0)
    assert.deepEqual(patched.body.walker.availability.days, ['Mon'])
    const o = await ownerLogin()
    assert.equal((await call('PATCH', `/walkers/${walker.id}`, { token: o.token, body: { price: 100 } })).status, 403)
    assert.equal((await call('POST', `/walkers/${walker.id}/verification`, { token: o.token })).status, 403)

    // hide from search
    await call('PATCH', `/walkers/${walker.id}`, { token, body: { active: false } })
    assert.ok(!(await call('GET', '/walkers')).body.walkers.some(w => w.id === walker.id))
    await call('PATCH', `/walkers/${walker.id}`, { token, body: { active: true } })

    // ID upload
    const png = new Blob([Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])], { type: 'image/png' })
    const form = new FormData()
    form.append('document', png, 'my-id.png')
    const up = await call('POST', `/walkers/${walker.id}/verification`, { token, form })
    assert.equal(up.status, 200)
    assert.equal(up.body.walker.verification.id, 'pending')
    assert.equal(up.body.walker.idFileName, 'my-id.png')
    assert.equal(up.body.walker.idFilePath, undefined)
    assert.equal(fs.readdirSync(path.join(process.env.UPLOAD_DIR, 'ids')).length, 1)

    const bad = new FormData()
    bad.append('document', new Blob(['<script>alert(1)</script>'], { type: 'text/html' }), 'evil.html')
    assert.equal((await call('POST', `/walkers/${walker.id}/verification`, { token, form: bad })).status, 400)
    const big = new FormData()
    big.append('document', new Blob([new Uint8Array(6 * 1024 * 1024)], { type: 'application/pdf' }), 'big.pdf')
    assert.equal((await call('POST', `/walkers/${walker.id}/verification`, { token, form: big })).status, 413)
    assert.equal((await call('POST', `/walkers/${walker.id}/verification`, { token })).status, 400)

    // admin review
    assert.equal((await call('PATCH', `/admin/walkers/${walker.id}/verification`, { body: { id: 'verified' } })).status, 404)
    const url = `${base}/admin/walkers/${walker.id}/verification`
    const res = await fetch(url, { method: 'PATCH', headers: { 'x-admin-token': process.env.ADMIN_TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 'verified' }) })
    assert.equal(res.status, 200)
    assert.equal((await call('GET', `/walkers/${walker.id}`)).body.walker.verified, true)
    assert.equal((await call('POST', `/walkers/${walker.id}/verification`, { token, form })).status, 409)
  })

  test('an owner who registers as a walker becomes "both", and renaming updates the walker card', async () => {
    const su = await call('POST', '/auth/signup', { body: { name: 'Dual Role', email: 'dual@example.com', password: 'Password1', role: 'owner' } })
    const token = su.body.token
    const profile = { city: 'Noida', area: 'Sector 62', headline: 'Friendly neighbourhood walker', bio: 'I have looked after neighbours pets for years and enjoy giving them plenty of exercise and attention.',
      experienceYears: 1, services: ['walking', 'care'], petTypes: ['dog', 'cat'], pricing: 'free', days: ['Wed'], slots: ['evening'] }
    const created = await call('POST', '/walkers', { token, body: profile })
    assert.equal(created.status, 201)
    assert.equal(created.body.user.role, 'both')
    assert.equal(created.body.walker.price, 0)
    await call('PATCH', '/users/me', { token, body: { name: 'Dual Renamed' } })
    assert.equal((await call('GET', `/walkers/${created.body.walker.id}`)).body.walker.name, 'Dual Renamed')
  })
})

describe('contact form', () => {
  test('validates and returns a ticket', async () => {
    assert.equal((await call('POST', '/contact', { body: { name: 'A', email: 'a@example.com', topic: 'General question', message: 'short' } })).status, 400)
    assert.equal((await call('POST', '/contact', { body: { name: 'A', email: 'a@example.com', topic: 'Something else', message: 'x'.repeat(30) } })).status, 400)
    const ok = await call('POST', '/contact', { body: { name: 'Neetu', email: 'n@example.com', topic: 'Safety concern', message: 'I would like to report a concern about a booking.' } })
    assert.equal(ok.status, 201)
    assert.match(ok.body.ticket, /^PM-\d{6}$/)
  })
})
