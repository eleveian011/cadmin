import React, { useState, useMemo, useEffect } from 'react'
import { ChevronRight } from 'lucide-react'
import { CdsCheckbox } from './checkbox'

/* ─── Types ────────────────────────────────────────────────── */

export interface CdsTableColumn<T = unknown> {
  key:      string
  header:   string
  width?:   string
  frozen?:  'left' | 'right'
  hidden?:  boolean
  align?:   'left' | 'center' | 'right'
  render?:  (value: unknown, row: T, index: number) => React.ReactNode
}

export interface CdsTableProps<T = unknown> {
  columns:            CdsTableColumn<T>[]
  data:               T[]
  rowKey:             string | ((row: T, index: number) => string)

  selectable?:        boolean
  selectedKeys?:      Set<string>
  onSelectionChange?: (keys: Set<string>) => void

  getChildren?:       (row: T) => T[]
  isExpandable?:      (row: T) => boolean
  expandedKeys?:      Set<string>
  onExpandChange?:    (keys: Set<string>) => void
  defaultExpandAll?:  boolean
  indentWidth?:       number
  /** Hide the expand affordance on leaf rows (no children). Keeps alignment via
   *  an invisible spacer. Use when the tree depth is fixed (e.g. 2 levels) and a
   *  faded chevron on leaves would be noise. */
  hideLeafExpander?:  boolean
  renderAfterChildren?: (row: T, key: string) => React.ReactNode

  hover?:             boolean
  striped?:           boolean
  compact?:           boolean
  stickyHeader?:      boolean
  /** Table column-sizing strategy:
   *  - 'auto' (default): content-driven width (`w-max`), header text never wraps,
   *    overflows into horizontal scroll. Right for wide data grids.
   *  - 'fixed': `table-fixed w-full`, columns honour their `width`, cell content
   *    wraps instead of scrolling. Right for reference/label-value tables. */
  layout?:            'auto' | 'fixed'
  className?:         string

  columnOrder?:       string[]
  onColumnReorder?:   (newOrder: string[]) => void

  onRowClick?:        (row: T, index: number) => void
  emptyText?:         string
}

/* ─── Helpers ──────────────────────────────────────────────── */

function getRowKey<T>(row: T, index: number, rowKey: string | ((row: T, index: number) => string)): string {
  return typeof rowKey === 'function' ? rowKey(row, index) : String((row as Record<string, unknown>)[rowKey] ?? index)
}

function getCellValue<T>(row: T, key: string): unknown {
  return (row as Record<string, unknown>)[key]
}

const ALIGN_MAP = { left: 'text-left', center: 'text-center', right: 'text-right' }

/* ─── Component ────────────────────────────────────────────── */

export function CdsTable<T>({
  columns,
  data,
  rowKey,
  selectable = false,
  selectedKeys,
  onSelectionChange,
  getChildren,
  isExpandable,
  expandedKeys: controlledExpanded,
  onExpandChange,
  defaultExpandAll = false,
  indentWidth = 24,
  hideLeafExpander = false,
  renderAfterChildren,
  hover = true,
  striped = false,
  compact = false,
  stickyHeader = true,
  layout = 'auto',
  className = '',
  columnOrder,
  onColumnReorder,
  onRowClick,
  emptyText = 'No data',
}: CdsTableProps<T>) {
  const [internalExpanded, setInternalExpanded] = useState<Set<string>>(() => {
    if (defaultExpandAll) {
      const keys = new Set<string>()
      data.forEach((row, i) => {
        if (getChildren?.(row)?.length) keys.add(getRowKey(row, i, rowKey))
      })
      return keys
    }
    return new Set()
  })
  const expandedSet = controlledExpanded ?? internalExpanded
  const setExpanded = onExpandChange ?? setInternalExpanded

  const toggleExpand = (key: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = new Set(expandedSet)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setExpanded(next)
  }
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(() => {
    return new Set(columns.filter(c => c.hidden).map(c => c.key))
  })

  // Sync hiddenKeys when columns.hidden changes externally
  useEffect(() => {
    setHiddenKeys(new Set(columns.filter(c => c.hidden).map(c => c.key)))
  }, [columns])


  const visibleColumns = useMemo(
    () => {
      const filtered = columns.filter(c => !hiddenKeys.has(c.key))
      if (!columnOrder) return filtered
      const orderMap = new Map(columnOrder.map((key, idx) => [key, idx]))
      return [...filtered].sort((a, b) => {
        const ai = orderMap.get(a.key) ?? Infinity
        const bi = orderMap.get(b.key) ?? Infinity
        return ai - bi
      })
    },
    [columns, hiddenKeys, columnOrder],
  )

  const frozenLeft  = visibleColumns.filter(c => c.frozen === 'left')
  const frozenRight = visibleColumns.filter(c => c.frozen === 'right')
  const scrollable  = visibleColumns.filter(c => !c.frozen)
  const orderedColumns = [...frozenLeft, ...scrollable, ...frozenRight]

  const allKeys = useMemo(() => data.map((row, i) => getRowKey(row, i, rowKey)), [data, rowKey])
  const allSelected = selectable && selectedKeys && allKeys.length > 0 && allKeys.every(k => selectedKeys.has(k))
  const someSelected = selectable && selectedKeys && allKeys.some(k => selectedKeys.has(k)) && !allSelected

  const toggleAll = () => {
    if (!onSelectionChange) return
    if (allSelected) onSelectionChange(new Set())
    else onSelectionChange(new Set(allKeys))
  }

  const toggleRow = (key: string) => {
    if (!onSelectionChange || !selectedKeys) return
    const next = new Set(selectedKeys)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onSelectionChange(next)
  }

  const cellPy = compact ? 'py-1.5' : 'py-2.5'
  const headerPy = compact ? 'py-1.5' : 'py-2'

  /* ─── Shadow indicators for frozen edges ────────────────── */

  const lastFrozenLeftKey = frozenLeft.length > 0 ? frozenLeft[frozenLeft.length - 1].key : null
  const firstFrozenRightKey = frozenRight.length > 0 ? frozenRight[0].key : null

  const checkboxWidth = selectable ? 40 : 0

  function frozenCls(col: CdsTableColumn<T>): string {
    if (!col.frozen) return ''
    const sticky = 'sticky z-10'
    if (col.frozen === 'left') {
      const idx = frozenLeft.indexOf(col)
      const offset = checkboxWidth + frozenLeft.slice(0, idx).reduce((sum, c) => sum + (parseInt(c.width || '0') || 0), 0)
      return `${sticky} ${offset === 0 ? 'left-0' : ''} shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]`
    }
    return `${sticky} right-0 shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.06)]`
  }

  function frozenStyle(col: CdsTableColumn<T>): React.CSSProperties | undefined {
    if (col.frozen === 'left') {
      const idx = frozenLeft.indexOf(col)
      const offset = checkboxWidth + frozenLeft.slice(0, idx).reduce((sum, c) => sum + (parseInt(c.width || '0') || 0), 0)
      return { left: offset }
    }
    return undefined
  }

  function bodyCls(col: CdsTableColumn<T>): string {
    if (col.frozen) return 'bg-(--surface) group-hover:bg-(--fill-hover)'
    return ''
  }

  /* ─── Render ────────────────────────────────────────────── */

  const totalCols = orderedColumns.length + (selectable ? 1 : 0)

  return (
    <div className={`min-w-0 ${className}`}>
      <div className="overflow-hidden border-y border-(--border) max-w-full">
        <div className={layout === 'fixed' ? '' : 'overflow-x-auto scrollbar-hide'}>
          <table className={`border-separate border-spacing-0 type-body [&_tbody>tr:last-child>td]:border-b-0 ${layout === 'fixed' ? 'table-fixed w-full' : 'w-max min-w-full'}`}>
            <thead>
              <tr>
                {selectable && (
                  <th className={`w-10 ${headerPy} px-3 text-center border-b border-(--border) ${frozenLeft.length > 0 ? 'sticky left-0 z-10 bg-(--bg)' : ''}`}>
                    <CdsCheckbox checked={!!allSelected} indeterminate={!!someSelected} onChange={toggleAll} />
                  </th>
                )}
                {orderedColumns.map(col => (
                    <th
                      key={col.key}
                      className={`${headerPy} px-3 type-caption font-semibold uppercase text-(--subtle) whitespace-nowrap border-b border-(--border) ${ALIGN_MAP[col.align ?? 'left']} ${frozenCls(col)} ${col.frozen ? 'bg-(--bg)' : ''}`}
                      style={{ width: col.width, minWidth: col.width, ...frozenStyle(col) }}
                    >
                      {col.header || ' '}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr>
                  <td colSpan={totalCols} className="px-3 py-8 text-center type-body-sm text-(--muted)">
                    {emptyText}
                  </td>
                </tr>
              )}
              {renderRows(data, 0)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  function renderRows(rows: T[], depth: number, isLastGroup = true): React.ReactNode[] {
    const result: React.ReactNode[] = []
    rows.forEach((row, rowIdx) => {
      const key = getRowKey(row, rowIdx, rowKey)
      const children = getChildren?.(row) ?? []
      const hasChildren = isExpandable ? isExpandable(row) : children.length > 0
      const isExpanded = expandedSet.has(key)
      const isSelected = selectable && selectedKeys?.has(key)
      const rowCls = [
        'group relative',
        hover ? 'hover:bg-(--fill-hover)' : '',
        striped && rowIdx % 2 === 1 ? 'bg-(--fill)/50' : '',
        isSelected ? 'bg-(--accent-subtle)' : '',
        hasChildren ? 'cursor-pointer' : onRowClick ? 'cursor-pointer' : '',
      ].join(' ')
      const borderCls = 'border-b border-(--border)'

      const handleRowClick = () => {
        if (hasChildren) {
          const next = new Set(expandedSet)
          if (next.has(key)) next.delete(key)
          else next.add(key)
          setExpanded(next)
        } else {
          onRowClick?.(row, rowIdx)
        }
      }

      result.push(
        <tr key={key} className={rowCls} onClick={handleRowClick}>
          {selectable && (
            <td className={`w-10 ${cellPy} px-3 text-center ${borderCls} ${isSelected ? 'bg-(--accent-subtle)' : ''} ${frozenLeft.length > 0 ? 'sticky left-0 z-10 bg-(--surface) group-hover:bg-(--fill-hover)' : ''}`}>
              <CdsCheckbox checked={!!isSelected} onChange={() => toggleRow(key)} />
            </td>
          )}
          {orderedColumns.map((col, colIdx) => {
            const value = getCellValue(row, col.key)
            const isFirstCol = colIdx === 0
            return (
              <td
                key={col.key}
                className={`${cellPy} px-3 ${ALIGN_MAP[col.align ?? 'left']} ${borderCls} ${bodyCls(col)} ${frozenCls(col)} ${isSelected && col.frozen ? 'bg-(--accent-subtle)' : ''}`}
                style={frozenStyle(col)}
              >
                {isFirstCol && getChildren ? (
                  <div className="flex items-center gap-1.5">
                    {hideLeafExpander && !hasChildren ? (
                      <span className="h-5 w-5 shrink-0" aria-hidden />
                    ) : (
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${hasChildren ? '' : 'opacity-30'}`}>
                        <ChevronRight size={14} className={`text-(--muted) transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </span>
                    )}
                    <span style={{ paddingLeft: depth > 0 ? `${depth * indentWidth}px` : undefined, paddingRight: depth === 0 ? `${indentWidth}px` : undefined }} className="flex items-center gap-1.5">
                      {col.render ? col.render(value, row, rowIdx) : String(value ?? '')}
                    </span>
                  </div>
                ) : (
                  col.render ? col.render(value, row, rowIdx) : String(value ?? '')
                )}
              </td>
            )
          })}
        </tr>
      )

      if (hasChildren && isExpanded) {
        const isLastParent = isLastGroup && rowIdx === rows.length - 1
        result.push(...renderRows(children, depth + 1, isLastParent))
        if (renderAfterChildren) {
          const afterNode = renderAfterChildren(row, key)
          if (afterNode) {
            result.push(
              <tr key={`${key}__after`}>
                <td colSpan={totalCols} className={`${cellPy} px-3 border-b border-(--border)`}>
                  <div className="sticky left-0 w-[calc(100vw-3rem)] md:w-auto">
                    {afterNode}
                  </div>
                </td>
              </tr>
            )
          }
        }
      }
    })
    return result
  }
}
