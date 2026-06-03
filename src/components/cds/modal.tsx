import React from 'react'
import { X, ChevronLeft } from 'lucide-react'
import { CdsButton } from './button'

export type CdsModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

export type CdsModalHeaderMode = 'none' | 'close' | 'back-close'

export interface CdsModalFooterAction {
  label:     string
  onClick:   () => void
  variant?:  'primary' | 'secondary' | 'ghost' | 'text'
  loading?:  boolean
  disabled?: boolean
  icon?:     React.ReactNode
  iconPosition?: 'left' | 'right'
}

export interface CdsModalProps {
  open:         boolean
  onClose:      () => void
  onBack?:      () => void
  size?:        CdsModalSize
  headerMode?:  CdsModalHeaderMode
  title?:       string
  header?:      React.ReactNode
  footer?:      CdsModalFooterAction[]
  footerLink?:  { label: React.ReactNode; onClick: () => void }
  children:     React.ReactNode
  className?:   string
  bodyClassName?: string
  dismissOnBackdrop?: boolean
}

const SIZE_CLASSES: Record<CdsModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  '2xl': 'max-w-230',
}

export function CdsModal({
  open,
  onClose,
  onBack,
  size = 'md',
  headerMode = 'close',
  title,
  header,
  footer,
  footerLink,
  children,
  className = '',
  bodyClassName,
  dismissOnBackdrop = false,
}: CdsModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-1200">
      <div className="fixed inset-0 bg-(--overlay-backdrop)" />
      <div className="fixed inset-0 flex items-center justify-center p-4 md:items-center" onClick={dismissOnBackdrop ? onClose : undefined}>
        <div className={`relative flex w-full flex-col rounded-xl border border-(--border) bg-(--surface) shadow-(--shadow-overlay) ${SIZE_CLASSES[size]} max-h-[80vh] min-h-48 md:rounded-xl max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:mx-0 max-md:w-full max-md:max-w-none max-md:rounded-b-none max-md:rounded-t-xl max-md:max-h-[85vh] ${className}`} onClick={dismissOnBackdrop ? (e) => e.stopPropagation() : undefined}>
          {/* Header */}
          {headerMode !== 'none' && (
            <div className="flex shrink-0 items-center gap-2 px-5 py-3">
              {headerMode === 'back-close' && onBack && (
                <button type="button" className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-(--muted) hover:bg-(--item-hover) transition-colors" onClick={onBack}>
                  <ChevronLeft size={18} />
                </button>
              )}
              {header
                ? <div className="flex-1 min-w-0">{header}</div>
                : title && <span className="flex-1 type-body font-semibold text-(--text)">{title}</span>}
              <button type="button" className="ml-auto flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-(--muted) hover:bg-(--item-hover) transition-colors" onClick={onClose}>
                <X size={16} />
              </button>
            </div>
          )}

          {/* Body */}
          <div className={bodyClassName ? `flex-1 min-h-0 ${bodyClassName}` : 'flex-1 min-h-0 overflow-y-auto px-5 py-4'}>
            {children}
          </div>

          {/* Footer */}
          {(footer || footerLink) && (
            <div className="shrink-0 px-5 py-3 flex flex-col gap-3">
              {footer && (
                /* Two footer shapes only:
                   (a) [cta]            → single full-width primary CTA
                   (b) [cta, subAction] → primary CTA on top + centered text-link sub-action(s) below.
                   action[0] is the primary CTA (full-width CdsButton, respects its own
                   variant/loading/disabled/icon); action[1+] render as centered text links
                   (same treatment as footerLink). */
                <div className="flex flex-col gap-3">
                  {footer.map((action, i) =>
                    i === 0 ? (
                      <CdsButton
                        key={i}
                        variant={action.variant ?? 'primary'}
                        size="md"
                        width="full"
                        onClick={action.onClick}
                        loading={action.loading}
                        disabled={action.disabled}
                        icon={action.icon}
                        iconPosition={action.iconPosition}
                      >
                        {action.label}
                      </CdsButton>
                    ) : action.disabled || action.loading ? (
                      <span
                        key={i}
                        className="type-body font-bold text-(--accent) opacity-50 cursor-not-allowed text-center inline-flex items-center justify-center gap-1 mx-auto"
                      >
                        {action.label}
                      </span>
                    ) : (
                      <button
                        key={i}
                        type="button"
                        className="type-body font-bold text-(--accent) cursor-pointer hover:text-(--accent-hover) transition-colors text-center inline-flex items-center justify-center gap-1 mx-auto"
                        onClick={action.onClick}
                      >
                        {action.label}
                      </button>
                    )
                  )}
                </div>
              )}
              {footerLink && (
                <button type="button" className="type-body-sm text-(--muted) cursor-pointer hover:text-(--text) transition-colors text-center inline-flex items-center justify-center gap-1 mx-auto" onClick={footerLink.onClick}>
                  {footerLink.label}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
