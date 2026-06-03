import type { ReactNode } from 'react'

export interface CdsCardProps {
  children?: ReactNode
  className?: string
  onClick?: () => void
  /** @default 'card' */
  variant?: 'card' | 'row'
}

const INTERACTIVE = 'cursor-pointer transition-all duration-250 hover:bg-(--surface-overlay) hover:shadow-(--shadow-lg) hover:scale-[1.02]'

export function CdsCard({ children, className = '', onClick, variant = 'card' }: CdsCardProps) {
  const interactive = !!onClick

  if (!children) {
    if (variant === 'row') {
      return (
        <div className={`flex flex-wrap items-center gap-2 md:gap-4 rounded-md border border-(--border) bg-(--surface) px-3 md:px-5 py-3.5 animate-pulse ${className}`}>
          <div className="h-4 w-24 md:w-28 rounded bg-(--fill)" />
          <div className="h-5 w-14 rounded-full bg-(--fill)" />
          <div className="h-4 w-40 md:w-52 rounded bg-(--fill)" />
          <div className="flex-1 hidden md:block" />
          <div className="flex gap-2">
            <div className="h-5 w-12 rounded-full bg-(--fill)" />
            <div className="h-5 w-12 rounded-full bg-(--fill)" />
          </div>
        </div>
      )
    }

    return (
      <div className={`flex flex-col gap-3.5 rounded-md border border-(--border) bg-(--surface) px-5 py-4 animate-pulse ${className}`}>
        <div className="h-4 w-32 rounded bg-(--fill)" />
        <div className="flex flex-col gap-1">
          <div className="h-3.5 w-full rounded bg-(--fill)" />
          <div className="h-3.5 w-3/4 rounded bg-(--fill)" />
          <div className="h-3.5 w-1/2 rounded bg-(--fill)" />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-5 w-16 rounded-full bg-(--fill)" />
          <div className="h-3 w-24 rounded bg-(--fill)" />
        </div>
      </div>
    )
  }

  const Tag = interactive ? 'button' : 'div'
  const layout = variant === 'row'
    ? 'flex-row flex-wrap items-center gap-2 md:gap-4 px-3 md:px-5 py-3.5'
    : 'flex-col gap-3.5 px-5 py-4'

  return (
    <Tag
      type={interactive ? 'button' : undefined}
      className={`flex rounded-md border border-(--border) bg-(--surface) text-left ${layout} ${interactive ? INTERACTIVE : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </Tag>
  )
}
