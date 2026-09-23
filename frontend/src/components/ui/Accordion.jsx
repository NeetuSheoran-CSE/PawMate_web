import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function Accordion({ items }) {
  const [open, setOpen] = useState(0)
  return (
    <div className="accordion">
      {items.map((it, i) => {
        const isOpen = open === i
        return (
          <div key={it.q} className={`acc-item ${isOpen ? 'open' : ''}`}>
            <h3>
              <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : i)}>
                <span>{it.q}</span>
                <ChevronDown size={20} aria-hidden />
              </button>
            </h3>
            <div className="acc-panel" hidden={!isOpen}>
              <p>{it.a}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
