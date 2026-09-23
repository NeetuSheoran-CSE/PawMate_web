import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { BadgeCheck, Check, CheckCircle2, PawPrint, Plus, SearchX } from 'lucide-react'
import Avatar from '../components/ui/Avatar.jsx'
import Button from '../components/ui/Button.jsx'
import Field from '../components/ui/Field.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import { Rating } from '../components/ui/Rating.jsx'
import AvailabilityCalendar from '../components/calendar/AvailabilityCalendar.jsx'
import PaymentForm from '../components/booking/PaymentForm.jsx'
import PetForm from '../components/pets/PetForm.jsx'
import { HOUR_OPTIONS, RELATIONS, SLOTS, petTypeById, serviceById, slotById } from '../data/constants.js'
import { api } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useForm } from '../hooks/useForm.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { formatDate, formatINR, priceBreakdown } from '../utils/format.js'
import { cardCvv, cardExpiry, cardNumber, compose, minLength, phone, required, upiId, when } from '../utils/validators.js'

const STEPS = ['Pet and service', 'Date and time', 'Safety details', 'Payment']
const STEP_FIELDS = [
  ['petId', 'service'],
  ['date', 'slot'],
  ['address', 'emergencyName', 'emergencyPhone', 'emergencyRelation'],
  ['upiId', 'cardName', 'cardNumber', 'cardExpiry', 'cardCvv', 'agree'],
]

export default function Booking() {
  useDocumentTitle('Request a booking')
  const { walkerId } = useParams()
  const [sp] = useSearchParams()
  const { user, setUser } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [walker, setWalker] = useState(undefined)
  const [pets, setPets] = useState(null)
  const [booked, setBooked] = useState([])
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(null)
  const [addingPet, setAddingPet] = useState(false)
  const [savingPet, setSavingPet] = useState(false)

  const free = walker?.price === 0
  const card = a => !free && a.payMethod === 'card'
  const rules = {
    petId: v => (v ? '' : 'Choose a pet, or add a new one'),
    service: v => (v ? '' : 'Choose a service'),
    date: v => (v ? '' : 'Pick an available date on the calendar'),
    slot: v => (v ? '' : 'Pick a time slot'),
    address: compose(required('Address'), minLength(10, 'Address')),
    emergencyName: required('Emergency contact name'),
    emergencyPhone: compose(required('Emergency contact phone'), phone),
    emergencyRelation: required('Relationship'),
    upiId: when(a => !free && a.payMethod === 'upi', upiId),
    cardName: when(card, required('Name on card')),
    cardNumber: when(card, cardNumber),
    cardExpiry: when(card, cardExpiry),
    cardCvv: when(card, cardCvv),
    agree: v => (v ? '' : 'Please accept the booking terms'),
  }

  const form = useForm({
    petId: '', service: sp.get('service') || '', date: '', slot: '', hours: 1, address: '', instructions: '',
    emergencyName: user.emergencyContact?.name || '', emergencyPhone: user.emergencyContact?.phone || '',
    emergencyRelation: user.emergencyContact?.relation || '', saveContact: !user.emergencyContact,
    payMethod: 'upi', upiId: '', cardName: '', cardNumber: '', cardExpiry: '', cardCvv: '', agree: false,
  }, rules)
  const v = form.values

  useEffect(() => {
    let alive = true
    Promise.all([api.getWalker(walkerId), api.getPets(user.id), api.getBookedSlots(walkerId)]).catch(err => {
      toast.error(err.message)
      return [null, [], []]
    }).then(([w, p, b]) => {
      if (!alive) return
      setWalker(w)
      setPets(p)
      setBooked(b)
      if (w) {
        form.setValues(cur => ({
          ...cur,
          service: w.services.includes(cur.service) ? cur.service : w.services[0],
          petId: cur.petId || p[0]?.id || '',
          instructions: cur.instructions || p[0]?.instructions || '',
        }))
      }
    })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walkerId, user.id])

  if (walker === undefined || pets === null) return <Spinner label="Preparing your booking" />
  if (!walker) {
    return <div className="container section"><EmptyState icon={SearchX} title="Walker not found" action={<Button to="/find-walker">Browse walkers</Button>} /></div>
  }
  if (walker.userId === user.id) {
    return <div className="container section"><EmptyState icon={SearchX} title="You cannot book yourself" action={<Button to="/find-walker">Browse walkers</Button>} /></div>
  }

  const pet = pets.find(p => p.id === v.petId)
  const takenOn = iso => booked.filter(b => b.date === iso).map(b => b.slot)
  const dateBlocked = iso => takenOn(iso).length >= walker.availability.slots.length
  const { subtotal, fee, total } = priceBreakdown(walker.price, Number(v.hours))
  const service = serviceById(v.service)

  const choosePet = p => {
    form.setValue('petId', p.id)
    form.setValue('instructions', p.instructions || '')
  }

  const savePet = async values => {
    setSavingPet(true)
    try {
      const created = await api.savePet(user.id, values)
      setPets(list => [...list, created])
      choosePet(created)
      setAddingPet(false)
      toast.success(`${created.name} was added.`)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSavingPet(false)
    }
  }

  const next = () => {
    if (form.validate(STEP_FIELDS[step])) setStep(s => s + 1)
  }

  const submit = async e => {
    e.preventDefault()
    const fields = STEP_FIELDS[3]
    if (!form.validate(free ? ['agree'] : fields)) return
    setBusy(true)
    try {
      const booking = await api.createBooking({
        ownerId: user.id, ownerName: user.name, ownerPhone: user.phone, walkerId: walker.id,
        petId: pet.id, petName: pet.name, petType: pet.type, petBreed: pet.breed, petInstructions: pet.instructions,
        service: v.service, date: v.date, slot: v.slot, hours: Number(v.hours), address: v.address.trim(),
        instructions: v.instructions.trim(),
        emergency: { name: v.emergencyName.trim(), phone: v.emergencyPhone.trim(), relation: v.emergencyRelation },
        vet: user.vet || null,
        payMethod: free ? 'free' : v.payMethod,
        cardLast4: !free && v.payMethod === 'card' ? v.cardNumber.replace(/\s/g, '').slice(-4) : undefined,
      })
      if (v.saveContact) {
        api.updateUser(user.id, { emergencyContact: booking.emergency }).then(setUser).catch(() => {})
      }
      setDone(booking)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      toast.error(err.message)
      if (/slot/i.test(err.message)) {
        api.getBookedSlots(walker.id).then(setBooked)
        setStep(1)
      }
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="container narrow section-sm">
        <div className="card success-panel">
          <CheckCircle2 size={52} aria-hidden />
          <h1 className="h3">Request sent to {walker.name.split(' ')[0]}</h1>
          <p>
            {pet.name}&apos;s {serviceById(done.service).title.toLowerCase()} on <strong>{formatDate(done.date)}</strong>, {slotById(done.slot).label.toLowerCase()}.
            The booking is <strong>Pending</strong> until the walker accepts. We&apos;ll show the update on your dashboard.
          </p>
          <ul className="check-list left">
            <li><Check size={16} aria-hidden /> Booking ID {done.id}</li>
            <li><Check size={16} aria-hidden /> {done.total === 0 ? 'Free volunteer booking' : `${formatINR(done.total)}, ${done.paymentStatus.toLowerCase()}`}</li>
            <li><Check size={16} aria-hidden /> Emergency contact and pet instructions shared once accepted</li>
          </ul>
          <div className="row gap wrap center">
            <Button to="/dashboard/owner">View my bookings</Button>
            <Button variant="outline" onClick={async () => {
              const c = await api.getOrCreateConversation(user, walker.id)
              navigate(`/messages?c=${c.id}`)
            }}>Message {walker.name.split(' ')[0]}</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container section-sm">
      <h1 className="h2">Request a booking</h1>
      <ol className="stepper" aria-label="Booking steps">
        {STEPS.map((s, i) => (
          <li key={s} className={i === step ? 'current' : i < step ? 'done' : ''} aria-current={i === step ? 'step' : undefined}>
            <span>{i < step ? <Check size={14} /> : i + 1}</span>{s}
          </li>
        ))}
      </ol>

      <div className="booking-layout">
        <form className="card stack-lg" onSubmit={submit} noValidate>
          {step === 0 && (
            <>
              <fieldset className="stack">
                <legend>Which pet needs care?</legend>
                {pets.length > 0 && (
                  <div className="pet-picker" role="radiogroup" aria-label="Choose a pet">
                    {pets.map(p => (
                      <button type="button" key={p.id} role="radio" aria-checked={v.petId === p.id} className={`pet-option ${v.petId === p.id ? 'on' : ''}`} onClick={() => choosePet(p)}>
                        <span className="pet-emoji" aria-hidden>{petTypeById(p.type)?.emoji}</span>
                        <strong>{p.name}</strong>
                        <span className="muted">{p.breed}, {p.age} yr</span>
                      </button>
                    ))}
                    <button type="button" className="pet-option add" onClick={() => setAddingPet(true)}><Plus size={22} aria-hidden /><strong>Add a pet</strong></button>
                  </div>
                )}
                {form.errors.petId && <p className="field-error" role="alert">{form.errors.petId}</p>}
                {(addingPet || pets.length === 0) && (
                  <div className="card inset">
                    <h3 className="h5">Tell us about your pet</h3>
                    <PetForm onSubmit={savePet} loading={savingPet} submitLabel="Add pet" onCancel={pets.length ? () => setAddingPet(false) : undefined} />
                  </div>
                )}
              </fieldset>

              <fieldset className="stack">
                <legend>Which service?</legend>
                <div className="service-picker" role="radiogroup" aria-label="Service">
                  {walker.services.map(id => {
                    const s = serviceById(id)
                    return (
                      <button type="button" key={id} role="radio" aria-checked={v.service === id} className={`pet-option ${v.service === id ? 'on' : ''}`} onClick={() => form.setValue('service', id)}>
                        <s.icon size={22} aria-hidden /><strong>{s.title}</strong><span className="muted">{s.short}</span>
                      </button>
                    )
                  })}
                </div>
                {form.errors.service && <p className="field-error" role="alert">{form.errors.service}</p>}
              </fieldset>
            </>
          )}

          {step === 1 && (
            <>
              <fieldset className="stack">
                <legend>Pick a date</legend>
                <AvailabilityCalendar availableDays={walker.availability.days} selected={v.date} isBlocked={dateBlocked} onSelect={d => { form.setValue('date', d); if (takenOn(d).includes(v.slot)) form.setValue('slot', '') }} />
                {form.errors.date && <p className="field-error" role="alert">{form.errors.date}</p>}
              </fieldset>
              <fieldset className="stack">
                <legend>Pick a time slot</legend>
                <div className="slot-picker" role="radiogroup" aria-label="Time slot">
                  {SLOTS.filter(s => walker.availability.slots.includes(s.id)).map(s => {
                    const taken = !!v.date && takenOn(v.date).includes(s.id)
                    return (
                      <button type="button" key={s.id} role="radio" aria-checked={v.slot === s.id} disabled={taken} className={`pet-option ${v.slot === s.id ? 'on' : ''}`} onClick={() => form.setValue('slot', s.id)}>
                        <strong>{s.label}</strong><span className="muted">{taken ? 'Already booked' : s.time}</span>
                      </button>
                    )
                  })}
                </div>
                {form.errors.slot && <p className="field-error" role="alert">{form.errors.slot}</p>}
                <Field as="select" label="How long?" {...form.field('hours')}>
                  {HOUR_OPTIONS.map(h => <option key={h} value={h}>{h} hour{h > 1 ? 's' : ''}</option>)}
                </Field>
              </fieldset>
            </>
          )}

          {step === 2 && (
            <>
              <fieldset className="stack">
                <legend>Where will the visit happen?</legend>
                <Field as="textarea" rows={3} label="Full address" required placeholder="Flat, building, sector and landmark" {...form.field('address')} />
                <Field
                  as="textarea" rows={4} label="Instructions for this visit" {...form.field('instructions')}
                  hint={pet ? `We pre-filled ${pet.name}'s saved instructions. Edit them if today is different.` : undefined}
                />
              </fieldset>
              <fieldset className="stack">
                <legend>Emergency contact</legend>
                <p className="muted">Someone your walker can call if they cannot reach you. Shared only after the walker accepts.</p>
                <div className="form-grid">
                  <Field label="Contact name" required {...form.field('emergencyName')} />
                  <Field label="Contact phone" required inputMode="tel" {...form.field('emergencyPhone')} />
                </div>
                <Field as="select" label="Relationship" required {...form.field('emergencyRelation')}>
                  <option value="">Select</option>
                  {RELATIONS.map(r => <option key={r}>{r}</option>)}
                </Field>
                <label className="check"><input type="checkbox" name="saveContact" checked={v.saveContact} onChange={form.handleChange} /><span>Save as my default emergency contact</span></label>
              </fieldset>
            </>
          )}

          {step === 3 && (
            <>
              <fieldset className="stack">
                <legend>Payment</legend>
                <PaymentForm form={form} free={free} />
              </fieldset>
              <div className="stack-sm">
                <label className="check">
                  <input type="checkbox" name="agree" checked={v.agree} onChange={form.handleChange} />
                  <span>I have shared accurate details about my pet and understand the booking is confirmed only when the walker accepts.</span>
                </label>
                {form.errors.agree && <p className="field-error" role="alert">{form.errors.agree}</p>}
              </div>
            </>
          )}

          <div className="row between">
            {step > 0 ? <Button variant="ghost" onClick={() => setStep(s => s - 1)}>Back</Button> : <Link className="btn btn-ghost" to={`/walkers/${walker.id}`}>Cancel</Link>}
            {step < 3 ? <Button onClick={next}>Continue</Button> : <Button type="submit" size="lg" loading={busy}>Send request</Button>}
          </div>
        </form>

        <aside className="card stack sticky-col summary">
          <div className="row gap">
            <Avatar name={walker.name} photo={walker.photo} size={56} tone={walker.tone} />
            <div>
              <h2 className="h5 row gap-xs">{walker.name}{walker.verified && <BadgeCheck className="verified-icon" size={18} aria-label="Verified" />}</h2>
              {walker.reviewCount > 0 && <Rating value={walker.rating} count={walker.reviewCount} />}
            </div>
          </div>
          <dl className="dl">
            <div><dt>Pet</dt><dd>{pet ? <span className="row gap-xs"><PawPrint size={14} aria-hidden /> {pet.name}</span> : 'Not chosen'}</dd></div>
            <div><dt>Service</dt><dd>{service?.title || 'Not chosen'}</dd></div>
            <div><dt>Date</dt><dd>{v.date ? formatDate(v.date) : 'Not chosen'}</dd></div>
            <div><dt>Time</dt><dd>{v.slot ? slotById(v.slot).label : 'Not chosen'}</dd></div>
          </dl>
          <hr />
          {free ? (
            <p className="row between"><strong>Total</strong><strong>Free</strong></p>
          ) : (
            <dl className="dl">
              <div><dt>{formatINR(walker.price)} × {v.hours} hr</dt><dd>{formatINR(subtotal)}</dd></div>
              <div><dt>Service fee</dt><dd>{formatINR(fee)}</dd></div>
              <div className="dl-total"><dt>Total</dt><dd>{formatINR(total)}</dd></div>
            </dl>
          )}
        </aside>
      </div>
    </div>
  )
}
