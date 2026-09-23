import { Footprints, Bone, HeartHandshake, House } from 'lucide-react'

export const SERVICES = [
  {
    id: 'walking',
    title: 'Pet Walking',
    icon: Footprints,
    short: 'Daily walks and fresh air',
    desc: 'A safe, leashed walk around your neighbourhood so your dog gets exercise while you study or work.',
    includes: ['30–60 minute walks', 'Fresh water and a paw wipe after', 'A short update when you are home'],
  },
  {
    id: 'playtime',
    title: 'Play & Companionship',
    icon: Bone,
    short: 'Fetch, cuddles and attention',
    desc: 'Quality one-on-one time at home or in the park. Ideal for young, energetic or lonely pets.',
    includes: ['Games, fetch and training practice', 'Gentle grooming brush', 'Company for shy or senior pets'],
  },
  {
    id: 'care',
    title: 'Basic Care',
    icon: HeartHandshake,
    short: 'Feeding, water and clean-up',
    desc: 'Simple daily care that follows your instructions to the letter, from meals to litter trays.',
    includes: ['Feeding as per your schedule', 'Fresh water and bowl cleaning', 'Litter or cage clean-up'],
  },
  {
    id: 'sitting',
    title: 'Short-term Sitting',
    icon: House,
    short: 'A few hours up to a day',
    desc: 'Someone caring and present while you are at an exam, an interview or away for the day.',
    includes: ['Time at your home', 'Medication reminders you set', 'Photo updates through the day'],
  },
]

export const PET_TYPES = [
  { id: 'dog', label: 'Dogs', emoji: '🐶' },
  { id: 'cat', label: 'Cats', emoji: '🐱' },
  { id: 'rabbit', label: 'Rabbits', emoji: '🐰' },
  { id: 'bird', label: 'Birds', emoji: '🦜' },
  { id: 'other', label: 'Other', emoji: '🐾' },
]

export const SLOTS = [
  { id: 'morning', label: 'Morning', time: '6 – 10 AM' },
  { id: 'afternoon', label: 'Afternoon', time: '12 – 4 PM' },
  { id: 'evening', label: 'Evening', time: '5 – 9 PM' },
]

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const BOOKING_STATUS = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

export const HOUR_OPTIONS = [1, 2, 3, 4, 6, 8]
export const PLATFORM_FEE_RATE = 0.08
export const MAX_PRICE = 500

export const RELATIONS = ['Parent', 'Sibling', 'Friend', 'Neighbour', 'Roommate', 'Other']

export const CONTACT_TOPICS = [
  'General question',
  'Help with a booking',
  'Safety concern',
  'Becoming a walker',
  'Report a problem',
]

// Replace these with your real support details before launch.
export const SUPPORT = {
  email: 'hello@pawmate.example',
  safetyLine: '+91 90000 00000',
  hours: 'Every day, 7 AM – 11 PM',
}

export const serviceById = id => SERVICES.find(s => s.id === id)
export const petTypeById = id => PET_TYPES.find(p => p.id === id)
export const slotById = id => SLOTS.find(s => s.id === id)
