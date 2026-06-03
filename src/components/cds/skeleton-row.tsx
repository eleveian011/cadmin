export interface CdsSkeletonRowProps {
  columns?: number
  className?: string
}

export function CdsSkeletonRow({ columns = 6, className = '' }: CdsSkeletonRowProps) {
  return (
    <div className={`flex items-center gap-4 px-3 py-2.5 ${className}`}>
      <div className="h-8 w-8 shrink-0 animate-pulse rounded-md bg-(--fill)" />
      <div className="flex flex-1 items-center gap-6">
        {Array.from({ length: columns - 1 }, (_, i) => (
          <div key={i} className="h-4 animate-pulse rounded bg-(--fill)" style={{ width: `${60 + Math.random() * 40}px` }} />
        ))}
      </div>
    </div>
  )
}
