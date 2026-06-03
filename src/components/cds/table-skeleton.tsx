export interface CdsTableSkeletonProps {
  rows?: number
  className?: string
}

export function CdsTableSkeleton({ rows = 6, className = '' }: CdsTableSkeletonProps) {
  return (
    <div className={`flex flex-col border-y border-(--border) overflow-hidden ${className}`}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-3 py-3 border-t border-(--border) first:border-t-0">
          <div className="h-4 w-24 animate-pulse rounded bg-(--fill)" />
          <div className="h-4 w-16 animate-pulse rounded bg-(--fill)" />
          <div className="h-4 w-20 animate-pulse rounded bg-(--fill)" />
          <div className="ml-auto h-4 w-20 animate-pulse rounded bg-(--fill)" />
        </div>
      ))}
    </div>
  )
}
