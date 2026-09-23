import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarClock, Inbox, IndianRupee, Star, ThumbsUp } from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import Tabs from '../components/ui/Tabs.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import { ListSkeleton } from '../components/ui/Skeleton.jsx'
import BookingCard from '../components/booking/BookingCard.jsx'
import useBookingActions from '../components/booking/useBookingActions.jsx'
import StatCard from '../components/dashboard/StatCard.jsx'
import AvailabilityEditor from '../components/dashboard/AvailabilityEditor.jsx'
import VerificationCard from '../components/dashboard/VerificationCard.jsx'
import { api } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { formatINR } from '../utils/format.js'

export default function WalkerDashboard() {
  useDocumentTitle('Pet walker dashboard')
  const { user } = useAuth()
  const toast = useToast()
  const [walker, setWalker] = useState(undefined)
  const [bookings, setBookings] = useState(null)
  const [tab, setTab] = useState('Pending')

  const load = useCallback(async () => {
    if (!user.walkerId) return setWalker(null)
    try {
      const [w, b] = await Promise.all([api.getWalker(user.walkerId), api.getBookings({ walkerId: user.walkerId })])
      setWalker(w)
      setBookings(b.sort((x, y) => x.date.localeCompare(y.date)))
    } catch (err) {
      toast.error(err.message)
      setWalker(cur => (cur === undefined ? null : cur))
    }
    return undefined
  }, [user.walkerId, toast])

  useEffect(() => { load() }, [load])
  const { onAction, modals, busyId } = useBookingActions({ viewer: 'walker', onChanged: load })

  const stats = useMemo(() => {
    const list = bookings || []
    const earned = list.filter(b => b.paymentStatus === 'Paid').reduce((s, b) => s + b.subtotal, 0)
    const expected = list.filter(b => b.status === 'Accepted').reduce((s, b) => s + b.subtotal, 0)
    return { earned, expected, pending: list.filter(b => b.status === 'Pending').length }
  }, [bookings])

  if (walker === undefined) return <Spinner label="Loading your dashboard" />
  if (walker === null) {
    return (
      <div className="container section">
        <EmptyState icon={Inbox} title="Finish your walker profile" text="Create your profile to appear in search and receive requests." action={<Button to="/become-a-walker">Create walker profile</Button>} />
      </div>
    )
  }

  const saveWalker = async patch => {
    try {
      setWalker(await api.updateWalker(walker.id, patch))
      toast.success('Saved. Your changes are live.')
    } catch (e) {
      toast.error(e.message)
    }
  }
  const upload = async file => {
    try {
      setWalker(await api.submitVerification(walker.id, file))
      toast.success('ID submitted. We will review it shortly.')
    } catch (e) {
      toast.error(e.message)
    }
  }

  const count = s => (bookings ? bookings.filter(b => b.status === s).length : 0)
  const tabs = [
    { id: 'Pending', label: 'Requests', count: count('Pending') },
    { id: 'Accepted', label: 'Upcoming', count: count('Accepted') },
    { id: 'Completed', label: 'Completed', count: count('Completed') },
    { id: 'Cancelled', label: 'Cancelled', count: count('Cancelled') },
    { id: 'availability', label: 'Availability' },
    { id: 'verification', label: 'Verification' },
  ]
  const isBookingTab = !['availability', 'verification'].includes(tab)
  const shown = bookings ? bookings.filter(b => b.status === tab) : []
  const emptyText = {
    Pending: 'New booking requests appear here. Keep your availability up to date to get more.',
    Accepted: 'Accepted bookings show up here until you mark them completed.',
    Completed: 'Finished bookings and their payouts show up here.',
    Cancelled: 'Nothing cancelled. Great!',
  }

  return (
    <div className="container section-sm">
      <div className="dash-head">
        <div>
          <h1 className="h2">Pet walker dashboard</h1>
          <p className="lead-sm">{walker.active ? 'You are visible in search.' : 'Your profile is hidden from search.'}</p>
        </div>
        <Button to={`/walkers/${walker.id}`} variant="outline">View public profile</Button>
      </div>

      <div className="stats">
        <StatCard icon={Inbox} label="New requests" value={stats.pending} tone="orange" />
        <StatCard icon={IndianRupee} label="Earned" value={formatINR(stats.earned)} />
        <StatCard icon={CalendarClock} label="Expected from upcoming" value={formatINR(stats.expected)} tone="muted" />
        <StatCard icon={walker.reviewCount ? Star : ThumbsUp} label={walker.reviewCount ? `Rating from ${walker.reviewCount} reviews` : 'No reviews yet'} value={walker.reviewCount ? walker.rating.toFixed(1) : 'New'} />
      </div>

      <div className="stack mt">
        <Tabs tabs={tabs} active={tab} onChange={setTab} label="Dashboard sections" />

        {isBookingTab && (
          !bookings ? <ListSkeleton /> : shown.length === 0 ? (
            <EmptyState icon={Inbox} title={`No ${tab === 'Pending' ? 'new requests' : tab.toLowerCase() + ' bookings'}`} text={emptyText[tab]} />
          ) : (
            <div className="grid grid-2">
              {shown.map(b => <BookingCard key={b.id} booking={b} viewer="walker" onAction={onAction} busy={busyId === b.id} />)}
            </div>
          )
        )}
        {tab === 'availability' && <AvailabilityEditor walker={walker} onSave={saveWalker} />}
        {tab === 'verification' && <div className="narrow-left"><VerificationCard walker={walker} onUpload={upload} /></div>}
      </div>
      {modals}
    </div>
  )
}
