export function Skeleton({ h = 16, w = '100%', r = 10, className = '' }) {
  return <span className={`skeleton ${className}`} style={{ height: h, width: w, borderRadius: r }} aria-hidden />
}

export function WalkerCardSkeleton() {
  return (
    <div className="walker-card card" aria-hidden>
      <div className="row gap">
        <Skeleton h={64} w={64} r={32} />
        <div className="grow stack-sm">
          <Skeleton h={18} w="60%" />
          <Skeleton h={14} w="40%" />
        </div>
      </div>
      <Skeleton h={14} />
      <Skeleton h={14} w="80%" />
      <div className="row gap">
        <Skeleton h={40} w="50%" r={14} />
        <Skeleton h={40} w="50%" r={14} />
      </div>
    </div>
  )
}

export function ListSkeleton({ rows = 3 }) {
  return (
    <div className="stack" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card stack-sm">
          <Skeleton h={20} w="45%" />
          <Skeleton h={14} w="70%" />
          <Skeleton h={14} w="55%" />
        </div>
      ))}
    </div>
  )
}
