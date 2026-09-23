/** Label + input/select/textarea + hint + error message. */
export default function Field({ label, name, as: Tag = 'input', error, hint, required, className = '', children, ...props }) {
  const id = props.id || `f-${name}`
  return (
    <div className={`field ${className}`}>
      {label && (
        <label htmlFor={id}>
          {label}
          {required && <span className="req" aria-hidden> *</span>}
        </label>
      )}
      <Tag
        id={id}
        name={name}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        className={error ? 'is-invalid' : ''}
        {...props}
      >
        {children}
      </Tag>
      {hint && !error && <p className="field-hint">{hint}</p>}
      {error && <p className="field-error" id={`${id}-err`} role="alert">{error}</p>}
    </div>
  )
}
