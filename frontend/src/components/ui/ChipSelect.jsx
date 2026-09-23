/** Multi-select (or single select) pills. `value` is an array of ids. */
export default function ChipSelect({ options, value, onChange, single = false, error, label, name }) {
  const toggle = id => {
    if (single) return onChange([id])
    onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id])
  }
  return (
    <div className="field" role="group" aria-label={label}>
      {label && <span className="field-label">{label}</span>}
      <div className="chip-row">
        {options.map(o => {
          const on = value.includes(o.id)
          return (
            <button
              key={o.id}
              type="button"
              name={name}
              className={`chip ${on ? 'chip-on' : ''}`}
              aria-pressed={on}
              onClick={() => toggle(o.id)}
            >
              {o.emoji && <span aria-hidden>{o.emoji}</span>}
              {o.label}
            </button>
          )
        })}
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  )
}
