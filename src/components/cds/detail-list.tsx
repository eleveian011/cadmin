import React from 'react'
import { ExternalLink } from 'lucide-react'
import { CdsCopyButton } from './copy-button'

export interface CdsDetailListProps {
  bordered?: boolean
  className?: string
  children: React.ReactNode
}

export function CdsDetailList({ bordered = true, className = '', children }: CdsDetailListProps) {
  const wrapper = bordered
    ? `rounded-lg border border-(--border) px-4 py-2 ${className}`
    : className
  return <div className={wrapper}>{children}</div>
}

export interface CdsDetailRowProps {
  label: React.ReactNode
  value: React.ReactNode
  copyText?: string
  href?: string
  badge?: React.ReactNode
  truncated?: boolean
  className?: string
}

export function CdsDetailRow({
  label,
  value,
  copyText,
  href,
  badge,
  truncated,
  className = '',
}: CdsDetailRowProps) {
  const valueClass = truncated ? 'truncate' : 'break-all'
  const valueWrap = truncated ? 'min-w-0' : 'flex-wrap'

  return (
    <div className={`flex items-center gap-2 py-2 border-b border-(--border) last:border-b-0 ${className}`}>
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <span className="type-caption text-(--muted)">{label}</span>
        <span className={`type-body text-(--text) inline-flex items-center gap-1.5 ${valueWrap}`}>
          {href ? (
            <span className={`text-(--accent) ${valueClass}`}>{value}</span>
          ) : (
            <span className={valueClass}>{value}</span>
          )}
          {badge}
        </span>
      </div>
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-(--muted) hover:text-(--accent) hover:bg-(--item-hover) transition-colors"
          title="Open"
        >
          <ExternalLink size={13} />
        </a>
      )}
      {copyText && <CdsCopyButton text={copyText} />}
    </div>
  )
}
