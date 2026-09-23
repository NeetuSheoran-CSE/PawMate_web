import { useState } from 'react'
import { CheckCircle2, Mail, Phone, Siren } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader.jsx'
import Field from '../components/ui/Field.jsx'
import Button from '../components/ui/Button.jsx'
import Accordion from '../components/ui/Accordion.jsx'
import { CONTACT_TOPICS, SUPPORT } from '../data/constants.js'
import { FAQS } from '../data/content.js'
import { api } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useForm } from '../hooks/useForm.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { compose, email, minLength, required } from '../utils/validators.js'

const rules = {
  name: required('Name'),
  email: compose(required('Email'), email),
  topic: required('Topic'),
  message: compose(required('Message'), minLength(20, 'Message')),
}

export default function Contact() {
  useDocumentTitle('Contact & Help')
  const { user } = useAuth()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [ticket, setTicket] = useState('')
  const form = useForm({ name: user?.name || '', email: user?.email || '', topic: CONTACT_TOPICS[0], message: '' }, rules)

  const submit = async e => {
    e.preventDefault()
    if (!form.validate()) return
    setBusy(true)
    try {
      const res = await api.submitContact(form.values)
      setTicket(res.ticket)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Contact and help" subtitle="Questions, feedback or a safety concern? We read every message." />

      <section className="section-sm">
        <div className="container split split-wide">
          <div className="card">
            {ticket ? (
              <div className="success-panel">
                <CheckCircle2 size={44} aria-hidden />
                <h2 className="h3">Message sent</h2>
                <p>Thanks for reaching out. Your reference is <strong>{ticket}</strong>. We usually reply within one working day.</p>
                <Button variant="outline" onClick={() => { setTicket(''); form.reset({ ...form.values, message: '' }) }}>Send another message</Button>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="stack">
                <h2 className="h4">Send us a message</h2>
                <div className="form-grid">
                  <Field label="Your name" required autoComplete="name" {...form.field('name')} />
                  <Field label="Email" required type="email" autoComplete="email" {...form.field('email')} />
                </div>
                <Field as="select" label="Topic" {...form.field('topic')}>
                  {CONTACT_TOPICS.map(t => <option key={t}>{t}</option>)}
                </Field>
                <Field as="textarea" rows={6} label="Message" required placeholder="Tell us what happened or what you need help with." {...form.field('message')} />
                <Button type="submit" loading={busy}>Send message</Button>
              </form>
            )}
          </div>

          <div className="stack">
            <div className="card emergency-box stack">
              <h2 className="h4 row gap-xs"><Siren size={22} aria-hidden /> Emergency during a booking</h2>
              <ol className="plain-steps">
                <li>Call your walker or pet owner first.</li>
                <li>Contact the emergency contact and vet listed in the booking details.</li>
                <li>If your pet is in danger, go to the nearest vet clinic immediately.</li>
                <li>Then call our safety line so we can support you.</li>
              </ol>
              <a className="btn btn-danger" href={`tel:${SUPPORT.safetyLine.replace(/\s/g, '')}`}><Phone size={18} /> {SUPPORT.safetyLine}</a>
              <p className="muted small">{SUPPORT.hours}. Replace this placeholder number with your real safety line.</p>
            </div>
            <div className="card stack">
              <h2 className="h5">Other ways to reach us</h2>
              <a className="row gap-xs" href={`mailto:${SUPPORT.email}`}><Mail size={18} aria-hidden /> {SUPPORT.email}</a>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container narrow">
          <h2 className="center">Frequently asked questions</h2>
          <Accordion items={FAQS} />
        </div>
      </section>
    </>
  )
}
