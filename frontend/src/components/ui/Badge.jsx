export default function Badge({ tone = 'green', icon: Icon, children, className = '' }) {
  return (
    <span className={`badge badge-${tone} ${className}`}>
      {Icon && <Icon size={14} aria-hidden />}
      {children}
    </span>
  )
}
