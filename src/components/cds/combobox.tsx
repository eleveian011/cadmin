import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Search, CircleX, ChevronDown, Loader2 } from 'lucide-react'

export type CdsComboboxSize = 'sm' | 'md' | 'lg'

export interface CdsComboboxOption {
  value: string
  label: string
}

export interface CdsComboboxProps {
  value:          string
  onChange:       (value: string) => void
  options:        CdsComboboxOption[]
  onSearch?:      (query: string) => void
  onLoadMore?:    () => void
  hasMore?:       boolean
  loading?:       boolean
  placeholder?:   string
  size?:          CdsComboboxSize
  className?:     string
  disabled?:      boolean
}

const sizes: Record<CdsComboboxSize, string> = {
  sm: 'h-8 px-2.5 type-body-sm',
  md: 'h-9 px-3 type-body',
  lg: 'h-10 px-3 type-body',
}

export function CdsCombobox({
  value,
  onChange,
  options,
  onSearch,
  onLoadMore,
  hasMore = false,
  loading = false,
  placeholder = 'Select…',
  size = 'md',
  className = '',
  disabled = false,
}: CdsComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })
  const ref = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectedLabel = options.find(o => o.value === value)?.label ?? ''

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (
        panelRef.current && e.target instanceof Node &&
        !panelRef.current.contains(e.target) &&
        !ref.current?.contains(e.target)
      ) {
        e.preventDefault()
        e.stopPropagation()
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('pointerdown', h, true)
    return () => document.removeEventListener('pointerdown', h, true)
  }, [open])

  useEffect(() => {
    if (open && ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width })
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  const handleQueryChange = useCallback((q: string) => {
    setQuery(q)
    if (onSearch) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => onSearch(q), 300)
    }
  }, [onSearch])

  const handleSelect = (val: string) => {
    onChange(val)
    setOpen(false)
    setQuery('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setQuery('')
    if (onSearch) onSearch('')
  }

  const handleScroll = () => {
    if (!listRef.current || !onLoadMore || !hasMore || loading) return
    const { scrollTop, scrollHeight, clientHeight } = listRef.current
    if (scrollHeight - scrollTop - clientHeight < 40) onLoadMore()
  }

  const filtered = onSearch
    ? options
    : options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={`flex w-full items-center gap-2 rounded-md border border-(--border) bg-(--surface) transition cursor-pointer hover:bg-(--item-hover) focus:border-(--accent) ${sizes[size]} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <span className={`flex-1 text-left truncate ${value ? 'text-(--text)' : 'text-(--subtle)'}`}>
          {value ? selectedLabel : placeholder}
        </span>
        {value && (
          <span className="shrink-0 text-(--muted) hover:text-(--text) transition-colors" onClick={handleClear}>
            <CircleX size={14} />
          </span>
        )}
        <ChevronDown size={14} className={`shrink-0 text-(--muted) transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && createPortal(
        <div
          ref={panelRef}
          className="fixed z-9999 rounded-lg border border-(--border) bg-(--surface) shadow-(--shadow-overlay)"
          style={{ top: pos.top, left: pos.left, width: Math.max(pos.width, 192) }}
        >
          <div className="flex items-center gap-2 border-b border-(--border) px-2.5 py-2">
            <Search size={14} className="shrink-0 text-(--subtle)" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search…"
              className="min-w-0 flex-1 bg-transparent type-body-sm text-(--text) outline-none placeholder:text-(--subtle)"
            />
            {query && (
              <button type="button" className="shrink-0 text-(--muted) hover:text-(--text) cursor-pointer" onClick={() => handleQueryChange('')}>
                <CircleX size={14} />
              </button>
            )}
          </div>
          <div ref={listRef} className="max-h-48 overflow-y-auto py-1" onScroll={handleScroll}>
            {filtered.length === 0 && !loading && (
              <div className="px-3 py-2 type-body-sm text-(--muted) text-center">No results</div>
            )}
            {filtered.map(opt => (
              <button
                key={opt.value}
                type="button"
                className={`flex w-full cursor-pointer items-center px-3 py-1.5 type-body-sm text-left transition-colors hover:bg-(--item-hover) ${opt.value === value ? 'bg-(--accent-subtle) text-(--accent) font-semibold' : 'text-(--text)'}`}
                onClick={() => handleSelect(opt.value)}
              >
                {opt.label}
              </button>
            ))}
            {loading && (
              <div className="flex items-center justify-center gap-2 py-2">
                <Loader2 size={14} className="animate-spin text-(--muted)" />
                <span className="type-caption text-(--muted)">Loading…</span>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
