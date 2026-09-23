import { useState } from 'react'
import Button from '../ui/Button.jsx'
import Field from '../ui/Field.jsx'
import ChipSelect from '../ui/ChipSelect.jsx'
import AvailabilityCalendar from '../calendar/AvailabilityCalendar.jsx'
import { SLOTS, WEEKDAYS } from '../../data/constants.js'
import { numberBetween } from '../../utils/validators.js'

/** Walker edits weekly days, time slots, price and whether they are taking requests. */
export default function AvailabilityEditor({ walker, onSave }) {
  const [days, setDays] = useState(walker.availability.days)
  const [slots, setSlots] = useState(walker.availability.slots)
  const [free, setFree] = useState(walker.price === 0)
  const [price, setPrice] = useState(walker.price || 150)
  const [active, setActive] = useState(walker.active !== false)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const save = async () => {
    const next = {}
    if (!days.length) next.days = 'Choose at least one day'
    if (!slots.length) next.slots = 'Choose at least one time slot'
    if (!free) {
      const msg = numberBetween(50, 1000, 'Price')(String(price))
      if (msg) next.price = msg
    }
    setErrors(next)
    if (Object.keys(next).length) return
    setBusy(true)
    await onSave({ availability: { days, slots }, price: free ? 0 : Number(price), active })
    setBusy(false)
  }

  return (
    <div className="split">
      <div className="card stack">
        <h3>Weekly availability</h3>
        <ChipSelect label="Days you work" options={WEEKDAYS.map(d => ({ id: d, label: d }))} value={days} onChange={setDays} error={errors.days} />
        <ChipSelect label="Time slots" options={SLOTS.map(s => ({ id: s.id, label: `${s.label} (${s.time})` }))} value={slots} onChange={setSlots} error={errors.slots} />

        <div className="field">
          <span className="field-label">Pricing</span>
          <label className="check"><input type="checkbox" checked={free} onChange={e => setFree(e.target.checked)} /><span>I volunteer for free</span></label>
        </div>
        {!free && (
          <Field label="Price per hour (₹)" name="price" type="number" min="50" max="1000" step="10" value={price} error={errors.price} onChange={e => setPrice(e.target.value)} />
        )}

        <label className="check">
          <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />
          <span>Show my profile in search and accept new requests</span>
        </label>

        <Button onClick={save} loading={busy}>Save changes</Button>
      </div>

      <div className="card stack">
        <h3>What owners see</h3>
        <AvailabilityCalendar availableDays={days} />
      </div>
    </div>
  )
}
