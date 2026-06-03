import React from 'react'

export interface CdsContextPanelProps {
  title?:     string
  children:   React.ReactNode
  className?: string
}

export function CdsContextPanel({ title, children, className = '' }: CdsContextPanelProps) {
  return (
    <div className={`rounded-lg border border-(--border) px-4 py-3 type-body-sm text-(--muted) ${className}`}>
      {title && <p className="type-body font-semibold text-(--text)">{title}</p>}
      <div className={title ? 'mt-1' : ''}>{children}</div>
    </div>
  )
}
