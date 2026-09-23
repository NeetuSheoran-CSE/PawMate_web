import { Link } from 'react-router-dom'
import { BadgeCheck, CalendarDays, HandHeart, MapPin, Sparkles } from 'lucide-react'
import Avatar from '../ui/Avatar.jsx'
import Badge from '../ui/Badge.jsx'
import Button from '../ui/Button.jsx'
import { Rating } from '../ui/Rating.jsx'
import { petTypeById, serviceById } from '../../data/constants.js'
import { daysSummary, formatINR } from '../../utils/format.js'

export default function WalkerCard({ walker: w }) {
  return (
    <article className="walker-card card card-hover">
      <div className="row gap top">
        <Avatar name={w.name} photo={w.photo} size={64} tone={w.tone} />
        <div className="grow">
          <h3 className="walker-name">
            <Link to={`/walkers/${w.id}`}>{w.name}</Link>
            {w.verified && <BadgeCheck className="verified-icon" size={20} aria-label="Verified profile" />}
          </h3>
          <p className="muted row gap-xs"><MapPin size={15} aria-hidden /> {w.area}, {w.city}</p>
          <div className="row gap-sm wrap">
            {w.reviewCount > 0 ? <Rating value={w.rating} count={w.reviewCount} /> : <Badge tone="orange" icon={Sparkles}>New</Badge>}
            <span className="muted">{w.experienceYears} yr{w.experienceYears === 1 ? '' : 's'} experience</span>
          </div>
        </div>
      </div>

      <p className="walker-headline">{w.headline}</p>

      <ul className="tag-row" aria-label="Services">
        {w.services.map(id => <li key={id} className="tag">{serviceById(id)?.title}</li>)}
      </ul>

      <div className="walker-meta">
        <span title="Pets welcome" aria-label={`Pets welcome: ${w.petTypes.join(', ')}`}>
          {w.petTypes.map(t => <span key={t} aria-hidden>{petTypeById(t)?.emoji} </span>)}
        </span>
        <span className="row gap-xs muted"><CalendarDays size={15} aria-hidden /> {daysSummary(w.availability.days)}</span>
      </div>

      <div className="walker-foot">
        <div>
          {w.price === 0 ? (
            <Badge tone="orange" icon={HandHeart}>Free volunteer</Badge>
          ) : (
            <p className="price"><strong>{formatINR(w.price)}</strong><span className="muted"> / hour</span></p>
          )}
        </div>
        <div className="row gap-sm">
          <Button to={`/walkers/${w.id}`} variant="outline" size="sm">View profile</Button>
          <Button to={`/book/${w.id}`} size="sm">Book now</Button>
        </div>
      </div>
    </article>
  )
}
