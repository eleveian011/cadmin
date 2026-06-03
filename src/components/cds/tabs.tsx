import React from 'react'

export interface CdsTabItem {
  value: string
  label: React.ReactNode
}

export interface CdsTabsProps {
  value:    string
  onChange: (value: string) => void
  items:    CdsTabItem[]
  className?: string
}

export function CdsTabs({ value, onChange, items, className = '' }: CdsTabsProps) {
  return (
    <div className={`inline-flex rounded-md border border-(--border) overflow-hidden ${className}`}>
      {items.map((item, idx) => {
        const active = item.value === value
        const prevActive = idx > 0 && items[idx - 1].value === value
        const borderL = idx > 0
          ? (active || prevActive ? 'border-l border-(--accent-subtle)' : 'border-l border-(--border)')
          : ''
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={`cursor-pointer px-4 py-1.5 type-body font-bold transition-colors ${borderL} ${active ? 'bg-(--accent-subtle) text-(--accent-text)' : 'bg-(--surface) text-(--muted) hover:bg-(--item-hover)'}`}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
