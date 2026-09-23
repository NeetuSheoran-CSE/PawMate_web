import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../ui/Modal.jsx'
import BookingDetails from './BookingDetails.jsx'
import ReviewModal from './ReviewModal.jsx'
import CancelModal from './CancelModal.jsx'
import { api } from '../../services/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'

/**
 * Shared booking actions for both dashboards.
 * Returns `onAction` for <BookingCard /> and `modals` to render once in the page.
 */
export default function useBookingActions({ viewer, onChanged }) {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [details, setDetails] = useState(null)
  const [review, setReview] = useState(null)
  const [cancel, setCancel] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const run = async (id, fn, okMessage) => {
    setBusyId(id)
    try {
      await fn()
      toast.success(okMessage)
      await onChanged?.()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusyId(null)
    }
  }

  const onAction = async (type, b) => {
    switch (type) {
      case 'details': return setDetails(b)
      case 'review': return setReview(b)
      case 'cancel': return setCancel({ booking: b, kind: 'cancel' })
      case 'decline': return setCancel({ booking: b, kind: 'decline' })
      case 'accept':
        return run(b.id, () => api.updateBookingStatus(b.id, 'Accepted', { by: 'walker' }), 'Request accepted. The owner has been notified.')
      case 'complete':
        return run(b.id, () => api.updateBookingStatus(b.id, 'Completed', { by: 'walker' }), 'Marked as completed. Nice work!')
      case 'message': {
        try {
          const owner = viewer === 'owner' ? user : { id: b.ownerId, name: b.ownerName }
          const conv = await api.getOrCreateConversation(owner, b.walkerId)
          navigate(`/messages?c=${conv.id}`)
        } catch (e) {
          toast.error(e.message)
        }
        return undefined
      }
      default: return undefined
    }
  }

  const confirmCancel = async reason => {
    const { booking, kind } = cancel
    await run(
      booking.id,
      () => api.updateBookingStatus(booking.id, 'Cancelled', { by: viewer, reason }),
      kind === 'decline' ? 'Request declined.' : 'Booking cancelled.'
    )
    setCancel(null)
  }

  const modals = (
    <>
      <Modal open={!!details} onClose={() => setDetails(null)} title="Booking details" size="lg">
        {details && <BookingDetails booking={details} viewer={viewer} />}
      </Modal>
      {review && <ReviewModal booking={review} onClose={() => setReview(null)} onDone={onChanged} />}
      <CancelModal state={cancel} onClose={() => setCancel(null)} onConfirm={confirmCancel} />
    </>
  )

  return { onAction, modals, busyId }
}
