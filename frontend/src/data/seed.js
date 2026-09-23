// Sample data used by the mock API (services/api.js).
// All people, reviews and numbers below are made up for demo purposes.
import { addDays, priceBreakdown, toISO } from '../utils/format.js'

const D = n => toISO(addDays(new Date(), n))
const ago = (days, hours = 0) => new Date(Date.now() - days * 864e5 - hours * 36e5).toISOString()

export const DEMO_PASSWORD = 'Pawmate@123'
export const DEMO_ACCOUNTS = {
  owner: 'owner@pawmate.com',
  walker: 'walker@pawmate.com',
}

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const ALL_SLOTS = ['morning', 'afternoon', 'evening']

const walker = (o) => ({
  userId: null,
  active: true,
  languages: ['English', 'Hindi'],
  responseTime: 'Usually replies within an hour',
  verification: { id: 'verified', phone: 'verified', background: 'verified' },
  photo: null,
  ...o,
})

const walkers = [
  walker({
    id: 'w1', userId: 'u-walker1', name: 'Ananya Verma', tone: 0, city: 'Gurugram', area: 'Sector 45',
    headline: 'Animal-science student who grew up with rescue dogs',
    bio: 'I have looked after dogs and cats since school and I am comfortable with nervous pets. I follow your routine exactly and always send a photo after the walk.',
    experienceYears: 3, rating: 4.9, reviewCount: 48, completedJobs: 62, price: 180,
    services: ['walking', 'playtime', 'care'], petTypes: ['dog', 'cat'],
    availability: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], slots: ['morning', 'evening'] },
    languages: ['English', 'Hindi', 'Punjabi'], joined: '2025-06',
  }),
  walker({
    id: 'w2', name: 'Rohan Mehta', tone: 1, city: 'Gurugram', area: 'DLF Phase 3',
    headline: 'Park walks, fetch and lots of energy',
    bio: 'Runner and weekend volunteer at a local shelter. Best suited for active dogs that love long walks and games of fetch.',
    experienceYears: 5, rating: 4.8, reviewCount: 73, completedJobs: 110, price: 220,
    services: ['walking', 'playtime', 'sitting'], petTypes: ['dog'],
    availability: { days: ['Fri', 'Sat', 'Sun'], slots: ALL_SLOTS }, joined: '2024-11',
  }),
  walker({
    id: 'w3', name: 'Kavya Nair', tone: 2, city: 'Gurugram', area: 'Sohna Road',
    headline: 'Hostel student, happy to volunteer for free',
    bio: 'I cannot keep a pet in my hostel, so walking yours is the best part of my week. I volunteer for free and only ask for clear instructions.',
    experienceYears: 1, rating: 4.7, reviewCount: 19, completedJobs: 24, price: 0,
    services: ['walking', 'playtime'], petTypes: ['dog', 'cat', 'rabbit'],
    availability: { days: ['Mon', 'Wed', 'Fri', 'Sun'], slots: ['evening'] },
    verification: { id: 'verified', phone: 'verified', background: 'pending' },
    languages: ['English', 'Hindi', 'Malayalam'], joined: '2026-01',
  }),
  walker({
    id: 'w4', name: 'Arjun Singh', tone: 3, city: 'New Delhi', area: 'Saket',
    headline: 'Confident with large and strong breeds',
    bio: 'Six years of experience with labradors, shepherds and huskies. Calm, consistent and firm with leash training.',
    experienceYears: 6, rating: 4.9, reviewCount: 91, completedJobs: 140, price: 300,
    services: ['walking', 'care', 'sitting'], petTypes: ['dog'],
    availability: { days: ALL_DAYS, slots: ALL_SLOTS }, joined: '2024-08',
  }),
  walker({
    id: 'w5', name: 'Simran Kaur', tone: 4, city: 'Noida', area: 'Sector 62',
    headline: 'Cat whisperer and gentle pet sitter',
    bio: 'I specialise in shy cats, rabbits and birds. I keep things quiet and calm, and send updates so you can relax.',
    experienceYears: 4, rating: 4.8, reviewCount: 56, completedJobs: 80, price: 250,
    services: ['care', 'sitting', 'playtime'], petTypes: ['cat', 'rabbit', 'bird'],
    availability: { days: ['Tue', 'Thu', 'Sat', 'Sun'], slots: ['morning', 'afternoon'] },
    languages: ['English', 'Hindi', 'Punjabi'], joined: '2025-02',
  }),
  walker({
    id: 'w6', name: 'Vikram Rao', tone: 5, city: 'Gurugram', area: 'Sector 50',
    headline: 'Early-morning walks with a steady routine',
    bio: 'I start early and keep to a disciplined schedule. Good for dogs that need structure and a proper morning workout.',
    experienceYears: 8, rating: 4.6, reviewCount: 34, completedJobs: 58, price: 200,
    services: ['walking', 'playtime'], petTypes: ['dog'],
    availability: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], slots: ['morning'] },
    languages: ['English', 'Hindi', 'Telugu'], joined: '2025-04',
  }),
  walker({
    id: 'w7', name: 'Meera Iyer', tone: 2, city: 'New Delhi', area: 'Hauz Khas',
    headline: 'Shelter volunteer who walks for free',
    bio: 'I volunteer with two rescue shelters and love meeting new pets. Weekend walks are free, no strings attached.',
    experienceYears: 2, rating: 4.8, reviewCount: 27, completedJobs: 39, price: 0,
    services: ['walking', 'playtime', 'care'], petTypes: ['dog', 'cat'],
    availability: { days: ['Sat', 'Sun'], slots: ['morning', 'afternoon'] },
    languages: ['English', 'Hindi', 'Tamil'], joined: '2025-09',
  }),
  walker({
    id: 'w8', name: 'Aditya Joshi', tone: 1, city: 'Faridabad', area: 'Sector 15',
    headline: 'Engineering student and golden retriever fan',
    bio: 'New to PawMate but experienced with family dogs. I am available on weekday evenings after college.',
    experienceYears: 1, rating: 4.5, reviewCount: 12, completedJobs: 14, price: 120,
    services: ['walking', 'playtime'], petTypes: ['dog'],
    availability: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], slots: ['evening'] },
    verification: { id: 'pending', phone: 'verified', background: 'none' }, joined: '2026-05',
  }),
  walker({
    id: 'w9', name: 'Neha Gupta', tone: 0, city: 'Gurugram', area: 'Golf Course Road',
    headline: 'Pet sitting with daily photo updates',
    bio: 'Full-day sitting, medication reminders and plenty of cuddles. I share photos and short videos through the day.',
    experienceYears: 5, rating: 4.9, reviewCount: 65, completedJobs: 97, price: 280,
    services: ['sitting', 'care', 'playtime', 'walking'], petTypes: ['dog', 'cat'],
    availability: { days: ALL_DAYS, slots: ALL_SLOTS }, joined: '2024-12',
  }),
]

const users = [
  {
    id: 'u-owner1', name: 'Riya Kapoor', email: DEMO_ACCOUNTS.owner, password: DEMO_PASSWORD, role: 'owner',
    phone: '98765 43210', city: 'Gurugram', bio: 'Working in marketing. Bruno and Misty keep me company.',
    emergencyContact: { name: 'Sanjay Kapoor', phone: '98111 22334', relation: 'Parent' },
    vet: { name: 'PetCare Clinic, Sector 44', phone: '99000 11223' },
    createdAt: ago(120),
  },
  {
    id: 'u-walker1', name: 'Ananya Verma', email: DEMO_ACCOUNTS.walker, password: DEMO_PASSWORD, role: 'walker',
    phone: '98100 55667', city: 'Gurugram', bio: 'Animal-science student who loves dogs.',
    emergencyContact: null, vet: null, createdAt: ago(200),
  },
]

const pets = [
  {
    id: 'p1', ownerId: 'u-owner1', name: 'Bruno', type: 'dog', breed: 'Labrador Retriever', age: 3, vaccinated: true,
    instructions: 'Pulls on the leash for the first 5 minutes. Give water after the walk. No chicken-based treats.',
  },
  {
    id: 'p2', ownerId: 'u-owner1', name: 'Misty', type: 'cat', breed: 'Indian Shorthair', age: 2, vaccinated: true,
    instructions: 'Shy with strangers, so let her come to you. Fresh water and half a cup of dry food at 6 PM.',
  },
]

function booking(o) {
  const w = walkers.find(x => x.id === o.walkerId)
  const price = w.price
  const { subtotal, fee, total } = priceBreakdown(price, o.hours)
  const paymentStatus =
    price === 0 ? 'Free' :
    o.status === 'Completed' ? 'Paid' :
    o.status === 'Cancelled' ? 'Refunded' : 'Authorized'
  const history = [{ status: 'Pending', at: o.createdAt, by: 'owner' }]
  if (['Accepted', 'Completed'].includes(o.status)) history.push({ status: 'Accepted', at: o.createdAt, by: 'walker' })
  if (o.status === 'Completed') history.push({ status: 'Completed', at: o.createdAt, by: 'walker' })
  if (o.status === 'Cancelled') history.push({ status: 'Cancelled', at: o.createdAt, by: o.cancelledBy || 'owner' })
  return {
    walkerName: w.name, price, subtotal, fee, total, hours: 1, payMethod: price === 0 ? 'free' : 'upi',
    paymentStatus, reviewed: false, statusHistory: history,
    ownerId: 'u-owner1', ownerName: 'Riya Kapoor', ownerPhone: '98765 43210',
    address: 'B-204, Park View Apartments, Sector 45, Gurugram',
    emergency: { name: 'Sanjay Kapoor', phone: '98111 22334', relation: 'Parent' },
    vet: { name: 'PetCare Clinic, Sector 44', phone: '99000 11223' },
    ...o,
  }
}

const bruno = { petId: 'p1', petName: 'Bruno', petType: 'dog', petBreed: 'Labrador Retriever', petInstructions: pets[0].instructions }
const misty = { petId: 'p2', petName: 'Misty', petType: 'cat', petBreed: 'Indian Shorthair', petInstructions: pets[1].instructions }

const bookings = [
  booking({ id: 'b1', walkerId: 'w1', ...bruno, service: 'walking', date: D(2), slot: 'evening', hours: 1,
    instructions: 'Please keep Bruno away from other male dogs.', status: 'Pending', createdAt: ago(0, 3) }),
  booking({ id: 'b2', walkerId: 'w1', ...misty, service: 'playtime', date: D(5), slot: 'morning', hours: 2,
    instructions: 'Use the feather toy. She loves it.', status: 'Accepted', createdAt: ago(1) }),
  booking({ id: 'b3', walkerId: 'w2', ...bruno, service: 'walking', date: D(-3), slot: 'morning', hours: 2,
    instructions: 'Long walk in the park, please.', status: 'Completed', createdAt: ago(6) }),
  booking({ id: 'b4', walkerId: 'w1', ...bruno, service: 'walking', date: D(-8), slot: 'evening', hours: 1,
    instructions: '', status: 'Completed', reviewed: true, createdAt: ago(12) }),
  booking({ id: 'b5', walkerId: 'w3', ...bruno, service: 'walking', date: D(-5), slot: 'evening', hours: 1,
    instructions: '', status: 'Cancelled', cancelledBy: 'walker', cancelReason: 'Exam preparation, sorry!', createdAt: ago(9) }),
  booking({ id: 'b6', walkerId: 'w1', ownerId: 'u-owner2', ownerName: 'Karan Malhotra', ownerPhone: '99887 76655',
    petId: 'px1', petName: 'Rex', petType: 'dog', petBreed: 'German Shepherd',
    petInstructions: 'Very friendly but strong. Use the harness hanging by the door.',
    service: 'walking', date: D(1), slot: 'morning', hours: 1, instructions: 'Please take the short route, Rex has a sore paw.',
    address: 'Tower C, 12th Floor, Sector 50, Gurugram',
    emergency: { name: 'Pooja Malhotra', phone: '99001 22110', relation: 'Sibling' },
    vet: { name: 'Paws & Claws Vet', phone: '98000 33445' }, status: 'Pending', createdAt: ago(0, 6) }),
]

const reviews = [
  { id: 'r1', walkerId: 'w1', ownerId: 'u-owner1', ownerName: 'Riya K.', rating: 5, date: D(-8), bookingId: 'b4',
    text: 'Ananya was wonderful with Bruno. She followed all my instructions and sent lovely photos from the walk.' },
  { id: 'r2', walkerId: 'w1', ownerId: 'x1', ownerName: 'Devansh T.', rating: 5, date: D(-20),
    text: 'Reliable and very kind. My beagle gets excited the moment she arrives.' },
  { id: 'r3', walkerId: 'w1', ownerId: 'x2', ownerName: 'Ishita R.', rating: 4, date: D(-34),
    text: 'Great with our cat. Arrived a few minutes late once but let me know in advance.' },
  { id: 'r4', walkerId: 'w2', ownerId: 'x3', ownerName: 'Manish S.', rating: 5, date: D(-12),
    text: 'Rohan tires out my border collie, which is no small task. Highly recommend.' },
  { id: 'r5', walkerId: 'w2', ownerId: 'x4', ownerName: 'Priya D.', rating: 5, date: D(-40),
    text: 'Punctual and cheerful. Brilliant on weekends.' },
  { id: 'r6', walkerId: 'w3', ownerId: 'x5', ownerName: 'Aarti M.', rating: 5, date: D(-15),
    text: 'A free volunteer this good is a gift. Kavya treated our pug like her own.' },
  { id: 'r7', walkerId: 'w4', ownerId: 'x6', ownerName: 'Harsh V.', rating: 5, date: D(-9),
    text: 'Handled my 40 kg husky with ease. Very professional.' },
  { id: 'r8', walkerId: 'w5', ownerId: 'x7', ownerName: 'Ritu S.', rating: 5, date: D(-18),
    text: 'My rescue cat is scared of everyone, yet she hid nowhere while Simran was over.' },
  { id: 'r9', walkerId: 'w7', ownerId: 'x8', ownerName: 'Zoya A.', rating: 5, date: D(-25),
    text: 'Meera is patient and gentle. Our senior lab loved his weekend walks.' },
  { id: 'r10', walkerId: 'w9', ownerId: 'x9', ownerName: 'Tanvi B.', rating: 5, date: D(-6),
    text: 'Daily photos and updates made my work trip so much easier.' },
  { id: 'r11', walkerId: 'w6', ownerId: 'x10', ownerName: 'Gaurav N.', rating: 4, date: D(-30),
    text: 'Very disciplined. My dog is calmer after his morning routine.' },
]

const conversations = [
  {
    id: 'c1', ownerId: 'u-owner1', ownerName: 'Riya Kapoor', walkerId: 'w1', walkerName: 'Ananya Verma',
    messages: [
      { id: 'm1', from: 'owner', text: 'Hi Ananya! Are you free for a walk with Bruno this week?', at: ago(1, 5) },
      { id: 'm2', from: 'walker', text: 'Hi Riya! Yes, I can do Thursday evening. I will send a photo after the walk.', at: ago(1, 4) },
      { id: 'm3', from: 'owner', text: 'Perfect, I will send the request now. Thank you!', at: ago(1, 4) },
    ],
  },
]

export function seedDb() {
  return JSON.parse(JSON.stringify({ users, walkers, pets, bookings, reviews, conversations, contactMessages: [] }))
}
