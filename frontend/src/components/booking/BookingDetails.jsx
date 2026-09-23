import { MapPin, Phone, ShieldAlert, Stethoscope } from 'lucide-react'
import StatusBadge from '../ui/StatusBadge.jsx'
import { petTypeById, serviceById, slotById } from '../../data/constants.js'
import { formatDate, formatDateTime, formatINR } from '../../utils/format.js'

const tel = n => `tel:${String(n).replace(/[^\d+]/g, '')}`

/** Every detail about a booking, laid out clearly. Shown inside a modal. */
export default function BookingDetails({ booking: b, viewer }) {
  const service = serviceById(b.service)
  const slot = slotById(b.slot)
  const canSeeContacts = viewer === 'owner' || ['Accepted', 'Completed'].includes(b.status)

  return (
    <div className="stack">
      <div className="row between wrap gap-sm">
        <p className="muted">Booking ID {b.id}</p>
        <StatusBadge status={b.status} />
      </div>

      <section className="detail-block">
        <h4>Service and schedule</h4>
        <dl className="dl">
          <div><dt>Service</dt><dd>{service?.title}</dd></div>
          <div><dt>Date</dt><dd>{formatDate(b.date, { weekday: 'long', day: 'numeric', month: 'long' })}</dd></div>
          <div><dt>Time</dt><dd>{slot?.label}, {slot?.time}</dd></div>
          <div><dt>Duration</dt><dd>{b.hours} hour{b.hours > 1 ? 's' : ''}</dd></div>
          <div><dt>{viewer === 'owner' ? 'Walker' : 'Pet owner'}</dt><dd>{viewer === 'owner' ? b.walkerName : b.ownerName}</dd></div>
          {viewer === 'walker' && canSeeContacts && <div><dt>Owner phone</dt><dd><a href={tel(b.ownerPhone)}>{b.ownerPhone}</a></dd></div>}
        </dl>
        <p className="row gap-xs top"><MapPin size={16} aria-hidden /> <span>{b.address || 'The address is shared once you accept this request.'}</span></p>
      </section>

      <section className="detail-block">
        <h4>Pet</h4>
        <p><strong>{b.petName}</strong>, {petTypeById(b.petType)?.emoji} {b.petBreed}</p>
        {b.petInstructions && <p className="note">Pet instructions: {b.petInstructions}</p>}
        {b.instructions && <p className="note">Request for this visit: {b.instructions}</p>}
      </section>

      <section className="detail-block emergency-box">
        <h4 className="row gap-xs"><ShieldAlert size={18} aria-hidden /> Emergency information</h4>
        {canSeeContacts ? (
          <dl className="dl">
            <div><dt>Emergency contact</dt><dd>{b.emergency?.name} ({b.emergency?.relation})</dd></div>
            <div><dt>Phone</dt><dd><a href={tel(b.emergency?.phone)} className="row gap-xs"><Phone size={15} aria-hidden /> {b.emergency?.phone}</a></dd></div>
            {b.vet?.name && (
              <div><dt>Vet</dt><dd className="row gap-xs"><Stethoscope size={15} aria-hidden /> {b.vet.name}{b.vet.phone && <>, <a href={tel(b.vet.phone)}>{b.vet.phone}</a></>}</dd></div>
            )}
          </dl>
        ) : (
          <p className="muted">Phone numbers and the emergency contact are shared with you once you accept this request.</p>
        )}
      </section>

      <section className="detail-block">
        <h4>Payment</h4>
        {b.price === 0 ? (
          <p>This is a free volunteer booking. Nothing to pay.</p>
        ) : (
          <dl className="dl">
            <div><dt>{formatINR(b.price)} × {b.hours} hr</dt><dd>{formatINR(b.subtotal)}</dd></div>
            <div><dt>Service fee</dt><dd>{formatINR(b.fee)}</dd></div>
            <div className="dl-total"><dt>Total</dt><dd>{formatINR(b.total)}</dd></div>
            <div><dt>Method</dt><dd>{{ upi: 'UPI', card: 'Card', cash: 'Cash on completion' }[b.payMethod]}</dd></div>
            <div><dt>Status</dt><dd>{b.paymentStatus}</dd></div>
          </dl>
        )}
      </section>

      <section className="detail-block">
        <h4>Timeline</h4>
        <ol className="timeline">
          {b.statusHistory.map((h, i) => (
            <li key={i}><strong>{h.status}</strong> <span className="muted">by {h.by} on {formatDateTime(h.at)}</span></li>
          ))}
        </ol>
        {b.cancelReason && <p className="note note-warn">Reason: {b.cancelReason}</p>}
      </section>
    </div>
  )
}
