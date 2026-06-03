import React from 'react'

export interface CdsPillTabItem {
  value:     string
  label:     React.ReactNode
  icon?:     React.ReactNode
  count?:    number
}

export interface CdsPillTabsProps {
  value:     string
  onChange:  (value: string) => void
  items:     CdsPillTabItem[]
  className?: string
}

export function CdsPillTabs({ value, onChange, items, className = '' }: CdsPillTabsProps) {
  return (
    <div className={`inline-flex flex-nowrap gap-1 overflow-x-auto scrollbar-hide py-1 ${className}`}>
      {items.map((item) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={[
              'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 type-body transition-colors cursor-pointer whitespace-nowrap',
              active
                ? 'bg-(--accent-subtle) text-(--accent) border-(--accent-subtle) font-bold'
                : 'bg-transparent text-(--muted) border-transparent font-bold hover:bg-(--item-hover) hover:text-(--text) hover:border-(--border)',
            ].join(' ')}
          >
            {item.icon && <span className="inline-flex shrink-0 items-center">{item.icon}</span>}
            {item.label}
            {item.count !== undefined && item.count > 0 && (
              <span className={[
                'inline-flex items-center rounded-full px-1.5 py-px type-caption font-bold border',
                active
                  ? 'bg-(--accent-subtle) text-(--accent) border-transparent'
                  : 'bg-(--fill) text-(--muted) border-(--border)',
              ].join(' ')}>
                {item.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
