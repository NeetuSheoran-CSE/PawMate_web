import { HeartHandshake, PawPrint, ShieldCheck, Users } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader.jsx'
import Button from '../components/ui/Button.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

const VALUES = [
  { icon: ShieldCheck, title: 'Safety first', text: 'Verification, emergency contacts and clear instructions are part of every booking.' },
  { icon: HeartHandshake, title: 'Fair for everyone', text: 'Walkers set their own price, or volunteer. Owners see the full cost before they book.' },
  { icon: Users, title: 'Community over transactions', text: 'Reviews, chat and repeat bookings build relationships between pets and people.' },
  { icon: PawPrint, title: 'Animals come first', text: 'We design every feature around what is good for the pet, not what is fastest.' },
]

export default function About() {
  useDocumentTitle('About Us')
  return (
    <>
      <PageHeader title="About PawMate" subtitle="We connect people who cannot always be there for their pets with people who wish they could have one." />

      <section className="section-sm">
        <div className="container split">
          <div className="card stack">
            <h2 className="h3">The problem</h2>
            <p>Many pet owners are stuck between college, jobs and long commutes, and their pets spend most of the day alone. Meanwhile, plenty of students in hostels and PGs love animals but are not allowed to keep one.</p>
            <p>There has been no simple, trusted place that brings these two groups together.</p>
          </div>
          <div className="card stack">
            <h2 className="h3">Our answer</h2>
            <p>PawMate lets owners find verified, reviewed pet lovers nearby for walks, play, basic care and short stays. Walkers choose their hours, area and price, or volunteer for free.</p>
            <p>Everybody wins: pets get attention, owners get peace of mind, and pet lovers get time with animals and a way to earn.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head"><h2>What we believe</h2></div>
          <div className="grid grid-4">
            {VALUES.map(v => (
              <div key={v.title} className="card">
                <span className="icon-tile sm"><v.icon size={20} aria-hidden /></span>
                <h3 className="h5">{v.title}</h3>
                <p>{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-sm">
        <div className="container">
          <div className="cta-band">
            <h2>Be part of the pack</h2>
            <p>Whether you need a walker or want to become one, it takes two minutes to start.</p>
            <div className="row gap wrap center">
              <Button to="/signup" variant="accent" size="lg">Create an account</Button>
              <Button to="/contact" variant="light" size="lg">Talk to us</Button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
