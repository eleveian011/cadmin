import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { CdsModal } from './modal'

export type CdsDateRangePickerSize = 'sm' | 'md' | 'lg'

export interface CdsDateRangeValue {
  from: string | null
  to:   string | null
}

export interface CdsDateRangePickerProps {
  value:       CdsDateRangeValue
  onChange:    (value: CdsDateRangeValue) => void
  size?:       CdsDateRangePickerSize
  className?:  string
  disabled?:   boolean
  maxDays?:    number
}

const sizes: Record<CdsDateRangePickerSize, string> = {
  sm: 'h-8 px-2.5 type-body-sm',
  md: 'h-9 px-3 type-body',
  lg: 'h-10 px-3 type-body',
}

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function today(): string { return formatDate(new Date()) }

function addDays(date: string, days: number): string {
  const d = new Date(date + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return formatDate(d)
}

function startOfWeek(): string {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay())
  return formatDate(d)
}

function startOfMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

// PRESETS are built inside CdsDateRangePicker using t() so labels are reactive

function MonthPanel({ year, month, value, onSelect, onPrev, onNext, onPrevYear, onNextYear, showNav, className = 'w-56', isDateDisabled }: {
  year: number; month: number; value: CdsDateRangeValue;
  onSelect: (dateStr: string) => void; onPrev?: () => void; onNext?: () => void; onPrevYear?: () => void; onNextYear?: () => void; showNav: 'left' | 'right' | 'both'; className?: string; isDateDisabled?: (dateStr: string) => boolean
}) {
  const days = DAY_LABELS
  const daysInMonth = getDaysInMonth(year, month)
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const monthLabel = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const isInRange = (day: number): boolean => {
    if (!value.from || !value.to) return false
    const d = formatDate(new Date(year, month, day))
    return d > value.from && d < value.to
  }
  const isSelected = (day: number): boolean => {
    const d = formatDate(new Date(year, month, day))
    return d === value.from || d === value.to
  }
  const isRangeStart = (day: number) => formatDate(new Date(year, month, day)) === value.from
  const isRangeEnd = (day: number) => formatDate(new Date(year, month, day)) === value.to

  return (
    <div className={`${className} p-2`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-0.5">
          {(showNav === 'left' || showNav === 'both') && onPrevYear && (
            <button type="button" className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-(--muted) hover:bg-(--item-hover)" onClick={onPrevYear}>
              <ChevronLeft size={10} /><ChevronLeft size={10} className="-ml-1.5" />
            </button>
          )}
          {(showNav === 'left' || showNav === 'both') ? (
            <button type="button" className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-(--muted) hover:bg-(--item-hover)" onClick={onPrev}>
              <ChevronLeft size={14} />
            </button>
          ) : <span className="w-6" />}
        </div>
        <span className="type-body-sm font-semibold text-(--text)">{monthLabel}</span>
        <div className="flex items-center gap-0.5">
          {(showNav === 'right' || showNav === 'both') ? (
            <button type="button" className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-(--muted) hover:bg-(--item-hover)" onClick={onNext}>
              <ChevronRight size={14} />
            </button>
          ) : <span className="w-6" />}
          {(showNav === 'right' || showNav === 'both') && onNextYear && (
            <button type="button" className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-(--muted) hover:bg-(--item-hover)" onClick={onNextYear}>
              <ChevronRight size={10} /><ChevronRight size={10} className="-ml-1.5" />
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-7">
        {days.map((d, i) => <div key={i} className="flex h-6 items-center justify-center type-caption text-(--muted)">{d}</div>)}
        {Array.from({ length: firstDayOfWeek }, (_, i) => <div key={`e${i}`} className="h-6" />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          const dateStr = formatDate(new Date(year, month, day))
          const disabled = isDateDisabled?.(dateStr) ?? false
          const selected = isSelected(day)
          const inRange = isInRange(day)
          const start = isRangeStart(day)
          const end = isRangeEnd(day)
          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              className={`flex h-6 w-full items-center justify-center type-caption transition-colors ${
                disabled ? 'text-(--border) cursor-not-allowed' :
                selected ? 'bg-(--accent) text-white font-bold rounded cursor-pointer' :
                inRange ? 'bg-(--accent-subtle) text-(--accent) cursor-pointer' :
                'text-(--text) hover:bg-(--item-hover) rounded cursor-pointer'
              } ${start ? 'rounded-l' : ''} ${end ? 'rounded-r' : ''}`}
              onClick={() => !disabled && onSelect(dateStr)}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function DateInput({ value, onChange, placeholder }: { value: string | null; onChange: (v: string) => void; placeholder: string }) {
  const parts = value ? value.split('-') : ['', '', '']
  const update = (idx: number, v: string) => {
    const p = [...parts]
    p[idx] = v
    onChange(p.join('-'))
  }
  return (
    <div className="flex items-center gap-0.5">
      <input value={parts[0]} onChange={e => update(0, e.target.value)} placeholder="YYYY" className="w-10 bg-transparent type-caption text-(--text) text-center outline-none placeholder:text-(--subtle)" maxLength={4} />
      <span className="type-caption text-(--muted)">-</span>
      <input value={parts[1]} onChange={e => update(1, e.target.value)} placeholder="MM" className="w-6 bg-transparent type-caption text-(--text) text-center outline-none placeholder:text-(--subtle)" maxLength={2} />
      <span className="type-caption text-(--muted)">-</span>
      <input value={parts[2]} onChange={e => update(2, e.target.value)} placeholder="DD" className="w-6 bg-transparent type-caption text-(--text) text-center outline-none placeholder:text-(--subtle)" maxLength={2} />
    </div>
  )
}

export function CdsDateRangePicker({
  value,
  onChange,
  size = 'md',
  className = '',
  disabled = false,
  maxDays,
}: CdsDateRangePickerProps) {
  const PRESETS = [
    { label: 'This week',   fn: () => ({ from: startOfWeek(), to: today() }) },
    { label: 'This month',  fn: () => ({ from: startOfMonth(), to: today() }) },
    { label: 'Last 7 days', fn: () => ({ from: addDays(today(), -6), to: today() }) },
    { label: 'Last 30 days', fn: () => ({ from: addDays(today(), -29), to: today() }) },
  ]

  const isDateDisabled = (dateStr: string): boolean => {
    if (!maxDays || !value.from || value.to) return false
    const minDate = addDays(value.from, -(maxDays - 1))
    const maxDate = addDays(value.from, maxDays - 1)
    return dateStr < minDate || dateStr > maxDate
  }
  const [open, setOpen] = useState(false)
  const [selecting, setSelecting] = useState<'from' | 'to'>('from')
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 })
  const ref = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const PANEL_WIDTH = 480

  const computePosition = () => {
    if (!ref.current) return { top: 0, left: 0 }
    const rect = ref.current.getBoundingClientRect()
    const vw = window.innerWidth
    let left = rect.left
    if (rect.left + PANEL_WIDTH > vw) left = rect.right - PANEL_WIDTH
    if (left < 0) left = (vw - PANEL_WIDTH) / 2
    return { top: rect.bottom + 4, left }
  }

  const handleOpen = () => {
    if (disabled) return
    setPanelPos(computePosition())
    setOpen(o => !o)
  }

  const now = new Date()
  const [leftYear, setLeftYear] = useState(now.getFullYear())
  const [leftMonth, setLeftMonth] = useState(now.getMonth() - 1 < 0 ? 11 : now.getMonth() - 1)
  const rightYear = leftMonth === 11 ? leftYear + 1 : leftYear
  const rightMonth = (leftMonth + 1) % 12

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (
        e.target instanceof Node &&
        !ref.current?.contains(e.target) &&
        !panelRef.current?.contains(e.target)
      ) {
        e.preventDefault()
        e.stopPropagation()
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', h, true)
    return () => document.removeEventListener('pointerdown', h, true)
  }, [open])

  const handleSelect = (dateStr: string) => {
    if (selecting === 'from') {
      onChange({ from: dateStr, to: null })
      setSelecting('to')
    } else {
      if (value.from && dateStr < value.from) {
        onChange({ from: dateStr, to: value.from })
      } else {
        onChange({ ...value, to: dateStr })
      }
      setSelecting('from')
    }
  }

  const prevMonth = () => {
    if (leftMonth === 0) { setLeftYear(y => y - 1); setLeftMonth(11) }
    else setLeftMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (leftMonth === 11) { setLeftYear(y => y + 1); setLeftMonth(0) }
    else setLeftMonth(m => m + 1)
  }
  const prevYear = () => setLeftYear(y => y - 1)
  const nextYear = () => setLeftYear(y => y + 1)


  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className={`flex w-full items-center gap-2 rounded-md border border-(--border) bg-(--surface) transition cursor-pointer hover:bg-(--item-hover) focus:border-(--accent) ${sizes[size]} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <Calendar size={14} className="shrink-0 text-(--subtle)" />
        <span className={`flex-1 text-left truncate ${value.from || value.to ? 'text-(--text)' : 'text-(--subtle)'}`}>
          {value.from || value.to ? `${value.from ?? '…'} → ${value.to ?? '…'}` : 'Select date range'}
        </span>
      </button>

      {/* Desktop Dropdown */}
      {open && createPortal(
        <div ref={panelRef} className="hidden md:block fixed z-9999 rounded-lg border border-(--border) bg-(--surface) shadow-(--shadow-overlay)" style={{ top: panelPos.top, left: panelPos.left }}>
          {/* Date inputs */}
          <div className="flex items-center justify-center gap-2 border-b border-(--border) px-3 py-2.5">
            <div className="flex-1 flex justify-end">
              <DateInput value={value.from} onChange={(v) => onChange({ ...value, from: v })} placeholder="Start" />
            </div>
            <span className="type-caption text-(--muted)">→</span>
            <div className="flex-1">
              <DateInput value={value.to} onChange={(v) => onChange({ ...value, to: v })} placeholder="End" />
            </div>
          </div>
          {/* Dual calendar */}
          <div className="flex">
            <MonthPanel year={leftYear} month={leftMonth} value={value} onSelect={handleSelect} onPrev={prevMonth} onPrevYear={prevYear} showNav="left" isDateDisabled={isDateDisabled} />
            <div className="w-px bg-(--border)" />
            <MonthPanel year={rightYear} month={rightMonth} value={value} onSelect={handleSelect} onNext={nextMonth} onNextYear={nextYear} showNav="right" isDateDisabled={isDateDisabled} />
          </div>
          {/* Presets */}
          <div className="flex flex-wrap gap-1 border-t border-(--border) px-3 py-2">
            {PRESETS.map(p => (
              <button
                key={p.label}
                type="button"
                className="rounded-full border border-(--border) px-2.5 py-0.5 type-caption text-(--muted) cursor-pointer hover:bg-(--item-hover) hover:text-(--text) transition-colors"
                onClick={() => { onChange(p.fn()); setSelecting('from') }}
              >
                {p.label}
              </button>
            ))}
          </div>
          {/* Footer */}
          <div className="flex items-center justify-between border-t border-(--border) px-3 py-2">
            <span className="type-caption text-(--muted)">
              {selecting === 'from' ? 'Select start date' : 'Select end date'}
            </span>
            <div className="flex items-center gap-3">
              {(value.from || value.to) && (
                <button type="button" className="type-caption text-(--muted) cursor-pointer hover:text-(--text) transition-colors" onClick={() => { onChange({ from: null, to: null }); setSelecting('from') }}>Clear</button>
              )}
              <button type="button" className="type-caption font-semibold text-(--accent) cursor-pointer hover:underline" onClick={() => setOpen(false)}>Done</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Mobile Modal */}
      <div className="md:hidden">
        <CdsModal
          open={open}
          onClose={() => setOpen(false)}
        size="sm"
        headerMode="close"
        title="Select date range"
        className="md:hidden"
        footer={[
          { label: 'Done', onClick: () => setOpen(false) },
          ...((value.from || value.to) ? [{ label: 'Clear', onClick: () => { onChange({ from: null, to: null }); setSelecting('from') }, variant: 'text' as const }] : []),
        ]}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-center gap-2">
            <div className="flex-1 flex justify-end">
              <DateInput value={value.from} onChange={(v) => onChange({ ...value, from: v })} placeholder="Start" />
            </div>
            <span className="type-caption text-(--muted)">→</span>
            <div className="flex-1">
              <DateInput value={value.to} onChange={(v) => onChange({ ...value, to: v })} placeholder="End" />
            </div>
          </div>
          <MonthPanel year={leftYear} month={leftMonth} value={value} onSelect={handleSelect} onPrev={prevMonth} onNext={nextMonth} onPrevYear={prevYear} onNextYear={nextYear} showNav="both" className="w-full" isDateDisabled={isDateDisabled} />
          <div className="flex flex-wrap gap-1">
            {PRESETS.map(p => (
              <button key={p.label} type="button" className="rounded-full border border-(--border) px-2.5 py-0.5 type-caption text-(--muted) cursor-pointer hover:bg-(--item-hover) hover:text-(--text) transition-colors" onClick={() => { onChange(p.fn()); setSelecting('from') }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </CdsModal>
      </div>
    </div>
  )
}
