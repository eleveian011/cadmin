import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Search, Check, Loader2, CircleX } from 'lucide-react'
import { CdsAvatar } from './avatar'

export interface CdsEntityOption {
  value:     string
  name:      string
  /** Secondary line (e.g. a code or type). */
  sublabel?: string
}

export interface CdsEntityPickerProps {
  /** Currently selected option value. */
  value:        string | null
  /** Caption line above the selected name (e.g. "Subscribe for"). */
  label:        string
  /** Selected entity's display name (bold trigger line). */
  selectedName: string | null
  /** Flat option list (already filtered/paginated by the consumer). */
  options:      CdsEntityOption[]
  /** Called (debounced 300ms) as the user types in the dropdown search. */
  onSearch?:    (query: string) => void
  onSelect:     (value: string) => void
  /** Load-more: invoked when the list is scrolled near the bottom. */
  onLoadMore?:  () => void
  hasMore?:     boolean
  loading?:     boolean
  searchPlaceholder?: string
  emptyText?:   string
  loadingText?: string
  className?:   string
}

/**
 * Entity picker — a square-avatar + two-line trigger that opens a searchable,
 * paginated dropdown of avatar rows. Presentational only: the consumer supplies
 * the (already filtered) options and handles search / load-more. Intrinsic
 * width, borderless trigger with a hover background — fits inline in headers and
 * toolbars. The dropdown portals to the body at z-2100 so it floats above modals.
 */
export function CdsEntityPicker({
  value,
  label,
  selectedName,
  options,
  onSearch,
  onSelect,
  onLoadMore,
  hasMore = false,
  loading = false,
  searchPlaceholder = 'Search…',
  emptyText = 'No results',
  loadingText = 'Loading…',
  className = '',
}: CdsEntityPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 6, left: rect.left, width: rect.width })
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  // Outside-click close (capture phase — works above modals too).
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (
        panelRef.current && e.target instanceof Node &&
        !panelRef.current.contains(e.target) &&
        !triggerRef.current?.contains(e.target)
      ) {
        setOpen(false); resetQuery()
      }
    }
    document.addEventListener('pointerdown', h, true)
    return () => document.removeEventListener('pointerdown', h, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function resetQuery() {
    setQuery('')
    if (onSearch) onSearch('')
  }

  const handleQuery = useCallback((q: string) => {
    setQuery(q)
    if (onSearch) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => onSearch(q), 300)
    }
  }, [onSearch])

  const handleScroll = () => {
    if (!listRef.current || !onLoadMore || !hasMore || loading) return
    const { scrollTop, scrollHeight, clientHeight } = listRef.current
    if (scrollHeight - scrollTop - clientHeight < 48) onLoadMore()
  }

  function pick(v: string) {
    onSelect(v)
    setOpen(false); resetQuery()
  }

  // When no onSearch handler is given, filter the provided options client-side.
  const visible = onSearch
    ? options
    : options.filter(o => o.name.toLowerCase().includes(query.toLowerCase()) || o.value.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Trigger — borderless, intrinsic width, hover background */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors cursor-pointer hover:bg-(--item-hover)"
      >
        <CdsAvatar shape="square" size="md" name={selectedName ?? undefined} />
        <div className="flex min-w-0 flex-col">
          <span className="type-caption text-(--muted)">{label}</span>
          <span className="type-body font-semibold text-(--text) truncate">{selectedName ?? '—'}</span>
        </div>
        <ChevronDown size={16} className={`shrink-0 text-(--muted) transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && createPortal(
        <div
          ref={panelRef}
          className="fixed z-2100 flex flex-col rounded-lg border border-(--border) bg-(--surface) shadow-(--shadow-overlay)"
          style={{ top: pos.top, left: pos.left, width: Math.max(pos.width, 280) }}
        >
          {/* Search */}
          <div className="flex items-center gap-2 border-b border-(--border) px-3 py-2">
            <Search size={14} className="shrink-0 text-(--subtle)" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => handleQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="min-w-0 flex-1 bg-transparent type-body-sm text-(--text) outline-none placeholder:text-(--subtle)"
            />
            {query && (
              <button type="button" className="shrink-0 text-(--muted) hover:text-(--text) cursor-pointer" onClick={() => handleQuery('')}>
                <CircleX size={14} />
              </button>
            )}
          </div>

          {/* List */}
          <div ref={listRef} className="max-h-72 overflow-y-auto py-1" onScroll={handleScroll}>
            {visible.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => pick(o.value)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors cursor-pointer hover:bg-(--item-hover)"
              >
                <CdsAvatar shape="square" size="sm" name={o.name} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className={`type-body-sm truncate ${o.value === value ? 'font-semibold text-(--accent)' : 'text-(--text)'}`}>{o.name}</span>
                  {o.sublabel && <span className="type-caption text-(--subtle) truncate">{o.sublabel}</span>}
                </div>
                {o.value === value && <Check size={14} className="shrink-0 text-(--accent)" />}
              </button>
            ))}

            {visible.length === 0 && !loading && (
              <div className="px-3 py-4 text-center type-body-sm text-(--muted)">{emptyText}</div>
            )}
            {loading && (
              <div className="flex items-center justify-center gap-2 py-2">
                <Loader2 size={14} className="animate-spin text-(--muted)" />
                <span className="type-caption text-(--muted)">{loadingText}</span>
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
