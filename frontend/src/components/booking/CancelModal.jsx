import { useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import Field from '../ui/Field.jsx'

/** Asks for a short reason before cancelling or declining a booking. */
export default function CancelModal({ state, onClose, onConfirm }) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const decline = state?.kind === 'decline'

  const submit = async e => {
    e.preventDefault()
    if (reason.trim().length < 5) return setError('Please add a short reason so the other person understands')
    setBusy(true)
    await onConfirm(reason.trim())
    setBusy(false)
    setReason('')
    setError('')
  }

  return (
    <Modal open={!!state} onClose={onClose} title={decline ? 'Decline this request?' : 'Cancel this booking?'} size="sm">
      <form onSubmit={submit} noValidate className="stack">
        <p className="muted">
          {decline
            ? 'The owner will be told right away so they can find another walker.'
            : 'The other person will be notified. Any held payment is refunded.'}
        </p>
        <Field as="textarea" rows={3} name="reason" label="Reason" value={reason} error={error} onChange={e => setReason(e.target.value)} />
        <div className="row gap end">
          <Button variant="ghost" onClick={onClose}>Keep it</Button>
          <Button type="submit" variant="danger" loading={busy}>{decline ? 'Decline request' : 'Cancel booking'}</Button>
        </div>
      </form>
    </Modal>
  )
}
