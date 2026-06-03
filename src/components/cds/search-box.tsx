import React from 'react'
import { Search, CircleX } from 'lucide-react'

export type CdsSearchBoxSize = 'sm' | 'md' | 'lg'

export interface CdsSearchBoxProps {
  value?:       string
  onChange?:    React.ChangeEventHandler<HTMLInputElement>
  onClear?:    () => void
  onFocus?:    React.FocusEventHandler<HTMLInputElement>
  onBlur?:     React.FocusEventHandler<HTMLInputElement>
  placeholder?: string
  size?:        CdsSearchBoxSize
  className?:   string
  inputRef?:    React.RefObject<HTMLInputElement | null>
}

const sizes: Record<CdsSearchBoxSize, string> = {
  sm: 'h-8 px-2.5 type-body-sm',
  md: 'h-9 px-3 type-body',
  lg: 'h-10 px-3 type-body',
}

export function CdsSearchBox({
  value,
  onChange,
  onClear,
  onFocus,
  onBlur,
  placeholder = 'Search…',
  size = 'md',
  className = '',
  inputRef,
}: CdsSearchBoxProps) {
  return (
    <div className={`flex items-center gap-2 rounded-md border border-(--border) bg-(--surface) transition hover:bg-(--item-hover) focus-within:border-(--accent) focus-within:bg-(--surface) ${sizes[size]} ${className}`}>
      <Search size={14} className="shrink-0 text-(--subtle)" />
      <input
        ref={inputRef}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-inherit outline-none placeholder:text-(--subtle)"
      />
      {value && onClear && (
        <button type="button" className="shrink-0 text-(--muted) hover:text-(--text) cursor-pointer transition-colors" onClick={onClear}>
          <CircleX size={14} />
        </button>
      )}
    </div>
  )
}
