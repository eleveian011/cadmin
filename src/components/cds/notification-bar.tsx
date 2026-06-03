import React from 'react'

export type CdsNotificationBarTone = 'neutral' | 'warning' | 'danger' | 'info'

export interface CdsNotificationBarProps {
  tone?: CdsNotificationBarTone
  children: React.ReactNode
  className?: string
}

const TONE_CLASSES: Record<CdsNotificationBarTone, string> = {
  neutral: 'border border-(--border) text-(--text)',
  warning: 'bg-(--warning-bg) border border-(--warning-border) text-(--warning)',
  danger: 'bg-(--danger-bg) border border-(--danger-border) text-(--danger)',
  info: 'bg-(--info-bg) border border-(--info-border) text-(--info)',
}

export function CdsNotificationBar({ tone = 'neutral', children, className = '' }: CdsNotificationBarProps) {
  return (
    <div className={`rounded-md px-3 py-2 type-body ${TONE_CLASSES[tone]} ${className}`}>
      {children}
    </div>
  )
}
