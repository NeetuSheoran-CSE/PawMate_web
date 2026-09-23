export default function PageHeader({ title, subtitle, children }) {
  return (
    <header className="page-header">
      <div className="container">
        <h1>{title}</h1>
        {subtitle && <p className="lead">{subtitle}</p>}
        {children}
      </div>
    </header>
  )
}
