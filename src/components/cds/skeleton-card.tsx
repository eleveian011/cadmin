export interface CdsSkeletonCardProps {
  className?: string
}

export function CdsSkeletonCard({ className = '' }: CdsSkeletonCardProps) {
  return (
    <div className={`flex flex-col gap-3.5 rounded-lg border border-(--border) bg-(--surface) px-5 py-4 animate-pulse ${className}`}>
      <div className="flex items-center gap-2.5">
        <div className="h-6 w-6 rounded-full bg-(--fill)" />
        <div className="flex flex-col gap-1 flex-1">
          <div className="h-3.5 w-28 rounded bg-(--fill)" />
          <div className="h-3 w-16 rounded bg-(--fill)" />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <div className="h-3.5 w-48 rounded bg-(--fill)" />
        <div className="h-3 w-20 rounded bg-(--fill)" />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="h-3 w-24 rounded bg-(--fill)" />
        <div className="h-3 w-32 rounded bg-(--fill)" />
      </div>
    </div>
  )
}
