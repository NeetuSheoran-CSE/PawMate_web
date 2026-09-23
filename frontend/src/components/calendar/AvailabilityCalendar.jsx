import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { WEEKDAYS } from '../../data/constants.js'
import { addDays, formatMonthYear, pad, todayISO, weekdayOf } from '../../utils/format.js'

/**
 * Month calendar that shows which days a walker works.
 * Pass `onSelect` to make available days clickable (booking page).
 * Pass `isBlocked(iso)` to grey out days that cannot be chosen (fully booked).
 */
export default function AvailabilityCalendar({ availableDays, selected, onSelect, isBlocked, maxAheadDays = 90 }) {
  const today = todayISO()
  const [cursor, setCursor] = useState(() => {
    const t = new Date()
    return new Date(t.getFullYear(), t.getMonth(), 1)
  })

  const lastDay = addDays(new Date(), maxAheadDays)
  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const lead = (first.getDay() + 6) % 7
    const count = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
    const out = Array.from({ length: lead }, () => null)
    for (let d = 1; d <= count; d++) out.push(new Date(cursor.getFullYear(), cursor.getMonth(), d))
    return out
  }, [cursor])

  const canPrev = cursor > new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const canNext = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1) <= lastDay
  const move = n => setCursor(c => new Date(c.getFullYear(), c.getMonth() + n, 1))

  return (
    <div className="calendar">
      <div className="cal-head">
        <button type="button" className="icon-btn" aria-label="Previous month" disabled={!canPrev} onClick={() => move(-1)}>
          <ChevronLeft size={20} />
        </button>
        <strong aria-live="polite">{formatMonthYear(cursor)}</strong>
        <button type="button" className="icon-btn" aria-label="Next month" disabled={!canNext} onClick={() => move(1)}>
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="cal-grid" role="grid">
        {WEEKDAYS.map(d => <span key={d} className="cal-dow" role="columnheader">{d.slice(0, 2)}</span>)}
        {cells.map((date, i) => {
          if (!date) return <span key={`b${i}`} />
          const iso = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
          const past = iso < today
          const works = availableDays.includes(weekdayOf(date))
          const blocked = isBlocked?.(iso)
          const beyond = date > lastDay
          const enabled = works && !past && !blocked && !beyond
          const cls = ['cal-day', works && !past ? 'works' : '', enabled && onSelect ? 'pick' : '', iso === today ? 'today' : '', selected === iso ? 'selected' : '']
            .filter(Boolean).join(' ')
          const label = `${date.toDateString()}${enabled ? ', available' : ', not available'}`
          return onSelect ? (
            <button key={iso} type="button" role="gridcell" className={cls} disabled={!enabled} aria-label={label} aria-pressed={selected === iso} onClick={() => onSelect(iso)}>
              {date.getDate()}
            </button>
          ) : (
            <span key={iso} role="gridcell" className={cls} aria-label={label}>{date.getDate()}</span>
          )
        })}
      </div>

      <div className="cal-legend">
        <span><i className="dot dot-works" /> Available</span>
        <span><i className="dot dot-off" /> Not available</span>
        {onSelect && <span><i className="dot dot-selected" /> Your choice</span>}
      </div>
    </div>
  )
}
