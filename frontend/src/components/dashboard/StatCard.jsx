export default function StatCard({ icon: Icon, label, value, tone = 'green' }) {
  return (
    <div className={`stat-card stat-${tone}`}>
      <span className="stat-icon"><Icon size={22} aria-hidden /></span>
      <div>
        <p className="stat-value">{value}</p>
        <p className="stat-label">{label}</p>
      </div>
    </div>
  )
}
