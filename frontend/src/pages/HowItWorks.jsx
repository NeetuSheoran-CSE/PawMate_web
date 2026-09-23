import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader.jsx'
import Tabs from '../components/ui/Tabs.jsx'
import Button from '../components/ui/Button.jsx'
import Accordion from '../components/ui/Accordion.jsx'
import { FAQS, OWNER_STEPS, TRUST_FEATURES, WALKER_STEPS } from '../data/content.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

export default function HowItWorks() {
  useDocumentTitle('How It Works')
  const [tab, setTab] = useState('owner')
  const steps = tab === 'owner' ? OWNER_STEPS : WALKER_STEPS

  return (
    <>
      <PageHeader title="How PawMate works" subtitle="From first search to a happy, tired pet, in a few simple steps." />

      <section className="section-sm">
        <div className="container">
          <div className="center">
            <Tabs label="Choose your role" active={tab} onChange={setTab} tabs={[{ id: 'owner', label: 'I am a pet owner' }, { id: 'walker', label: 'I want to walk pets' }]} />
          </div>
          <ol className="steps mt" key={tab}>
            {steps.map((s, i) => (
              <li key={s.title} className="step">
                <span className="step-num">{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
          <div className="center mt">
            {tab === 'owner'
              ? <Button to="/find-walker" size="lg">Find a Pet Walker</Button>
              : <Button to="/become-a-walker" size="lg">Become a Pet Walker</Button>}
          </div>
        </div>
      </section>

      <section className="section section-tint">
        <div className="container">
          <div className="section-head">
            <h2 className="row gap-sm center"><ShieldCheck size={30} aria-hidden /> How we keep pets and people safe</h2>
          </div>
          <div className="grid grid-3">
            {TRUST_FEATURES.map(f => (
              <div key={f.title} className="card">
                <span className="icon-tile sm"><f.icon size={20} aria-hidden /></span>
                <h3 className="h5">{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container narrow">
          <h2 className="center">Questions people ask</h2>
          <Accordion items={FAQS} />
        </div>
      </section>
    </>
  )
}
