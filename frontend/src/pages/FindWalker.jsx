import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MapPin, SearchX, SlidersHorizontal } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader.jsx'
import Button from '../components/ui/Button.jsx'
import Modal from '../components/ui/Modal.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import WalkerCard from '../components/walker/WalkerCard.jsx'
import WalkerFilters from '../components/walker/WalkerFilters.jsx'
import { WalkerCardSkeleton } from '../components/ui/Skeleton.jsx'
import { MAX_PRICE } from '../data/constants.js'
import { api } from '../services/api.js'
import { useDebounce } from '../hooks/useDebounce.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

export default function FindWalker() {
  useDocumentTitle('Find a Pet Walker')
  const [params, setParams] = useSearchParams()
  const [walkers, setWalkers] = useState(null)
  const [error, setError] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const key = params.toString()

  const filters = useMemo(() => {
    const p = new URLSearchParams(key)
    return {
      location: p.get('location') || '',
      petType: p.get('petType') || '',
      service: p.get('service') || '',
      availability: p.get('availability') || '',
      maxPrice: Number(p.get('maxPrice')) || MAX_PRICE,
      free: p.get('free') === '1',
      minRating: Number(p.get('minRating')) || 0,
      verified: p.get('verified') === '1',
      sort: p.get('sort') || 'recommended',
    }
  }, [key])

  const setFilter = patch => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([k, v]) => {
      const empty = v === '' || v === false || v == null || (k === 'maxPrice' && v >= MAX_PRICE) || (k === 'minRating' && !v) || (k === 'sort' && v === 'recommended')
      if (empty) next.delete(k)
      else next.set(k, v === true ? '1' : String(v))
    })
    setParams(next, { replace: true })
  }

  // location text box is debounced so we don't search on every keystroke
  const [q, setQ] = useState(filters.location)
  const debouncedQ = useDebounce(q, 450)
  useEffect(() => {
    if (debouncedQ.trim() !== filters.location) setFilter({ location: debouncedQ.trim() })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ])

  useEffect(() => {
    let alive = true
    setWalkers(null)
    setError('')
    api.getWalkers(filters)
      .then(r => alive && setWalkers(r))
      .catch(() => alive && setError('We could not load walkers. Please try again.'))
    return () => { alive = false }
  }, [filters])

  const clear = () => { setQ(''); setParams({}, { replace: true }) }
  const activeCount = [filters.petType, filters.service, filters.availability, filters.free, filters.minRating, filters.verified, filters.maxPrice < MAX_PRICE].filter(Boolean).length

  return (
    <>
      <PageHeader title="Find a pet walker" subtitle="Search by area, then narrow down by pet, service, availability and price.">
        <form className="search-line" onSubmit={e => { e.preventDefault(); setFilter({ location: q.trim() }) }} role="search">
          <MapPin size={20} aria-hidden />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by area or city, e.g. Sector 45 or Saket" aria-label="Location" />
          <Button type="submit" size="sm">Search</Button>
        </form>
      </PageHeader>

      <section className="section-sm">
        <div className="container results-layout">
          <aside className="card filters-desktop"><WalkerFilters filters={filters} setFilter={setFilter} onClear={clear} /></aside>

          <div>
            <div className="row between wrap gap-sm results-bar">
              <p aria-live="polite">{walkers ? <><strong>{walkers.length}</strong> walker{walkers.length === 1 ? '' : 's'} found</> : 'Searching…'}</p>
              <div className="row gap-sm">
                <Button variant="outline" size="sm" icon={SlidersHorizontal} className="filters-toggle" onClick={() => setShowFilters(true)}>
                  Filters{activeCount ? ` (${activeCount})` : ''}
                </Button>
                <select aria-label="Sort walkers" className="select-sm" value={filters.sort} onChange={e => setFilter({ sort: e.target.value })}>
                  <option value="recommended">Recommended</option>
                  <option value="rating">Highest rated</option>
                  <option value="priceLow">Price: low to high</option>
                  <option value="priceHigh">Price: high to low</option>
                  <option value="experience">Most experienced</option>
                </select>
              </div>
            </div>

            {error ? (
              <EmptyState icon={SearchX} title="Something went wrong" text={error} action={<Button onClick={() => setParams(new URLSearchParams(params))}>Try again</Button>} />
            ) : !walkers ? (
              <div className="grid grid-2">{[0, 1, 2, 3].map(i => <WalkerCardSkeleton key={i} />)}</div>
            ) : walkers.length === 0 ? (
              <EmptyState
                icon={SearchX} title="No walkers match these filters"
                text="Try a different area, remove a filter, or widen your price range."
                action={<Button onClick={clear}>Clear all filters</Button>}
              />
            ) : (
              <div className="grid grid-2">{walkers.map(w => <WalkerCard key={w.id} walker={w} />)}</div>
            )}
          </div>
        </div>
      </section>

      <Modal open={showFilters} onClose={() => setShowFilters(false)} title="Filter walkers" size="sm">
        <WalkerFilters filters={filters} setFilter={setFilter} onClear={clear} />
        <Button block className="mt" onClick={() => setShowFilters(false)}>Show results</Button>
      </Modal>
    </>
  )
}
