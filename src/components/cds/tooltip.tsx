import React, { useState, useRef, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export interface CdsTooltipProps {
  content: ReactNode
  children: ReactNode
  position?: 'top' | 'bottom'
  className?: string
  wide?: boolean
}

export function CdsTooltip({ content, children, position = 'top', className = '', wide = false }: CdsTooltipProps) {
  const [show, setShow] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number; arrowLeft: number } | null>(null)
  const triggerRef = useRef<HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!show) { setCoords(null); return }
    requestAnimationFrame(() => {
      if (!triggerRef.current || !tooltipRef.current) return
      const tr = triggerRef.current.getBoundingClientRect()
      const tip = tooltipRef.current.getBoundingClientRect()
      const pad = 8

      const centerX = tr.left + tr.width / 2
      let left = centerX - tip.width / 2
      if (left < pad) left = pad
      if (left + tip.width > window.innerWidth - pad) left = window.innerWidth - pad - tip.width

      const arrowLeft = Math.min(Math.max(centerX - left, 12), tip.width - 12)

      const top = position === 'top'
        ? tr.top - tip.height - 8
        : tr.bottom + 8

      setCoords({ top, left, arrowLeft })
    })
  }, [show, position])

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className={`inline-flex ${className}`}
      >
        {children}
      </span>
      {show && createPortal(
        <div
          ref={tooltipRef}
          className="fixed z-9999 pointer-events-none"
          style={coords ? { top: coords.top, left: coords.left } : { top: -9999, left: -9999 }}
        >
          <div className={`relative px-3 py-2 rounded-lg bg-(--text) text-white type-body-sm shadow-(--shadow-lg) ${wide ? 'w-72' : 'max-w-xs'}`}>
            {content}
            {coords && (
              <span
                className={`absolute h-2.5 w-2.5 rotate-45 bg-(--text) ${position === 'top' ? '-bottom-1' : '-top-1'}`}
                style={{ left: coords.arrowLeft, marginLeft: -5 }}
              />
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
