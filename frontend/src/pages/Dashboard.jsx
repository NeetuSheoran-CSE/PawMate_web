import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck, CheckCircle2, Circle, Dog, HandHeart, Hourglass, MessageCircle, Search, User } from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import StatusBadge from '../components/ui/StatusBadge.jsx'
import StatCard from '../components/dashboard/StatCard.jsx'
import { ListSkeleton } from '../components/ui/Skeleton.jsx'
import { serviceById, slotById } from '../data/constants.js'
import { api } from '../services/api.js'
import { isOwner, isWalker, useAuth } from '../context/AuthContext.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { formatDate, todayISO } from '../utils/format.js'

/** The "User Dashboard": a home base that links to the owner and walker dashboards. */
export default function Dashboard() {
  useDocumentTitle('Dashboard')
  const { user } = useAuth()
  const [data, setData] = useState(null)

  useEffect(() => {
    let alive = true
    Promise.all([
      isOwner(user) ? api.getBookings({ ownerId: user.id }) : [],
      user.walkerId ? api.getBookings({ walkerId: user.walkerId }) : [],
      isOwner(user) ? api.getPets(user.id) : [],
      user.walkerId ? api.getWalker(user.walkerId) : null,
    ])
      .then(([asOwner, asWalker, pets, walker]) => alive && setData({ asOwner, asWalker, pets, walker }))
      .catch(() => alive && setData({ asOwner: [], asWalker: [], pets: [], walker: null }))
    return () => { alive = false }
  }, [user])

  const today = todayISO()
  const all = data ? [...data.asOwner.map(b => ({ ...b, as: 'owner' })), ...data.asWalker.map(b => ({ ...b, as: 'walker' }))] : []
  const upcoming = all.filter(b => ['Pending', 'Accepted'].includes(b.status) && b.date >= today).sort((a, b) => a.date.localeCompare(b.date))
  const pendingForMe = data ? data.asWalker.filter(b => b.status === 'Pending').length : 0

  const checklist = [
    { done: !!user.phone, label: 'Add your phone number', to: '/profile' },
    { done: !!user.city, label: 'Add your city', to: '/profile' },
    ...(isOwner(user) ? [
      { done: !!user.emergencyContact, label: 'Add an emergency contact', to: '/profile#emergency' },
      { done: !!data?.pets.length, label: 'Add your pet\u2019s profile', to: '/profile#pets' },
    ] : []),
    ...(isWalker(user) ? [
      { done: !!user.walkerId, label: 'Create your walker profile', to: '/become-a-walker' },
      ...(user.walkerId ? [{ done: data?.walker?.verification.id !== 'none', label: 'Upload your ID for verification', to: '/dashboard/walker' }] : []),
    ] : []),
  ]
  const pct = Math.round((checklist.filter(c => c.done).length / checklist.length) * 100)

  return (
    <div className="container section-sm">
      <div className="dash-head">
        <div>
          <h1 className="h2">Hi, {user.name.split(' ')[0]}</h1>
          <p className="lead-sm">Here is what is happening with your pets and bookings.</p>
        </div>
        <div className="row gap-sm wrap">
          <Button to="/find-walker" icon={Search}>Find a walker</Button>
          <Button to="/messages" variant="outline" icon={MessageCircle}>Messages</Button>
        </div>
      </div>

      <div className="stats">
        <StatCard icon={CalendarCheck} label="Upcoming bookings" value={data ? upcoming.length : '–'} />
        {isWalker(user) && <StatCard icon={Hourglass} label="Requests waiting for you" value={data ? pendingForMe : '–'} tone="orange" />}
        {isOwner(user) && <StatCard icon={Dog} label="Pets on your profile" value={data ? data.pets.length : '–'} tone="orange" />}
      </div>

      <div className="grid grid-2 mt">
        {isOwner(user) && (
          <div className="card stack">
            <span className="icon-tile"><Dog size={26} aria-hidden /></span>
            <h2 className="h4">Pet owner dashboard</h2>
            <p>Track your requests, cancel or review bookings, and manage your pets.</p>
            <Button to="/dashboard/owner">Open owner dashboard</Button>
          </div>
        )}
        {isWalker(user) && (
          <div className="card stack">
            <span className="icon-tile"><HandHeart size={26} aria-hidden /></span>
            <h2 className="h4">Pet walker dashboard</h2>
            <p>{user.walkerId ? 'Accept requests, set your availability and check your earnings.' : 'Finish your walker profile to start receiving requests.'}</p>
            <Button to={user.walkerId ? '/dashboard/walker' : '/become-a-walker'}>{user.walkerId ? 'Open walker dashboard' : 'Create walker profile'}</Button>
          </div>
        )}
        {user.role === 'walker' && (
          <div className="card stack">
            <span className="icon-tile"><Dog size={26} aria-hidden /></span>
            <h2 className="h4">Need care for a pet too?</h2>
            <p>Turn on pet owner features to book other walkers.</p>
            <Button variant="outline" to="/profile">Go to my profile</Button>
          </div>
        )}
      </div>

      <div className="split mt">
        <div className="card stack">
          <h2 className="h4">Coming up</h2>
          {!data ? <ListSkeleton rows={2} /> : upcoming.length === 0 ? (
            <p className="muted">Nothing scheduled. {isOwner(user) ? <Link to="/find-walker">Find a walker</Link> : 'New requests will appear here.'}</p>
          ) : (
            <ul className="mini-list">
              {upcoming.slice(0, 4).map(b => (
                <li key={b.id}>
                  <div>
                    <strong>{b.petName}, {serviceById(b.service)?.title}</strong>
                    <p className="muted">{formatDate(b.date)}, {slotById(b.slot)?.label} {b.as === 'owner' ? `with ${b.walkerName}` : `for ${b.ownerName}`}</p>
                  </div>
                  <StatusBadge status={b.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card stack">
          <div className="row between"><h2 className="h4">Complete your profile</h2><strong>{data ? `${pct}%` : ''}</strong></div>
          <div className="meter" role="progressbar" aria-valuenow={data ? pct : 0} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${data ? pct : 0}%` }} /></div>
          <ul className="checklist">
            {checklist.map(c => (
              <li key={c.label} className={c.done ? 'done' : ''}>
                {c.done ? <CheckCircle2 size={20} aria-hidden /> : <Circle size={20} aria-hidden />}
                {c.done ? <span>{c.label}</span> : <Link to={c.to}>{c.label}</Link>}
              </li>
            ))}
          </ul>
          <Button to="/profile" variant="outline" icon={User}>Edit profile</Button>
        </div>
      </div>
    </div>
  )
}
