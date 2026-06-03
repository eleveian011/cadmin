import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export interface CdsDrawerLeftProps {
  open: boolean
  onClose: () => void
  title?: React.ReactNode
  footer?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function CdsDrawerLeft({ open, onClose, title, footer, children, className = '' }: CdsDrawerLeftProps) {
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-1200">
      <div className="fixed inset-0 bg-(--overlay-backdrop) animate-[fadeIn_0.18s_ease]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={`fixed top-0 left-0 bottom-0 flex w-100 max-w-[85vw] flex-col bg-(--surface) shadow-(--shadow-overlay) animate-[drawerSlideInLeft_0.24s_cubic-bezier(0.4,0,0.2,1)] ${className}`}
      >
        <div className="flex shrink-0 items-center gap-2 px-5 py-3">
          {title && <span className="flex-1 type-body font-semibold text-(--text)">{title}</span>}
          <button
            type="button"
            className="ml-auto flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-(--muted) hover:bg-(--item-hover) transition-colors"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>
        {footer && (
          <div className="shrink-0 border-t border-(--border) px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
