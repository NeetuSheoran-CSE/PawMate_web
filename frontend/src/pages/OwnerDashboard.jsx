import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck, CalendarX2, CheckCheck, Hourglass, Plus, Search } from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import Tabs from '../components/ui/Tabs.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { ListSkeleton } from '../components/ui/Skeleton.jsx'
import BookingCard from '../components/booking/BookingCard.jsx'
import useBookingActions from '../components/booking/useBookingActions.jsx'
import StatCard from '../components/dashboard/StatCard.jsx'
import { petTypeById } from '../data/constants.js'
import { api } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

export default function OwnerDashboard() {
  useDocumentTitle('Pet owner dashboard')
  const { user } = useAuth()
  const toast = useToast()
  const [bookings, setBookings] = useState(null)
  const [pets, setPets] = useState(null)
  const [tab, setTab] = useState('all')

  const load = useCallback(async () => {
    try {
      const [b, p] = await Promise.all([api.getBookings({ ownerId: user.id }), api.getPets(user.id)])
      setBookings(b.sort((x, y) => y.date.localeCompare(x.date)))
      setPets(p)
    } catch (err) {
      toast.error(err.message)
      setBookings(cur => cur ?? [])
      setPets(cur => cur ?? [])
    }
  }, [user.id, toast])

  useEffect(() => { load() }, [load])
  const { onAction, modals, busyId } = useBookingActions({ viewer: 'owner', onChanged: load })

  const count = s => (bookings ? bookings.filter(b => b.status === s).length : 0)
  const shown = useMemo(() => (bookings ? (tab === 'all' ? bookings : bookings.filter(b => b.status === tab)) : []), [bookings, tab])
  const tabs = [
    { id: 'all', label: 'All', count: bookings?.length ?? 0 },
    { id: 'Pending', label: 'Pending', count: count('Pending') },
    { id: 'Accepted', label: 'Accepted', count: count('Accepted') },
    { id: 'Completed', label: 'Completed', count: count('Completed') },
    { id: 'Cancelled', label: 'Cancelled', count: count('Cancelled') },
  ]

  return (
    <div className="container section-sm">
      <div className="dash-head">
        <div>
          <h1 className="h2">Pet owner dashboard</h1>
          <p className="lead-sm">Your requests, your pets and your walkers.</p>
        </div>
        <Button to="/find-walker" icon={Search}>Find a walker</Button>
      </div>

      <div className="stats">
        <StatCard icon={Hourglass} label="Waiting for a reply" value={bookings ? count('Pending') : '–'} tone="orange" />
        <StatCard icon={CalendarCheck} label="Confirmed" value={bookings ? count('Accepted') : '–'} />
        <StatCard icon={CheckCheck} label="Completed" value={bookings ? count('Completed') : '–'} />
        <StatCard icon={CalendarX2} label="Cancelled" value={bookings ? count('Cancelled') : '–'} tone="muted" />
      </div>

      <div className="dash-layout">
        <div className="stack">
          <Tabs tabs={tabs} active={tab} onChange={setTab} label="Booking status" />
          {!bookings ? <ListSkeleton /> : shown.length === 0 ? (
            <EmptyState
              icon={CalendarX2}
              title={tab === 'all' ? 'No bookings yet' : `No ${tab.toLowerCase()} bookings`}
              text={tab === 'all' ? 'Find a walker nearby and send your first request.' : 'Bookings with this status will show up here.'}
              action={tab === 'all' ? <Button to="/find-walker">Find a walker</Button> : null}
            />
          ) : (
            shown.map(b => <BookingCard key={b.id} booking={b} viewer="owner" onAction={onAction} busy={busyId === b.id} />)
          )}
        </div>

        <aside className="stack">
          <div className="card stack">
            <div className="row between"><h2 className="h5">My pets</h2><Link to="/profile#pets" className="text-link">Manage</Link></div>
            {!pets ? <ListSkeleton rows={1} /> : pets.length === 0 ? (
              <p className="muted">Add your pet so walkers know their routine.</p>
            ) : (
              <ul className="mini-list">
                {pets.map(p => (
                  <li key={p.id}><span className="pet-emoji" aria-hidden>{petTypeById(p.type)?.emoji}</span><div><strong>{p.name}</strong><p className="muted">{p.breed}, {p.age} yr</p></div></li>
                ))}
              </ul>
            )}
            <Button to="/profile#pets" variant="outline" size="sm" icon={Plus}>Add a pet</Button>
          </div>
          <div className="card note-good">
            <h2 className="h5">Tip</h2>
            <p>Add clear feeding and behaviour notes to each pet. Walkers who know the routine make pets feel safe.</p>
          </div>
        </aside>
      </div>
      {modals}
    </div>
  )
}
