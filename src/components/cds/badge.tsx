import React from 'react'

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'

export interface CdsBadgeProps {
  tone?:      BadgeTone
  icon?:      React.ReactNode
  soft?:      boolean
  className?: string
  children?:  React.ReactNode
}

export function CdsBadge({ children, tone = 'neutral', icon, soft = false, className = '' }: CdsBadgeProps) {
  const tones: Record<BadgeTone, string> = {
    neutral: soft
      ? 'bg-(--neutral-bg) text-(--neutral-text)'
      : 'bg-(--neutral-bg) text-(--neutral) border border-(--neutral)',
    primary: soft
      ? 'bg-(--primary-bg) text-(--primary-text)'
      : 'bg-(--primary-bg) text-(--primary) border border-(--primary)',
    success: soft
      ? 'bg-(--success-bg) text-(--success-text)'
      : 'bg-(--success-bg) text-(--success) border border-(--success)',
    warning: soft
      ? 'bg-(--warning-bg) text-(--warning-text)'
      : 'bg-(--warning-bg) text-(--warning) border border-(--warning)',
    danger: soft
      ? 'bg-(--danger-bg) text-(--danger-text)'
      : 'bg-(--danger-bg) text-(--danger) border border-(--danger)',
    info: soft
      ? 'bg-(--info-bg) text-(--info-text)'
      : 'bg-(--info-bg) text-(--info) border border-(--info)',
  }

  return (
    <span className={`inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 type-caption font-semibold ${tones[tone]} ${className}`}>
      {icon && <span className="inline-flex shrink-0 items-center [&>svg]:h-4 [&>svg]:w-4">{icon}</span>}
      {children}
    </span>
  )
}
