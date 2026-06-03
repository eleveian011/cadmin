import React from 'react'
import { CdsBadge } from './badge'
import type { BadgeTone } from './badge'

export interface CdsMetricCardProps {
  label:      string
  value:      string | number
  badge?:     string
  badgeTone?: BadgeTone
  sub?:       string
  chart?:     React.ReactNode
  className?: string
}

export function CdsMetricCard({
  label,
  value,
  badge,
  badgeTone = 'neutral',
  sub,
  chart,
  className = '',
}: CdsMetricCardProps) {
  return (
    <div className={`flex min-w-0 flex-col overflow-hidden rounded-lg border border-(--border) bg-(--surface) ${className}`}>
      <div className="flex flex-1 flex-col gap-1.5 px-4 pt-3.5 pb-2.5">
        <div className="type-caption uppercase font-semibold text-(--subtle)">{label}</div>
        <div className="flex items-center gap-2">
          <span className="type-h2 font-bold tracking-tight text-(--text)">{value}</span>
          {badge && <CdsBadge tone={badgeTone} className="px-1.5! py-0! type-caption! font-semibold!">{badge}</CdsBadge>}
        </div>
        {sub && <div className="type-caption text-(--muted)">{sub}</div>}
      </div>
      {chart && <div className="-mb-px h-9">{chart}</div>}
    </div>
  )
}
