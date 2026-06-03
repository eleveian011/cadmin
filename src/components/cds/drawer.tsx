import React, { useEffect } from 'react'
import { X, ChevronLeft } from 'lucide-react'

export interface CdsDrawerTab {
  value: string
  label: string
}

export interface CdsDrawerProps {
  open: boolean
  onClose: () => void
  title?: React.ReactNode
  headerMode?: 'close' | 'back-close'
  onBack?: () => void
  tabs?: CdsDrawerTab[]
  activeTab?: string
  onTabChange?: (value: string) => void
  footer?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function CdsDrawer({
  open,
  onClose,
  title,
  headerMode = 'close',
  onBack,
  tabs,
  activeTab,
  onTabChange,
  footer,
  children,
  className = '',
}: CdsDrawerProps) {
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

  return (
    <div className="fixed inset-0 z-1200">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-(--overlay-backdrop) animate-[fadeIn_0.18s_ease]"
        onClick={onClose}
      />

      {/* Drawer panel — desktop: right slide-in, mobile: bottom sheet */}
      <div
        role="dialog"
        aria-modal="true"
        className={`fixed top-0 right-0 bottom-0 flex w-120 flex-col bg-(--surface) shadow-(--shadow-overlay) animate-[drawerSlideIn_0.24s_cubic-bezier(0.4,0,0.2,1)] max-md:inset-x-0 max-md:top-auto max-md:bottom-0 max-md:w-full max-md:max-h-[90vh] max-md:rounded-t-xl max-md:animate-[modalIn_0.22s_cubic-bezier(0.4,0,0.2,1)] ${className}`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center gap-2 px-5 py-3">
          {headerMode === 'back-close' && onBack && (
            <button
              type="button"
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-(--muted) hover:bg-(--item-hover) transition-colors"
              onClick={onBack}
            >
              <ChevronLeft size={18} />
            </button>
          )}
          {tabs && tabs.length > 0 ? (
            <div className="inline-flex flex-nowrap gap-1">
              {tabs.map(tab => {
                const active = activeTab === tab.value
                return (
                  <button
                    key={tab.value}
                    type="button"
                    className={[
                      'inline-flex items-center rounded-full border px-3 py-1 type-body transition-colors cursor-pointer whitespace-nowrap',
                      active
                        ? 'bg-(--accent-subtle) text-(--accent) border-(--accent-subtle) font-semibold'
                        : 'bg-transparent text-(--muted) border-transparent font-medium hover:bg-(--item-hover) hover:text-(--text) hover:border-(--border)',
                    ].join(' ')}
                    onClick={() => onTabChange?.(tab.value)}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>
          ) : (
            title && <span className="flex-1 type-body font-semibold text-(--text)">{title}</span>
          )}
          <button
            type="button"
            className="ml-auto flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-(--muted) hover:bg-(--item-hover) transition-colors"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="shrink-0 px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
