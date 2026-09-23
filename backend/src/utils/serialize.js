/** Turn database documents into the JSON shapes the React app expects. */

export const publicUser = (user, walker) => ({ ...user.toJSON(), walkerId: walker ? String(walker._id) : null })

export const publicWalker = w => ({ ...w.toJSON(), verified: w.verification?.id === 'verified' })

/**
 * Walkers only see an owner's phone, address and emergency details after accepting the request.
 * This is enforced here on the server, not just hidden in the UI.
 */
export function bookingFor(booking, viewer) {
  const json = booking.toJSON()
  if (viewer === 'walker' && json.status === 'Pending') {
    return { ...json, ownerPhone: '', address: '', emergency: null, vet: null }
  }
  return json
}
