import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BadgeCheck, HandHeart, Heart, MapPin, PawPrint, Quote, Search, Sparkles, Star, Wallet, Building2, Dog } from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import Field from '../components/ui/Field.jsx'
import Avatar from '../components/ui/Avatar.jsx'
import WalkerCard from '../components/walker/WalkerCard.jsx'
import { WalkerCardSkeleton } from '../components/ui/Skeleton.jsx'
import HeroIllustration from '../components/illustrations/HeroIllustration.jsx'
import { PET_TYPES } from '../data/constants.js'
import { OWNER_STEPS, TESTIMONIALS, TRUST_FEATURES } from '../data/content.js'
import { api } from '../services/api.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

const PILLARS = [
  { icon: Heart, title: 'Pet care', text: 'Walks, feeding and short stays that follow your instructions, from someone who has been vetted.' },
  { icon: Dog, title: 'Pet companionship', text: 'Real play and attention for pets that would otherwise spend the day alone.' },
  { icon: Wallet, title: 'Opportunity', text: 'Pet lovers earn on their own schedule, or volunteer for free and finally spend time with animals.' },
]

export default function Home() {
  useDocumentTitle('')
  const navigate = useNavigate()
  const [walkers, setWalkers] = useState(null)
  const [loc, setLoc] = useState('')
  const [pet, setPet] = useState('')

  useEffect(() => {
    let alive = true
    api.getWalkers({ sort: 'recommended' }).then(r => alive && setWalkers(r.slice(0, 3)))
    return () => { alive = false }
  }, [])

  const search = e => {
    e.preventDefault()
    const p = new URLSearchParams()
    if (loc.trim()) p.set('location', loc.trim())
    if (pet) p.set('petType', pet)
    navigate(`/find-walker${p.toString() ? `?${p}` : ''}`)
  }

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="pill"><PawPrint size={16} aria-hidden /> Trusted pet care community</span>
            <h1>Your Pet Deserves Love, Even When You&apos;re Busy.</h1>
            <p className="lead">Connect with trusted pet lovers who can walk, care for, and spend quality time with your pet.</p>
            <div className="row gap wrap">
              <Button to="/find-walker" size="lg">Find a Pet Walker</Button>
              <Button to="/become-a-walker" variant="accent" size="lg">Become a Pet Walker</Button>
            </div>
          </div>

          <div className="hero-visual" aria-hidden={false}>
            <HeroIllustration />
            <div className="float-chip chip-a"><BadgeCheck size={18} /> ID-verified walkers</div>
            <div className="float-chip chip-b"><Star size={18} fill="currentColor" /> Rated by real owners</div>
            <div className="float-chip chip-c"><MapPin size={18} /> Walkers in your area</div>
          </div>
        </div>

        <div className="container">
          <form className="quick-search" onSubmit={search} role="search">
            <Field label="Where are you?" name="loc" placeholder="Sector 45, Gurugram" value={loc} onChange={e => setLoc(e.target.value)} />
            <Field as="select" label="Pet type" name="pet" value={pet} onChange={e => setPet(e.target.value)}>
              <option value="">Any pet</option>
              {PET_TYPES.slice(0, 4).map(t => <option key={t.id} value={t.id}>{t.emoji} {t.label}</option>)}
            </Field>
            <Button type="submit" icon={Search} size="lg">Search walkers</Button>
          </form>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Pet care, companionship and opportunity in one place</h2>
            <p className="lead">Busy owners get reliable pet care, while pet lovers get the opportunity to spend time with animals and earn or volunteer.</p>
          </div>
          <div className="grid grid-3">
            {PILLARS.map(p => (
              <div key={p.title} className="card pillar">
                <span className="icon-tile"><p.icon size={26} aria-hidden /></span>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-tint">
        <div className="container">
          <div className="section-head">
            <h2>Made for three kinds of people</h2>
          </div>
          <div className="grid grid-3">
            <div className="card audience">
              <Dog size={30} aria-hidden />
              <h3>Pet owners</h3>
              <p>Long lectures, office hours or a trip home. Find someone reliable to walk and care for your pet.</p>
              <Link className="text-link" to="/find-walker">Find a walker</Link>
            </div>
            <div className="card audience">
              <HandHeart size={30} aria-hidden />
              <h3>Pet walkers and caregivers</h3>
              <p>Set your own hours, area and price. Earn from something you enjoy, or volunteer for free.</p>
              <Link className="text-link" to="/become-a-walker">Start walking</Link>
            </div>
            <div className="card audience">
              <Building2 size={30} aria-hidden />
              <h3>Students in hostels and PGs</h3>
              <p>Pets are not allowed where you live, but you can still spend time with one every week.</p>
              <Link className="text-link" to="/become-a-walker">Spend time with pets</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Book a walker in four steps</h2>
          </div>
          <ol className="steps">
            {OWNER_STEPS.map((s, i) => (
              <li key={s.title} className="step">
                <span className="step-num">{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
          <div className="center mt"><Button to="/how-it-works" variant="outline">See how it works</Button></div>
        </div>
      </section>

      <section className="section section-tint">
        <div className="container">
          <div className="section-head row between wrap end">
            <div>
              <h2>Top-rated walkers near you</h2>
              <p className="lead">Verified, reviewed and ready to meet your pet.</p>
            </div>
            <Button to="/find-walker" variant="outline">View all walkers</Button>
          </div>
          <div className="grid grid-3">
            {walkers ? walkers.map(w => <WalkerCard key={w.id} walker={w} />) : [0, 1, 2].map(i => <WalkerCardSkeleton key={i} />)}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split split-center">
          <div>
            <h2>Trust is built into every booking</h2>
            <p className="lead">Handing over your pet takes trust. These safeguards are part of how PawMate works, not extras.</p>
            <ul className="trust-list">
              {TRUST_FEATURES.map(f => (
                <li key={f.title}>
                  <span className="icon-tile sm"><f.icon size={20} aria-hidden /></span>
                  <div><strong>{f.title}</strong><p>{f.text}</p></div>
                </li>
              ))}
            </ul>
          </div>
          <div className="mock-booking card" aria-label="Example booking summary">
            <div className="row between"><strong>Booking request</strong><span className="badge status-accepted">Accepted</span></div>
            <div className="row gap"><Avatar name="Ananya Verma" size={52} tone={0} /><div><strong>Ananya Verma</strong><p className="muted row gap-xs"><BadgeCheck size={15} className="verified-icon" /> Verified walker</p></div></div>
            <dl className="dl">
              <div><dt>Pet</dt><dd>Bruno, Labrador</dd></div>
              <div><dt>When</dt><dd>Thu, 6 PM to 7 PM</dd></div>
              <div><dt>Instructions</dt><dd>Water break after 20 min</dd></div>
              <div><dt>Emergency contact</dt><dd>Shared with walker</dd></div>
              <div className="dl-total"><dt>Total</dt><dd>₹194</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <section className="section section-tint">
        <div className="container">
          <div className="section-head"><h2>What the community says</h2></div>
          <div className="grid grid-3">
            {TESTIMONIALS.map(t => (
              <figure key={t.name} className="card quote">
                <Quote size={24} aria-hidden />
                <blockquote>{t.text}</blockquote>
                <figcaption><Avatar name={t.name} size={40} tone={t.name.length} /><div><strong>{t.name}</strong><span className="muted">{t.role}</span></div></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta-band">
            <Sparkles size={30} aria-hidden />
            <h2>Give your pet the walk it deserves</h2>
            <p>Join owners and walkers who make pet care simpler, kinder and more affordable.</p>
            <div className="row gap wrap center">
              <Button to="/find-walker" variant="accent" size="lg">Find a Pet Walker</Button>
              <Button to="/become-a-walker" variant="light" size="lg">Become a Pet Walker</Button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
