import { useRef, useState } from 'react'
import { BadgeCheck, Clock3, Circle, Upload } from 'lucide-react'
import Button from '../ui/Button.jsx'

const STEPS = [
  { key: 'phone', title: 'Phone number', text: 'Confirms owners can reach you.' },
  { key: 'id', title: 'Government ID', text: 'Upload a photo of an Aadhaar, PAN, college ID or similar.' },
  { key: 'background', title: 'Background check', text: 'An optional extra check that earns a trust boost.' },
]

const icon = s => (s === 'verified' ? <BadgeCheck className="ok" size={22} /> : s === 'pending' ? <Clock3 className="wait" size={22} /> : <Circle className="none" size={22} />)
const label = s => (s === 'verified' ? 'Verified' : s === 'pending' ? 'In review' : 'Not started')

export default function VerificationCard({ walker, onUpload }) {
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const pick = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return setError('Please choose a file under 5 MB')
    setError('')
    setBusy(true)
    await onUpload(file)
    setBusy(false)
  }

  return (
    <div className="card stack">
      <h3>Profile verification</h3>
      <p className="muted">Verified walkers get more requests. Your documents are only used to confirm who you are.</p>
      <ul className="verify-list">
        {STEPS.map(s => (
          <li key={s.key}>
            {icon(walker.verification[s.key])}
            <div className="grow"><strong>{s.title}</strong><p className="muted small">{s.text}</p></div>
            <span className={`verify-state v-${walker.verification[s.key]}`}>{label(walker.verification[s.key])}</span>
          </li>
        ))}
      </ul>
      {walker.verification.id !== 'verified' && (
        <>
          <input ref={inputRef} type="file" accept="image/*,.pdf" hidden onChange={pick} aria-label="Upload ID document" />
          <Button variant="outline" icon={Upload} loading={busy} onClick={() => inputRef.current?.click()}>
            {walker.verification.id === 'pending' ? 'Upload a different ID' : 'Upload your ID'}
          </Button>
          {walker.idFileName && <p className="muted small">Submitted: {walker.idFileName}</p>}
          {error && <p className="field-error" role="alert">{error}</p>}
        </>
      )}
    </div>
  )
}
