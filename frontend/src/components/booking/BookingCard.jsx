import { CalendarDays, Clock, IndianRupee, MessageCircle } from 'lucide-react'
import Avatar from '../ui/Avatar.jsx'
import Button from '../ui/Button.jsx'
import StatusBadge from '../ui/StatusBadge.jsx'
import { serviceById, slotById } from '../../data/constants.js'
import { formatDate, formatINR } from '../../utils/format.js'

/** One booking in a list. The parent decides what each action does via onAction(type, booking). */
export default function BookingCard({ booking: b, viewer, onAction, busy }) {
  const service = serviceById(b.service)
  const slot = slotById(b.slot)
  const other = viewer === 'owner' ? b.walkerName : b.ownerName
  const act = type => () => onAction(type, b)

  return (
    <article className="booking-card card">
      <header className="row between top wrap gap-sm">
        <div className="row gap">
          <Avatar name={other} size={46} tone={other.length} />
          <div>
            <h3 className="h5">{b.petName}, {service?.title}</h3>
            <p className="muted">{viewer === 'owner' ? 'With' : 'For'} {other}</p>
          </div>
        </div>
        <StatusBadge status={b.status} />
      </header>

      <ul className="facts">
        <li><CalendarDays size={16} aria-hidden /> {formatDate(b.date)}</li>
        <li><Clock size={16} aria-hidden /> {slot?.label}, {slot?.time} for {b.hours} hr</li>
        <li>
          <IndianRupee size={16} aria-hidden />
          {b.total === 0 ? 'Free volunteer' : `${formatINR(b.total)}, ${b.paymentStatus.toLowerCase()}`}
        </li>
      </ul>

      {b.status === 'Cancelled' && b.cancelReason && (
        <p className="note note-warn">Cancelled by the {b.cancelledBy}: {b.cancelReason}</p>
      )}

      <div className="row gap-sm wrap card-actions">
        {viewer === 'walker' && b.status === 'Pending' && (
          <>
            <Button size="sm" onClick={act('accept')} loading={busy}>Accept</Button>
            <Button size="sm" variant="outline" onClick={act('decline')} disabled={busy}>Decline</Button>
          </>
        )}
        {viewer === 'walker' && b.status === 'Accepted' && (
          <>
            <Button size="sm" onClick={act('complete')} loading={busy}>Mark completed</Button>
            <Button size="sm" variant="ghost" onClick={act('cancel')} disabled={busy}>Cancel</Button>
          </>
        )}
        {viewer === 'owner' && ['Pending', 'Accepted'].includes(b.status) && (
          <Button size="sm" variant="ghost" onClick={act('cancel')}>Cancel booking</Button>
        )}
        {viewer === 'owner' && b.status === 'Completed' && !b.reviewed && (
          <Button size="sm" variant="accent" onClick={act('review')}>Leave a review</Button>
        )}
        {viewer === 'owner' && b.status === 'Completed' && b.reviewed && <span className="muted">Reviewed</span>}
        <Button size="sm" variant="outline" icon={MessageCircle} onClick={act('message')}>Message</Button>
        <Button size="sm" variant="ghost" onClick={act('details')}>Details</Button>
      </div>
    </article>
  )
}
