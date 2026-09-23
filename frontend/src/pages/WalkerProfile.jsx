import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BadgeCheck, Clock3, Languages, MapPin, MessageCircle, ShieldCheck, UserX, HandHeart, Briefcase, CircleCheck, Circle } from 'lucide-react'
import Avatar from '../components/ui/Avatar.jsx'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import { Rating } from '../components/ui/Rating.jsx'
import AvailabilityCalendar from '../components/calendar/AvailabilityCalendar.jsx'
import { SLOTS, petTypeById, serviceById } from '../data/constants.js'
import { api } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { formatDate, formatINR } from '../utils/format.js'

const stateOf = s => (s === 'verified' ? 'ok' : s === 'pending' ? 'wait' : 'none')

export default function WalkerProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()
  const [walker, setWalker] = useState(undefined)
  const [reviews, setReviews] = useState([])
  const [busy, setBusy] = useState(false)
  useDocumentTitle(walker?.name)

  useEffect(() => {
    let alive = true
    setWalker(undefined)
    Promise.all([api.getWalker(id), api.getWalkerReviews(id)])
      .then(([w, r]) => {
        if (!alive) return
        setWalker(w)
        setReviews(r)
      })
      .catch(err => {
        if (!alive) return
        toast.error(err.message)
        setWalker(null)
      })
    return () => { alive = false }
  }, [id])

  if (walker === undefined) return <Spinner label="Loading profile" />
  if (!walker) {
    return (
      <div className="container section">
        <EmptyState icon={UserX} title="Walker not found" text="This profile may have been removed." action={<Button to="/find-walker">Browse walkers</Button>} />
      </div>
    )
  }

  const isMe = user && user.walkerId === walker.id
  const canBook = !isMe && (!user || ['owner', 'both'].includes(user.role))

  const message = async () => {
    if (!user) return navigate('/login', { state: { from: `/walkers/${walker.id}` } })
    setBusy(true)
    try {
      const conv = await api.getOrCreateConversation(user, walker.id)
      navigate(`/messages?c=${conv.id}`)
    } catch (e) {
      toast.error(e.message)
      setBusy(false)
    }
    return undefined
  }

  return (
    <div className="container profile-layout section-sm">
      <div className="stack-lg">
        <section className="card profile-head">
          <Avatar name={walker.name} photo={walker.photo} size={104} tone={walker.tone} />
          <div className="grow">
            <h1 className="h2 row gap-sm wrap">
              {walker.name}
              {walker.verified && <Badge icon={BadgeCheck}>Verified</Badge>}
              {walker.price === 0 && <Badge tone="orange" icon={HandHeart}>Free volunteer</Badge>}
            </h1>
            <p className="lead-sm">{walker.headline}</p>
            <ul className="facts">
              <li><MapPin size={16} aria-hidden /> {walker.area}, {walker.city}</li>
              <li><Briefcase size={16} aria-hidden /> {walker.experienceYears} year{walker.experienceYears === 1 ? '' : 's'} experience, {walker.completedJobs} bookings done</li>
              <li><Clock3 size={16} aria-hidden /> {walker.responseTime}</li>
              <li><Languages size={16} aria-hidden /> {walker.languages.join(', ')}</li>
            </ul>
            {walker.reviewCount > 0 && <Rating value={walker.rating} count={walker.reviewCount} size={18} />}
          </div>
        </section>

        <section className="card stack">
          <h2 className="h4">About {walker.name.split(' ')[0]}</h2>
          <p>{walker.bio}</p>
          <div>
            <h3 className="h5">Pets welcome</h3>
            <ul className="tag-row">{walker.petTypes.map(t => <li key={t} className="tag">{petTypeById(t)?.emoji} {petTypeById(t)?.label}</li>)}</ul>
          </div>
        </section>

        <section className="card stack">
          <h2 className="h4">Services</h2>
          <ul className="service-list">
            {walker.services.map(sid => {
              const s = serviceById(sid)
              return (
                <li key={sid}>
                  <span className="icon-tile sm"><s.icon size={20} aria-hidden /></span>
                  <div className="grow"><strong>{s.title}</strong><p className="muted">{s.short}</p></div>
                  <span className="price-sm">{walker.price === 0 ? 'Free' : `${formatINR(walker.price)}/hr`}</span>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="card stack">
          <h2 className="h4">Availability</h2>
          <div className="split">
            <AvailabilityCalendar availableDays={walker.availability.days} />
            <div className="stack-sm">
              <h3 className="h5">Time slots</h3>
              <ul className="slot-list">
                {SLOTS.map(s => (
                  <li key={s.id} className={walker.availability.slots.includes(s.id) ? '' : 'off'}>
                    <strong>{s.label}</strong><span>{s.time}</span>
                  </li>
                ))}
              </ul>
              <p className="muted small">Pick a date and slot on the booking page.</p>
            </div>
          </div>
        </section>

        <section className="card stack">
          <h2 className="h4">Reviews {walker.reviewCount > 0 && <span className="muted">({walker.reviewCount})</span>}</h2>
          {reviews.length === 0 ? (
            <p className="muted">No reviews yet. Reviews appear here after completed bookings.</p>
          ) : (
            <ul className="review-list">
              {reviews.map(r => (
                <li key={r.id}>
                  <div className="row between wrap"><strong>{r.ownerName}</strong><span className="muted small">{formatDate(r.date, { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
                  <Rating value={r.rating} size={14} />
                  <p>{r.text}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <aside className="stack sticky-col">
        <div className="card stack book-card">
          <p className="price-lg">{walker.price === 0 ? <strong>Free</strong> : <><strong>{formatINR(walker.price)}</strong><span className="muted"> / hour</span></>}</p>
          {isMe ? (
            <Button to="/dashboard/walker" block>Go to your dashboard</Button>
          ) : canBook ? (
            <Button to={`/book/${walker.id}`} block size="lg">Request a booking</Button>
          ) : (
            <p className="note">You are signed in as a walker. Add pet owner features from your profile to book.</p>
          )}
          {!isMe && <Button variant="outline" block icon={MessageCircle} loading={busy} onClick={message}>Message {walker.name.split(' ')[0]}</Button>}
          <p className="muted small">Nothing is charged until you send a request. The walker must accept before the booking is confirmed.</p>
        </div>

        <div className="card stack">
          <h2 className="h5 row gap-xs"><ShieldCheck size={20} aria-hidden /> Trust checks</h2>
          <ul className="verify-list compact">
            {[['Phone number', walker.verification.phone], ['Government ID', walker.verification.id], ['Background check', walker.verification.background]].map(([label, s]) => (
              <li key={label} className={`v-${stateOf(s)}`}>
                {s === 'verified' ? <CircleCheck size={20} aria-hidden /> : s === 'pending' ? <Clock3 size={20} aria-hidden /> : <Circle size={20} aria-hidden />}
                <span>{label}</span>
                <span className="verify-state">{s === 'verified' ? 'Verified' : s === 'pending' ? 'In review' : 'Not done'}</span>
              </li>
            ))}
          </ul>
          <p className="muted small">Have a concern? <Link to="/contact">Contact our safety team</Link>.</p>
        </div>
      </aside>
    </div>
  )
}
