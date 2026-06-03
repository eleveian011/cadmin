import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CdsStackedListbox } from './stacked-listbox'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

export interface CdsPaginationProps {
  page:        number
  totalPages:  number
  onChange:    (page: number) => void
  pageSize?:   number
  onPageSizeChange?: (size: number) => void
  className?:  string
}

export function CdsPagination({ page, totalPages, onChange, pageSize, onPageSizeChange, className = '' }: CdsPaginationProps) {
  const pageSizeListbox = PAGE_SIZE_OPTIONS.map(s => ({ value: String(s), label: `${s} / page` }))
  if (totalPages <= 1 && !onPageSizeChange) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce<(number | string)[]>((acc, p, idx, arr) => {
      if (idx > 0 && arr[idx - 1] !== p - 1) acc.push('…')
      acc.push(p)
      return acc
    }, [])

  return (
    <div className={`hidden md:flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-3">
        <span className="type-body-sm text-(--muted)">{`Page ${page} of ${totalPages}`}</span>
        {onPageSizeChange && pageSize && (
          <div className="flex items-center gap-1.5">
            <span className="type-body-sm text-(--muted)">·</span>
            <CdsStackedListbox
              size="sm"
              buttonWidthClass="w-25"
              value={String(pageSize)}
              onChange={(v) => onPageSizeChange(Number(v))}
              options={pageSizeListbox}
            />
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onChange(Math.max(1, page - 1))}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-(--muted) transition-colors hover:bg-(--item-hover) disabled:opacity-40 disabled:pointer-events-none"
        >
          <ChevronLeft size={14} />
        </button>
        {pages.map((p, i) =>
          p === '…'
            ? <span key={`e${i}`} className="type-body-sm text-(--muted) px-1">…</span>
            : (
              <button
                key={p}
                type="button"
                onClick={() => onChange(p as number)}
                className={`flex h-7 min-w-7 cursor-pointer items-center justify-center rounded-md px-2 type-body-sm font-semibold transition-colors ${
                  p === page
                    ? 'bg-(--fill) text-(--text)'
                    : 'text-(--muted) hover:bg-(--item-hover) hover:text-(--text)'
                }`}
              >
                {p}
              </button>
            )
        )}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-(--muted) transition-colors hover:bg-(--item-hover) disabled:opacity-40 disabled:pointer-events-none"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
