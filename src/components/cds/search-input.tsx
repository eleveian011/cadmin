import React from 'react'
import { Search, CircleX } from 'lucide-react'

export interface CdsSearchInputProps {
  value?:       string
  onChange?:    React.ChangeEventHandler<HTMLInputElement>
  onClear?:    () => void
  onFocus?:     React.FocusEventHandler<HTMLInputElement>
  onBlur?:      React.FocusEventHandler<HTMLInputElement>
  placeholder?: string
  right?:       React.ReactNode
  shortcut?:    React.ReactNode
  active?:      boolean
  className?:   string
  inputRef?:    React.RefObject<HTMLInputElement | null>
}

export function CdsSearchInput({
  value,
  onChange,
  onClear,
  onFocus,
  onBlur,
  placeholder,
  right,
  shortcut,
  active = false,
  className = '',
  inputRef,
}: CdsSearchInputProps) {
  return (
    <div className={`flex h-8 items-center gap-2 rounded-md border px-2.5 transition ${active ? 'border-(--accent) bg-(--surface)' : 'border-transparent bg-(--fill) hover:border-(--border)'} ${className}`}>
      <Search size={14} className="shrink-0 text-(--subtle)" />
      <input
        ref={inputRef}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent type-body text-(--text) outline-none placeholder:text-(--subtle)"
      />
      {value && onClear && (
        <button type="button" className="shrink-0 text-(--muted) hover:text-(--text) cursor-pointer transition-colors" onClick={onClear}>
          <CircleX size={14} />
        </button>
      )}
      {shortcut && !value && (
        <kbd className="hidden shrink-0 items-center gap-0.5 rounded border border-(--border) bg-(--surface) px-1.5 py-0.5 font-bold type-caption text-(--subtle) sm:flex">
          {shortcut}
        </kbd>
      )}
      {right}
    </div>
  )
}
