// Marketing copy and sample testimonials. Replace with real content later.
import { BadgeCheck, Star, Siren, ClipboardList, CalendarCheck } from 'lucide-react'

export const TRUST_FEATURES = [
  { icon: BadgeCheck, title: 'Profile verification', text: 'Walkers submit ID and a phone number. Verified profiles wear a green badge.' },
  { icon: Star, title: 'Reviews and ratings', text: 'Only owners who completed a booking can review, so ratings stay honest.' },
  { icon: Siren, title: 'Emergency contact', text: 'Every booking carries an emergency contact and your vet details.' },
  { icon: ClipboardList, title: 'Pet-specific instructions', text: 'Feeding, fears, medication. Your walker sees it all before the visit.' },
  { icon: CalendarCheck, title: 'Clear booking details', text: 'Date, time, price and status in one place, from request to completion.' },
]

export const TESTIMONIALS = [
  { name: 'Riya K.', role: 'Pet owner, Gurugram', text: 'I leave for work at 8 and Bruno used to wait all day. Now he has a walk at noon and I get a photo. Worth every rupee.' },
  { name: 'Kavya N.', role: 'Hostel student, walker', text: 'Hostel rules mean no pets, but I get to play with two dogs every week. It is the best part of my evening.' },
  { name: 'Arjun S.', role: 'Walker and student', text: 'I pay part of my fees walking dogs after college. I choose my hours and my price, and nobody micromanages.' },
]

export const OWNER_STEPS = [
  { title: 'Search nearby', text: 'Enter your area and filter by pet type, service, availability and price.' },
  { title: 'Check the profile', text: 'Read reviews, see the verification badge and check the calendar.' },
  { title: 'Send a request', text: 'Share your pet details, instructions and an emergency contact.' },
  { title: 'Relax and review', text: 'Get updates, mark the booking complete and leave an honest review.' },
]

export const WALKER_STEPS = [
  { title: 'Create your profile', text: 'Tell owners about yourself, your experience and the pets you love.' },
  { title: 'Get verified', text: 'Upload an ID so owners can trust who is at their door.' },
  { title: 'Set your terms', text: 'Choose services, weekly availability, area and price, or volunteer for free.' },
  { title: 'Accept and earn', text: 'Accept the requests you like, care for the pet and get paid.' },
]

export const FAQS = [
  { q: 'How does PawMate keep my pet safe?', a: 'Walkers can verify their ID, every booking carries an emergency contact and your pet\u2019s instructions, and only owners who completed a booking can leave reviews. You can also message the walker before you book.' },
  { q: 'Can I volunteer without charging anything?', a: 'Yes. When you create your walker profile you can pick the volunteer option and set your price to zero. Owners will see a Free badge on your card.' },
  { q: 'How does payment work?', a: 'Owners pay by UPI or card when they send a request, and the amount is held until the booking is completed. Cash on completion is also available. This demo does not move real money.' },
  { q: 'What if a walker cancels?', a: 'You are notified straight away and any held payment is refunded. You can then send a request to another walker from your dashboard.' },
  { q: 'Which pets can be booked?', a: 'Dogs, cats, rabbits and birds. Each walker lists the pets they are comfortable with, and you can filter by pet type.' },
  { q: 'Do I need to have a pet to sign up as a walker?', a: 'No. Many of our walkers are students in hostels or PGs who love animals but cannot keep one.' },
]
