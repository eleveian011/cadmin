import React from 'react'

export interface CdsSegmentTabItem {
  value: string
  label: React.ReactNode
}

export interface CdsSegmentTabsProps {
  value: string
  onChange: (value: string) => void
  items: CdsSegmentTabItem[]
  className?: string
}

export function CdsSegmentTabs({ value, onChange, items, className = '' }: CdsSegmentTabsProps) {
  return (
    <div className={`inline-flex w-fit h-8 rounded-md border border-(--border) overflow-hidden ${className}`}>
      {items.map((item, idx) => {
        const active = item.value === value
        const prevActive = idx > 0 && items[idx - 1].value === value
        const borderL = idx > 0
          ? (active || prevActive ? 'border-l border-(--border)' : 'border-l border-(--border)')
          : ''
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={`cursor-pointer px-3 py-1 type-body-sm font-medium transition-colors whitespace-nowrap ${borderL} ${active ? 'bg-(--fill) text-(--text)' : 'bg-(--surface) text-(--muted) hover:bg-(--item-hover) hover:text-(--text)'}`}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
