import React from 'react'
import { Search, CircleX } from 'lucide-react'
import { CdsButton } from './button'

export interface CdsSearchBarSlot {
  key:         string
  node:        React.ReactNode
}

export interface CdsSearchBarProps {
  inputValue:    string
  onInputChange: (value: string) => void
  inputPlaceholder?: string
  slots?:        CdsSearchBarSlot[]
  onSearch:      () => void
  onReset:       () => void
  searching?:    boolean
  hasActiveFilters?: boolean
  className?:    string
}

export function CdsSearchBar({
  inputValue,
  onInputChange,
  inputPlaceholder = 'Search…',
  slots = [],
  onSearch,
  onReset,
  searching = false,
  hasActiveFilters = false,
  className = '',
}: CdsSearchBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSearch()
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Combined input group */}
      <div className="flex h-8 items-stretch divide-x divide-(--border) rounded-md border border-(--border) bg-(--surface) overflow-hidden">
        <div className="flex items-center gap-2 px-2.5">
          <Search size={14} className="shrink-0 text-(--subtle)" />
          <input
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={inputPlaceholder}
            className="min-w-0 w-36 bg-transparent type-body-sm text-(--text) outline-none placeholder:text-(--subtle)"
          />
          <button type="button" className={`shrink-0 cursor-pointer transition-colors ${inputValue ? 'text-(--muted) hover:text-(--text)' : 'invisible'}`} onClick={() => onInputChange('')}>
            <CircleX size={14} />
          </button>
        </div>
        {slots.map(slot => (
          <div key={slot.key} className="flex items-center [&_button]:border-0 [&_button]:rounded-none [&_button]:shadow-none [&_button]:bg-transparent">
            {slot.node}
          </div>
        ))}
      </div>
      {/* Actions */}
      <CdsButton variant="subtle" size="sm" onClick={onSearch} loading={searching}>
        Search
      </CdsButton>
      {hasActiveFilters && (
        <CdsButton variant="text" size="sm" onClick={onReset}>
          Reset
        </CdsButton>
      )}
    </div>
  )
}
