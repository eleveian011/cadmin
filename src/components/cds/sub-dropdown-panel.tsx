import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronRight } from 'lucide-react'
import { CdsMenuItem } from './menu-item'

export interface SubDropdownPanelItem {
  value:     string
  label:     string
  subLabel?: string
}

export interface CdsSubDropdownPanelProps {
  label:       string
  items?:      SubDropdownPanelItem[]
  value?:      string
  onChange?:   (value: string) => void
  panelTitle?: string
  className?:  string
}

export function CdsSubDropdownPanel({
  label,
  items = [],
  value,
  onChange,
  panelTitle,
  className = '',
}: CdsSubDropdownPanelProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const panelRef   = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 })

  const openPanel = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    const rect = triggerRef.current!.getBoundingClientRect()
    setPanelPos({ top: rect.top, left: rect.right + 4 })
    setOpen(true)
  }

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 150)
  }

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }

  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current) }, [])

  useEffect(() => {
    if (!open || !panelRef.current) return
    const panel = panelRef.current
    const stop = (e: MouseEvent) => e.stopPropagation()
    panel.addEventListener('mousedown', stop)
    return () => panel.removeEventListener('mousedown', stop)
  }, [open])

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node) && !triggerRef.current?.contains(e.target as Node))
        setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open])

  return (
    <div
      ref={triggerRef}
      className={className}
      onMouseEnter={openPanel}
      onMouseLeave={scheduleClose}
    >
      <CdsMenuItem trailing={<ChevronRight size={13} className="shrink-0 text-(--subtle)" />}>
        {label}
      </CdsMenuItem>

      {open && createPortal(
        <div
          ref={panelRef}
          className="fixed z-1300 w-56 overflow-hidden rounded-lg border border-(--border) bg-(--surface) p-1 shadow-(--shadow-overlay)"
          style={{ top: panelPos.top, left: panelPos.left }}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          {panelTitle && (
            <CdsMenuItem variant="header">{panelTitle}</CdsMenuItem>
          )}
          {items.map((item) => (
            <CdsMenuItem
              key={item.value}
              selected={item.value === value}
              onClick={() => { onChange?.(item.value); setOpen(false) }}
              trailing={<>
                {item.subLabel && (
                  <span className="type-caption shrink-0 text-(--subtle)">{item.subLabel}</span>
                )}
                {item.value === value && (
                  <Check size={13} className="shrink-0 text-(--accent-text)" />
                )}
              </>}
            >
              {item.label}
            </CdsMenuItem>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}
