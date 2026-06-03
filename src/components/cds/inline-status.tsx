import React from 'react'
import { CdsSpinner } from './spinner'

export type CdsInlineStatusStatus = 'loading' | 'error' | 'complete'

export interface CdsInlineStatusProps {
  status:      CdsInlineStatusStatus
  onRetry?:    () => void
  sticky?:     boolean
  className?:  string
}

export function CdsInlineStatus({ status, onRetry, sticky = false, className = '' }: CdsInlineStatusProps) {
  // sticky implies use inside a table cell that already provides padding via cellPy
  // *and* width via its own wrapper; shrink our own vertical padding and don't
  // impose a width here, otherwise we can overflow the table on desktop.
  const stickyClass = sticky ? 'sticky left-0' : ''
  const py          = sticky ? 'py-1' : 'py-3'

  if (status === 'loading') {
    return (
      <div className={`flex items-center justify-center gap-2 ${py} ${stickyClass} ${className}`}>
        <CdsSpinner className="h-4 w-4 text-(--border)" />
        <span className="type-body-sm text-(--subtle)">Loading…</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className={`flex items-center justify-center ${py} ${stickyClass} ${className}`}>
        <button
          type="button"
          className="type-body-sm text-(--danger) cursor-pointer hover:underline"
          onClick={onRetry}
        >
          Failed to load — Retry
        </button>
      </div>
    )
  }

  return null
}
