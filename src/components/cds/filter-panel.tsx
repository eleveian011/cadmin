import React, { type ReactNode } from 'react'

export interface CdsFilterPanelProps {
  /** The pills (CdsFilterPill instances). Always rendered as the first row. */
  children:    ReactNode
  /** Optional trailing slot in the pill row — typically a column manager button. */
  trailing?:   ReactNode
  /** Whether any filter is active. Controls the summary line below. */
  active?:     boolean
  /** Result count to display. If omitted, the summary just shows the Clear action. */
  count?:      number
  /** Label for the count (e.g. "Results"). Defaults to "Results". */
  countLabel?: string
  /** Click handler for "Clear Filter". Required when active. */
  onClear?:    () => void
  /** Override clear-action label. */
  clearLabel?: string
  className?:  string
}

/**
 * Standard container for a filter row + summary line.
 *
 *   ┌──────────────────────────────────────────────────────┐
 *   │ [pill] [pill] [pill]                  [ColumnManage] │  ← children + trailing
 *   ├──────────────────────────────────────────────────────┤
 *   │ 42 Results · Clear Filter                            │  ← shown when active
 *   └──────────────────────────────────────────────────────┘
 *
 * Usage:
 *   <CdsFilterPanel
 *     active={hasFilters}
 *     count={total}
 *     onClear={handleReset}
 *     trailing={<ColumnManageButton ... />}
 *   >
 *     <CdsFilterPill ... />
 *     <CdsFilterPill ... />
 *   </CdsFilterPanel>
 */
export function CdsFilterPanel({
  children,
  trailing,
  active = false,
  count,
  countLabel = 'Results',
  onClear,
  clearLabel = 'Clear Filter',
  className = '',
}: CdsFilterPanelProps) {
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        {trailing && <div className="ml-auto">{trailing}</div>}
      </div>
      {active && (
        <div className="flex items-center gap-2">
          {typeof count === 'number' && (
            <span className="type-body text-(--text)">{count} {countLabel}</span>
          )}
          {onClear && (
            <button
              type="button"
              className="type-body font-bold text-(--accent) hover:underline cursor-pointer"
              onClick={onClear}
            >
              {clearLabel}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
