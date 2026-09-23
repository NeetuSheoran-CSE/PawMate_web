import { Star } from 'lucide-react'

export function Rating({ value = 0, count, size = 16 }) {
  return (
    <span className="rating" aria-label={`Rated ${value} out of 5`}>
      <Star size={size} fill="currentColor" aria-hidden />
      <strong>{value.toFixed(1)}</strong>
      {count != null && <span className="muted">({count})</span>}
    </span>
  )
}

export function RatingInput({ value, onChange, error }) {
  return (
    <div className="field">
      <span className="field-label">Your rating</span>
      <div className="stars-input" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            className={n <= value ? 'on' : ''}
            onClick={() => onChange(n)}
          >
            <Star size={30} fill={n <= value ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  )
}
