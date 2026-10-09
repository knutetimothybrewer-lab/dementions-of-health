/** Brand-stripe shimmer placeholder. Size it with className. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className ?? ''}`} aria-hidden="true" />
}

export function ScreenSkeleton() {
  return (
    <div className="space-y-4 p-4" role="status" aria-label="Loading">
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-24" />
      <Skeleton className="h-24" />
      <Skeleton className="h-24" />
    </div>
  )
}
