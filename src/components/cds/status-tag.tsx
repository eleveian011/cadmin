import type { ReactNode } from 'react'

export type CdsStatusTagTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'

export interface CdsStatusTagProps {
  tone?: CdsStatusTagTone
  children: ReactNode
  className?: string
}

const TONE_COLOR: Record<CdsStatusTagTone, string> = {
  neutral: 'text-(--muted)',
  primary: 'text-(--accent)',
  success: 'text-(--success)',
  warning: 'text-(--warning)',
  danger:  'text-(--danger)',
  info:    'text-(--info)',
}

export function CdsStatusTag({ tone = 'neutral', children, className = '' }: CdsStatusTagProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className={`inline-block h-1.5 w-1.5 rotate-45 ${TONE_COLOR[tone]}`} style={{ background: 'currentColor' }} />
      <span className="type-body text-(--text)">{children}</span>
    </span>
  )
}
