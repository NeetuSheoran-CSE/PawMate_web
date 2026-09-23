import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, GraduationCap, HandHeart, Upload, Wallet, CalendarClock } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader.jsx'
import Button from '../components/ui/Button.jsx'
import Field from '../components/ui/Field.jsx'
import ChipSelect from '../components/ui/ChipSelect.jsx'
import { PET_TYPES, SERVICES, SLOTS, WEEKDAYS } from '../data/constants.js'
import { api } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useForm } from '../hooks/useForm.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { compose, email, minLength, numberBetween, password, phone, required, when } from '../utils/validators.js'

const BENEFITS = [
  { icon: Wallet, title: 'Earn on your terms', text: 'Set your own price and weekly hours. Fit walks between lectures or after work.' },
  { icon: HandHeart, title: 'Or volunteer for free', text: 'Choose a zero price and spend time with pets that need a friend.' },
  { icon: GraduationCap, title: 'Great for hostel and PG students', text: 'No pet of your own? Walk one that lives nearby.' },
  { icon: CalendarClock, title: 'You accept what suits you', text: 'Every request can be accepted or declined. No pressure, no minimums.' },
]

export default function BecomeWalker() {
  useDocumentTitle('Become a Pet Walker')
  const { user, signup, setUser } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const needAccount = !user

  const rules = {
    name: when(() => needAccount, required('Full name')),
    email: when(() => needAccount, compose(required('Email'), email)),
    phone: when(() => needAccount, compose(required('Mobile number'), phone)),
    password: when(() => needAccount, compose(required('Password'), password)),
    city: required('City'),
    area: required('Area'),
    headline: compose(required('Headline'), minLength(10, 'Headline')),
    bio: compose(required('Bio'), minLength(40, 'Bio')),
    experienceYears: numberBetween(0, 50, 'Experience'),
    services: required('Service'),
    petTypes: required('Pet type'),
    price: when(a => a.pricing === 'paid', numberBetween(50, 1000, 'Price')),
    days: required('Day'),
    slots: required('Time slot'),
    agree: v => (v ? '' : 'Please accept the code of conduct'),
  }

  const form = useForm({
    name: '', email: '', phone: '', password: '', city: user?.city || '', area: '', headline: '', bio: '', experienceYears: '0',
    services: [], petTypes: [], pricing: 'paid', price: '150', days: [], slots: [], idFile: null, agree: false,
  }, rules)
  const v = form.values

  if (user?.walkerId) {
    return (
      <>
        <PageHeader title="Become a pet walker" />
        <div className="container section-sm">
          <div className="card success-panel">
            <CheckCircle2 size={44} aria-hidden />
            <h2 className="h3">You are already a PawMate walker</h2>
            <p>Manage your requests, availability and verification from your walker dashboard.</p>
            <Button to="/dashboard/walker">Open walker dashboard</Button>
          </div>
        </div>
      </>
    )
  }

  const submit = async e => {
    e.preventDefault()
    setFormError('')
    if (!form.validate()) {
      toast.error('Please fix the highlighted fields.')
      return
    }
    setBusy(true)
    try {
      let owner = user
      if (needAccount) owner = await signup({ name: v.name, email: v.email, password: v.password, phone: v.phone, city: v.city, role: 'walker' })
      const res = await api.createWalkerProfile(owner.id, v)
      setUser(res.user)
      if (v.idFile) {
        try {
          await api.submitVerification(res.walker.id, v.idFile)
        } catch (err) {
          toast.error(`Your profile is live, but the ID upload failed: ${err.message} You can retry from your dashboard.`)
        }
      }
      toast.success('Your walker profile is live!')
      navigate('/dashboard/walker')
    } catch (err) {
      setFormError(err.message)
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Get paid to spend time with pets" subtitle="Or volunteer for free. Create your walker profile in a few minutes." />

      <section className="section-sm">
        <div className="container">
          <div className="grid grid-4">
            {BENEFITS.map(b => (
              <div key={b.title} className="card">
                <span className="icon-tile sm"><b.icon size={20} aria-hidden /></span>
                <h3 className="h5">{b.title}</h3>
                <p>{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-sm" id="apply">
        <div className="container narrow">
          <form className="card form-card stack-lg" onSubmit={submit} noValidate>
            <h2 className="h3">Create your walker profile</h2>
            {formError && <p className="note note-warn" role="alert">{formError}</p>}

            {needAccount && (
              <fieldset className="stack">
                <legend>Your account</legend>
                <div className="form-grid">
                  <Field label="Full name" required autoComplete="name" {...form.field('name')} />
                  <Field label="Email" required type="email" autoComplete="email" {...form.field('email')} />
                  <Field label="Mobile number" required inputMode="tel" placeholder="98765 43210" {...form.field('phone')} />
                  <Field label="Password" required type="password" autoComplete="new-password" hint="8+ characters with a letter and a number" {...form.field('password')} />
                </div>
              </fieldset>
            )}

            <fieldset className="stack">
              <legend>About you</legend>
              <div className="form-grid">
                <Field label="City" required {...form.field('city')} />
                <Field label="Area or locality" required placeholder="Sector 45" {...form.field('area')} />
              </div>
              <Field label="Headline" required placeholder="Animal lover who grew up with rescue dogs" hint="One line owners see on your card." {...form.field('headline')} />
              <Field as="textarea" rows={4} label="Short bio" required placeholder="Tell owners about your experience with pets and how you like to work." {...form.field('bio')} />
              <Field label="Years of experience with pets" required type="number" min="0" max="50" {...form.field('experienceYears')} />
            </fieldset>

            <fieldset className="stack">
              <legend>What you offer</legend>
              <ChipSelect label="Services" options={SERVICES.map(s => ({ id: s.id, label: s.title }))} value={v.services} onChange={x => form.setValue('services', x)} error={form.errors.services} />
              <ChipSelect label="Pets you are comfortable with" options={PET_TYPES.slice(0, 4)} value={v.petTypes} onChange={x => form.setValue('petTypes', x)} error={form.errors.petTypes} />
              <div className="field">
                <span className="field-label">Pricing</span>
                <div className="chip-row">
                  <button type="button" className={`chip ${v.pricing === 'paid' ? 'chip-on' : ''}`} aria-pressed={v.pricing === 'paid'} onClick={() => form.setValue('pricing', 'paid')}><Wallet size={16} /> I charge for my time</button>
                  <button type="button" className={`chip ${v.pricing === 'free' ? 'chip-on' : ''}`} aria-pressed={v.pricing === 'free'} onClick={() => form.setValue('pricing', 'free')}><HandHeart size={16} /> I volunteer for free</button>
                </div>
              </div>
              {v.pricing === 'paid' && <Field label="Price per hour (₹)" required type="number" min="50" max="1000" step="10" hint="Most walkers charge ₹100 to ₹300." {...form.field('price')} />}
            </fieldset>

            <fieldset className="stack">
              <legend>When you are free</legend>
              <ChipSelect label="Days" options={WEEKDAYS.map(d => ({ id: d, label: d }))} value={v.days} onChange={x => form.setValue('days', x)} error={form.errors.days} />
              <ChipSelect label="Time slots" options={SLOTS.map(s => ({ id: s.id, label: `${s.label} (${s.time})` }))} value={v.slots} onChange={x => form.setValue('slots', x)} error={form.errors.slots} />
            </fieldset>

            <fieldset className="stack">
              <legend>Verification</legend>
              <p className="muted">Upload a government or college ID to earn the Verified badge. You can also do this later from your dashboard.</p>
              <input ref={fileRef} type="file" hidden accept="image/*,.pdf" aria-label="Upload ID document" onChange={e => form.setValue('idFile', e.target.files?.[0] || null)} />
              <div className="row gap-sm wrap">
                <Button variant="outline" icon={Upload} onClick={() => fileRef.current?.click()}>{v.idFile ? 'Choose a different file' : 'Upload ID'}</Button>
                {v.idFile && <span className="muted">{v.idFile.name}</span>}
              </div>
            </fieldset>

            <div className="stack-sm">
              <label className="check">
                <input type="checkbox" name="agree" checked={v.agree} onChange={form.handleChange} />
                <span>I will treat every pet with care, follow the owner&apos;s instructions and share my emergency plan when needed.</span>
              </label>
              {form.errors.agree && <p className="field-error" role="alert">{form.errors.agree}</p>}
            </div>

            <Button type="submit" size="lg" loading={busy}>Create walker profile</Button>
          </form>
        </div>
      </section>
    </>
  )
}
