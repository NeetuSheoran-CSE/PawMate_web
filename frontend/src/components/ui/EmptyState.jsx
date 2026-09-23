export default function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="empty">
      {Icon && <span className="empty-icon"><Icon size={30} aria-hidden /></span>}
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  )
}
