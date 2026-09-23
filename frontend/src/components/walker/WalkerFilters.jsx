import Field from '../ui/Field.jsx'
import ChipSelect from '../ui/ChipSelect.jsx'
import { MAX_PRICE, PET_TYPES, SERVICES } from '../../data/constants.js'
import { formatINR } from '../../utils/format.js'

const AVAILABILITY = [
  { value: '', label: 'Any time' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekends', label: 'Weekends' },
  { value: 'morning', label: 'Mornings' },
  { value: 'afternoon', label: 'Afternoons' },
  { value: 'evening', label: 'Evenings' },
]

export default function WalkerFilters({ filters, setFilter, onClear }) {
  return (
    <div className="filters stack">
      <div className="row between">
        <h2 className="h4">Filters</h2>
        <button type="button" className="link-btn" onClick={onClear}>Clear all</button>
      </div>

      <ChipSelect
        label="Pet type"
        single
        options={PET_TYPES.slice(0, 4)}
        value={filters.petType ? [filters.petType] : []}
        onChange={([id]) => setFilter({ petType: id === filters.petType ? '' : id })}
      />

      <Field as="select" label="Service" name="service" value={filters.service} onChange={e => setFilter({ service: e.target.value })}>
        <option value="">All services</option>
        {SERVICES.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
      </Field>

      <Field as="select" label="Availability" name="availability" value={filters.availability} onChange={e => setFilter({ availability: e.target.value })}>
        {AVAILABILITY.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
      </Field>

      <div className="field">
        <label htmlFor="f-maxPrice">
          Price per hour: <strong>{filters.free ? 'Free only' : filters.maxPrice >= MAX_PRICE ? 'Any price' : `Up to ${formatINR(filters.maxPrice)}`}</strong>
        </label>
        <input
          id="f-maxPrice" type="range" min="50" max={MAX_PRICE} step="50" value={filters.maxPrice}
          disabled={filters.free} onChange={e => setFilter({ maxPrice: Number(e.target.value) })}
        />
        <label className="check">
          <input type="checkbox" checked={filters.free} onChange={e => setFilter({ free: e.target.checked })} />
          <span>Free volunteers only</span>
        </label>
      </div>

      <Field as="select" label="Minimum rating" name="minRating" value={filters.minRating} onChange={e => setFilter({ minRating: Number(e.target.value) })}>
        <option value={0}>Any rating</option>
        <option value={4}>4.0 and up</option>
        <option value={4.5}>4.5 and up</option>
        <option value={4.8}>4.8 and up</option>
      </Field>

      <label className="check">
        <input type="checkbox" checked={filters.verified} onChange={e => setFilter({ verified: e.target.checked })} />
        <span>Verified profiles only</span>
      </label>
    </div>
  )
}
