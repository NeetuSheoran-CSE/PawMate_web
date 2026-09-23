import { Loader2 } from 'lucide-react'

export default function Spinner({ label = 'Loading' }) {
  return (
    <div className="page-loader" role="status">
      <Loader2 className="spin" size={32} aria-hidden />
      <span>{label}…</span>
    </div>
  )
}
