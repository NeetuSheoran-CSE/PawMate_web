import { CheckCircle2, Clock3, PartyPopper, XCircle } from 'lucide-react'

const MAP = {
  Pending: { cls: 'status-pending', Icon: Clock3 },
  Accepted: { cls: 'status-accepted', Icon: CheckCircle2 },
  Completed: { cls: 'status-completed', Icon: PartyPopper },
  Cancelled: { cls: 'status-cancelled', Icon: XCircle },
}

export default function StatusBadge({ status }) {
  const { cls, Icon } = MAP[status] || MAP.Pending
  return (
    <span className={`badge ${cls}`}>
      <Icon size={14} aria-hidden />
      {status}
    </span>
  )
}
