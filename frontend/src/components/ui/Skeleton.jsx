/**
 * components/ui/Skeleton.jsx
 * Placeholder animado mientras cargan datos.
 */
export function Skeleton({ className = '' }) {
  return (
    <div className={`skeleton rounded-lg ${className}`} />
  )
}

export function SkeletonCard({ rows = 3 }) {
  return (
    <div className="card p-4 space-y-3">
      <Skeleton className="h-5 w-2/5" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" style={{ animationDelay: `${i * 80}ms` }} />
      ))}
    </div>
  )
}

export function SkeletonGrid({ count = 12 }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-xl" style={{ animationDelay: `${i * 40}ms` }} />
      ))}
    </div>
  )
}
