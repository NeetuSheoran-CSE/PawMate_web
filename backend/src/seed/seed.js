/**
 * Fills the database with sample data (the same people the mock frontend used).
 *   npm run seed           only runs on an empty database
 *   npm run seed -- --reset  wipes PawMate collections first
 * All people, reviews and numbers are made up for demo purposes.
 */
import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { config } from '../config.js'
import { connectDb, disconnectDb } from '../db.js'
import { Booking } from '../models/Booking.js'
import { ContactMessage } from '../models/ContactMessage.js'
import { Conversation } from '../models/Conversation.js'
import { Pet } from '../models/Pet.js'
import { Review } from '../models/Review.js'
import { User } from '../models/User.js'
import { Walker } from '../models/Walker.js'
import { todayISO } from '../utils/dates.js'
import { priceBreakdown } from '../utils/pricing.js'

export const DEMO_PASSWORD = 'Pawmate@123'

const dayISO = offset => {
  const [y, m, d] = todayISO().split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + offset)).toISOString().slice(0, 10)
}
const ago = (days, hours = 0) => new Date(Date.now() - days * 864e5 - hours * 36e5)
const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const ALL_SLOTS = ['morning', 'afternoon', 'evening']
const ok = { id: 'verified', phone: 'verified', background: 'verified' }

export async function seedDatabase({ reset = false } = {}) {
  if (reset) {
    await Promise.all([Booking, ContactMessage, Conversation, Pet, Review, User, Walker].map(m => m.deleteMany({})))
  } else if (await User.estimatedDocumentCount()) {
    throw new Error('The database already has data. Run "npm run seed -- --reset" to replace it.')
  }

  const hash = await bcrypt.hash(DEMO_PASSWORD, 12)
  const unusable = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 12)

  /* --------------------------- users --------------------------- */
  const [riya, ananyaUser, karan] = await User.create([
    {
      name: 'Riya Kapoor', email: 'owner@pawmate.com', passwordHash: hash, role: 'owner', phone: '98765 43210', city: 'Gurugram',
      bio: 'Working in marketing. Bruno and Misty keep me company.',
      emergencyContact: { name: 'Sanjay Kapoor', phone: '98111 22334', relation: 'Parent' },
      vet: { name: 'PetCare Clinic, Sector 44', phone: '99000 11223' },
    },
    { name: 'Ananya Verma', email: 'walker@pawmate.com', passwordHash: hash, role: 'walker', phone: '98100 55667', city: 'Gurugram', bio: 'Animal-science student who loves dogs.' },
    { name: 'Karan Malhotra', email: 'karan@pawmate.example', passwordHash: unusable, role: 'owner', phone: '99887 76655', city: 'Gurugram', isDemo: true },
  ])

  /* -------------------------- walkers -------------------------- */
  const w = (o) => ({ userId: null, active: true, languages: ['English', 'Hindi'], responseTime: 'Usually replies within an hour', verification: ok, ...o })
  const defs = [
    w({ key: 'w1', userId: ananyaUser._id, name: 'Ananya Verma', tone: 0, city: 'Gurugram', area: 'Sector 45', headline: 'Animal-science student who grew up with rescue dogs',
      bio: 'I have looked after dogs and cats since school and I am comfortable with nervous pets. I follow your routine exactly and always send a photo after the walk.',
      experienceYears: 3, rating: 4.9, reviewCount: 48, completedJobs: 62, price: 180, services: ['walking', 'playtime', 'care'], petTypes: ['dog', 'cat'],
      availability: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], slots: ['morning', 'evening'] }, languages: ['English', 'Hindi', 'Punjabi'], joined: '2025-06' }),
    w({ key: 'w2', name: 'Rohan Mehta', tone: 1, city: 'Gurugram', area: 'DLF Phase 3', headline: 'Park walks, fetch and lots of energy',
      bio: 'Runner and weekend volunteer at a local shelter. Best suited for active dogs that love long walks and games of fetch.',
      experienceYears: 5, rating: 4.8, reviewCount: 73, completedJobs: 110, price: 220, services: ['walking', 'playtime', 'sitting'], petTypes: ['dog'],
      availability: { days: ['Fri', 'Sat', 'Sun'], slots: ALL_SLOTS }, joined: '2024-11' }),
    w({ key: 'w3', name: 'Kavya Nair', tone: 2, city: 'Gurugram', area: 'Sohna Road', headline: 'Hostel student, happy to volunteer for free',
      bio: 'I cannot keep a pet in my hostel, so walking yours is the best part of my week. I volunteer for free and only ask for clear instructions.',
      experienceYears: 1, rating: 4.7, reviewCount: 19, completedJobs: 24, price: 0, services: ['walking', 'playtime'], petTypes: ['dog', 'cat', 'rabbit'],
      availability: { days: ['Mon', 'Wed', 'Fri', 'Sun'], slots: ['evening'] }, verification: { id: 'verified', phone: 'verified', background: 'pending' },
      languages: ['English', 'Hindi', 'Malayalam'], joined: '2026-01' }),
    w({ key: 'w4', name: 'Arjun Singh', tone: 3, city: 'New Delhi', area: 'Saket', headline: 'Confident with large and strong breeds',
      bio: 'Six years of experience with labradors, shepherds and huskies. Calm, consistent and firm with leash training.',
      experienceYears: 6, rating: 4.9, reviewCount: 91, completedJobs: 140, price: 300, services: ['walking', 'care', 'sitting'], petTypes: ['dog'],
      availability: { days: ALL_DAYS, slots: ALL_SLOTS }, joined: '2024-08' }),
    w({ key: 'w5', name: 'Simran Kaur', tone: 4, city: 'Noida', area: 'Sector 62', headline: 'Cat whisperer and gentle pet sitter',
      bio: 'I specialise in shy cats, rabbits and birds. I keep things quiet and calm, and send updates so you can relax.',
      experienceYears: 4, rating: 4.8, reviewCount: 56, completedJobs: 80, price: 250, services: ['care', 'sitting', 'playtime'], petTypes: ['cat', 'rabbit', 'bird'],
      availability: { days: ['Tue', 'Thu', 'Sat', 'Sun'], slots: ['morning', 'afternoon'] }, languages: ['English', 'Hindi', 'Punjabi'], joined: '2025-02' }),
    w({ key: 'w6', name: 'Vikram Rao', tone: 5, city: 'Gurugram', area: 'Sector 50', headline: 'Early-morning walks with a steady routine',
      bio: 'I start early and keep to a disciplined schedule. Good for dogs that need structure and a proper morning workout.',
      experienceYears: 8, rating: 4.6, reviewCount: 34, completedJobs: 58, price: 200, services: ['walking', 'playtime'], petTypes: ['dog'],
      availability: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], slots: ['morning'] }, languages: ['English', 'Hindi', 'Telugu'], joined: '2025-04' }),
    w({ key: 'w7', name: 'Meera Iyer', tone: 2, city: 'New Delhi', area: 'Hauz Khas', headline: 'Shelter volunteer who walks for free',
      bio: 'I volunteer with two rescue shelters and love meeting new pets. Weekend walks are free, no strings attached.',
      experienceYears: 2, rating: 4.8, reviewCount: 27, completedJobs: 39, price: 0, services: ['walking', 'playtime', 'care'], petTypes: ['dog', 'cat'],
      availability: { days: ['Sat', 'Sun'], slots: ['morning', 'afternoon'] }, languages: ['English', 'Hindi', 'Tamil'], joined: '2025-09' }),
    w({ key: 'w8', name: 'Aditya Joshi', tone: 1, city: 'Faridabad', area: 'Sector 15', headline: 'Engineering student and golden retriever fan',
      bio: 'New to PawMate but experienced with family dogs. I am available on weekday evenings after college.',
      experienceYears: 1, rating: 4.5, reviewCount: 12, completedJobs: 14, price: 120, services: ['walking', 'playtime'], petTypes: ['dog'],
      availability: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], slots: ['evening'] }, verification: { id: 'pending', phone: 'verified', background: 'none' }, joined: '2026-05' }),
    w({ key: 'w9', name: 'Neha Gupta', tone: 0, city: 'Gurugram', area: 'Golf Course Road', headline: 'Pet sitting with daily photo updates',
      bio: 'Full-day sitting, medication reminders and plenty of cuddles. I share photos and short videos through the day.',
      experienceYears: 5, rating: 4.9, reviewCount: 65, completedJobs: 97, price: 280, services: ['sitting', 'care', 'playtime', 'walking'], petTypes: ['dog', 'cat'],
      availability: { days: ALL_DAYS, slots: ALL_SLOTS }, joined: '2024-12' }),
  ]
  const walkers = {}
  for (const { key, ...d } of defs) {
    walkers[key] = await Walker.create({ ...d, ratingSum: d.rating * d.reviewCount })
  }

  /* ----------------------------- pets ---------------------------- */
  const [bruno, misty, rex] = await Pet.create([
    { ownerId: riya._id, name: 'Bruno', type: 'dog', breed: 'Labrador Retriever', age: 3, vaccinated: true,
      instructions: 'Pulls on the leash for the first 5 minutes. Give water after the walk. No chicken-based treats.' },
    { ownerId: riya._id, name: 'Misty', type: 'cat', breed: 'Indian Shorthair', age: 2, vaccinated: true,
      instructions: 'Shy with strangers, so let her come to you. Fresh water and half a cup of dry food at 6 PM.' },
    { ownerId: karan._id, name: 'Rex', type: 'dog', breed: 'German Shepherd', age: 4, vaccinated: true,
      instructions: 'Very friendly but strong. Use the harness hanging by the door.' },
  ])

  /* --------------------------- bookings -------------------------- */
  const riyaBase = {
    ownerId: riya._id, ownerName: riya.name, ownerPhone: riya.phone,
    address: 'B-204, Park View Apartments, Sector 45, Gurugram',
    emergency: { name: 'Sanjay Kapoor', phone: '98111 22334', relation: 'Parent' },
    vet: { name: 'PetCare Clinic, Sector 44', phone: '99000 11223' },
  }
  const mk = ({ walker, pet, owner = riya, base = riyaBase, status, createdAt, cancelledBy, cancelReason, reviewed = false, ...rest }) => {
    const { subtotal, fee, total } = priceBreakdown(walker.price, rest.hours)
    const free = walker.price === 0
    const paymentStatus = free ? 'Free' : status === 'Completed' ? 'Paid' : status === 'Cancelled' ? 'Refunded' : 'Authorized'
    const history = [{ status: 'Pending', at: createdAt, by: 'owner' }]
    if (['Accepted', 'Completed'].includes(status)) history.push({ status: 'Accepted', at: createdAt, by: 'walker' })
    if (status === 'Completed') history.push({ status: 'Completed', at: createdAt, by: 'walker' })
    if (status === 'Cancelled') history.push({ status: 'Cancelled', at: createdAt, by: cancelledBy || 'owner' })
    return {
      ...base, walkerId: walker._id, walkerName: walker.name,
      petId: pet._id, petName: pet.name, petType: pet.type, petBreed: pet.breed, petInstructions: pet.instructions,
      price: walker.price, subtotal, fee, total, payMethod: free ? 'free' : 'upi', paymentStatus,
      status, statusHistory: history, cancelledBy, cancelReason, reviewed, createdAt, ...rest,
    }
  }
  await Booking.create([
    mk({ walker: walkers.w1, pet: bruno, service: 'walking', date: dayISO(2), slot: 'evening', hours: 1, instructions: 'Please keep Bruno away from other male dogs.', status: 'Pending', createdAt: ago(0, 3) }),
    mk({ walker: walkers.w1, pet: misty, service: 'playtime', date: dayISO(5), slot: 'morning', hours: 2, instructions: 'Use the feather toy. She loves it.', status: 'Accepted', createdAt: ago(1) }),
    mk({ walker: walkers.w2, pet: bruno, service: 'walking', date: dayISO(-3), slot: 'morning', hours: 2, instructions: 'Long walk in the park, please.', status: 'Completed', createdAt: ago(6) }),
    mk({ walker: walkers.w1, pet: bruno, service: 'walking', date: dayISO(-8), slot: 'evening', hours: 1, status: 'Completed', reviewed: true, createdAt: ago(12) }),
    mk({ walker: walkers.w3, pet: bruno, service: 'walking', date: dayISO(-5), slot: 'evening', hours: 1, status: 'Cancelled', cancelledBy: 'walker', cancelReason: 'Exam preparation, sorry!', createdAt: ago(9) }),
    mk({
      walker: walkers.w1, pet: rex, owner: karan, service: 'walking', date: dayISO(1), slot: 'morning', hours: 1, instructions: 'Please take the short route, Rex has a sore paw.',
      status: 'Pending', createdAt: ago(0, 6),
      base: {
        ownerId: karan._id, ownerName: karan.name, ownerPhone: karan.phone, address: 'Tower C, 12th Floor, Sector 50, Gurugram',
        emergency: { name: 'Pooja Malhotra', phone: '99001 22110', relation: 'Sibling' }, vet: { name: 'Paws & Claws Vet', phone: '98000 33445' },
      },
    }),
  ])

  /* ------------------------ reviews and chat ---------------------- */
  const r = (walker, ownerName, rating, offset, text) => ({ walkerId: walkers[walker]._id, ownerName, rating, date: dayISO(offset), text })
  await Review.create([
    r('w1', 'Riya K.', 5, -8, 'Ananya was wonderful with Bruno. She followed all my instructions and sent lovely photos from the walk.'),
    r('w1', 'Devansh T.', 5, -20, 'Reliable and very kind. My beagle gets excited the moment she arrives.'),
    r('w1', 'Ishita R.', 4, -34, 'Great with our cat. Arrived a few minutes late once but let me know in advance.'),
    r('w2', 'Manish S.', 5, -12, 'Rohan tires out my border collie, which is no small task. Highly recommend.'),
    r('w2', 'Priya D.', 5, -40, 'Punctual and cheerful. Brilliant on weekends.'),
    r('w3', 'Aarti M.', 5, -15, 'A free volunteer this good is a gift. Kavya treated our pug like her own.'),
    r('w4', 'Harsh V.', 5, -9, 'Handled my 40 kg husky with ease. Very professional.'),
    r('w5', 'Ritu S.', 5, -18, 'My rescue cat is scared of everyone, yet she hid nowhere while Simran was over.'),
    r('w7', 'Zoya A.', 5, -25, 'Meera is patient and gentle. Our senior lab loved his weekend walks.'),
    r('w9', 'Tanvi B.', 5, -6, 'Daily photos and updates made my work trip so much easier.'),
    r('w6', 'Gaurav N.', 4, -30, 'Very disciplined. My dog is calmer after his morning routine.'),
  ])

  await Conversation.create({
    ownerId: riya._id, ownerName: riya.name, walkerId: walkers.w1._id, walkerUserId: ananyaUser._id, walkerName: 'Ananya Verma',
    messages: [
      { from: 'owner', text: 'Hi Ananya! Are you free for a walk with Bruno this week?', at: ago(1, 5) },
      { from: 'walker', text: 'Hi Riya! Yes, I can do Thursday evening. I will send a photo after the walk.', at: ago(1, 4) },
      { from: 'owner', text: 'Perfect, I will send the request now. Thank you!', at: ago(1, 4) },
    ],
  })
}

// run directly: node src/seed/seed.js [--reset]
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('seed.js')) {
  const reset = process.argv.includes('--reset')
  connectDb()
    .then(() => seedDatabase({ reset }))
    .then(() => {
      console.log('[seed] Done. Demo logins (password Pawmate@123):\n  owner@pawmate.com\n  walker@pawmate.com')
      return disconnectDb()
    })
    .catch(async err => {
      console.error(`[seed] ${err.message}`)
      await mongoose.disconnect()
      process.exit(1)
    })
}
void config
