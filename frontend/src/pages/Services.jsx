import { Check, HandHeart } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader.jsx'
import Button from '../components/ui/Button.jsx'
import { PET_TYPES, SERVICES } from '../data/constants.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

const PRICE_GUIDE = [
  ['Pet Walking', '₹100 – ₹300 per hour'],
  ['Play & Companionship', '₹100 – ₹250 per hour'],
  ['Basic Care', '₹150 – ₹300 per hour'],
  ['Short-term Sitting', '₹200 – ₹350 per hour'],
]

export default function Services() {
  useDocumentTitle('Services')
  return (
    <>
      <PageHeader title="Services for every kind of busy day" subtitle="Walkers choose the services they offer. You choose the one your pet needs." />

      <section className="section-sm">
        <div className="container grid grid-2">
          {SERVICES.map(s => (
            <article key={s.id} className="card service-card">
              <span className="icon-tile"><s.icon size={26} aria-hidden /></span>
              <h2 className="h4">{s.title}</h2>
              <p>{s.desc}</p>
              <ul className="check-list">
                {s.includes.map(i => <li key={i}><Check size={16} aria-hidden /> {i}</li>)}
              </ul>
              <Button to={`/find-walker?service=${s.id}`} variant="outline" size="sm">Find walkers for this</Button>
            </article>
          ))}
        </div>
      </section>

      <section className="section-sm">
        <div className="container">
          <div className="volunteer-band">
            <HandHeart size={34} aria-hidden />
            <div className="grow">
              <h2 className="h3">Free volunteer walks</h2>
              <p>Some walkers, often students in hostels and PGs, volunteer because they miss having a pet around. Look for the orange Free badge, or filter for free volunteers only.</p>
            </div>
            <Button to="/find-walker?free=1" variant="accent">See free volunteers</Button>
          </div>
        </div>
      </section>

      <section className="section-sm">
        <div className="container split">
          <div className="card stack">
            <h2 className="h4">Typical prices</h2>
            <p className="muted">Walkers set their own rates. Here is what you can usually expect.</p>
            <dl className="dl">{PRICE_GUIDE.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
            <p className="muted small">A small service fee is added at checkout. Volunteers are always free.</p>
          </div>
          <div className="card stack">
            <h2 className="h4">Pets we support</h2>
            <ul className="tag-row big">{PET_TYPES.map(t => <li key={t.id} className="tag">{t.emoji} {t.label}</li>)}</ul>
            <p className="muted">Each walker lists the pets they are comfortable with, so you only see people who fit.</p>
          </div>
        </div>
      </section>
    </>
  )
}
