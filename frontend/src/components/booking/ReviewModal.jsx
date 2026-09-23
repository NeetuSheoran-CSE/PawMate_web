import { useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import Field from '../ui/Field.jsx'
import { RatingInput } from '../ui/Rating.jsx'
import { api } from '../../services/api.js'
import { useToast } from '../../context/ToastContext.jsx'

export default function ReviewModal({ booking, onClose, onDone }) {
  const toast = useToast()
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const submit = async e => {
    e.preventDefault()
    const next = {}
    if (!rating) next.rating = 'Choose a star rating'
    if (text.trim().length < 10) next.text = 'Write at least 10 characters so others find it useful'
    setErrors(next)
    if (Object.keys(next).length) return
    setBusy(true)
    try {
      await api.addReview({ bookingId: booking.id, rating, text })
      toast.success('Thanks for your review!')
      onDone?.()
      onClose()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={!!booking} onClose={onClose} title={`Review ${booking?.walkerName || ''}`}>
      <form onSubmit={submit} noValidate className="stack">
        <RatingInput value={rating} onChange={setRating} error={errors.rating} />
        <Field
          as="textarea" rows={4} name="review" label="Your review" value={text} error={errors.text}
          placeholder={`How was ${booking?.petName}'s time?`} onChange={e => setText(e.target.value)}
        />
        <div className="row gap end">
          <Button variant="ghost" onClick={onClose}>Not now</Button>
          <Button type="submit" loading={busy}>Post review</Button>
        </div>
      </form>
    </Modal>
  )
}
