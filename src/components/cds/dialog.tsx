import React from 'react'
import { CdsButton } from './button'

export type CdsDialogTone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral'

export interface CdsDialogProps {
  open:            boolean
  onClose:         () => void
  /** Large icon rendered inside the circular tinted badge. */
  icon:            React.ReactNode
  /** Controls the badge bg + icon color via semantic tokens. */
  tone?:           CdsDialogTone
  title:           string
  description?:    React.ReactNode
  /** Optional slot rendered between description and the CTA (e.g. a reason textarea). */
  children?:       React.ReactNode
  /** Primary CTA */
  confirmLabel:    string
  onConfirm:       () => void
  confirmVariant?: 'primary' | 'danger'
  confirmLoading?: boolean
  confirmDisabled?: boolean
  /** Sub action — centered text link below the CTA. Omit both to hide it. */
  cancelLabel?:    string
  onCancel?:       () => void
  dismissOnBackdrop?: boolean
  className?:      string
}

const TONE_BADGE: Record<CdsDialogTone, string> = {
  primary: 'bg-(--primary-bg) text-(--primary)',
  success: 'bg-(--success-bg) text-(--success)',
  warning: 'bg-(--warning-bg) text-(--warning)',
  danger:  'bg-(--danger-bg) text-(--danger)',
  neutral: 'bg-(--neutral-bg) text-(--neutral)',
}

export function CdsDialog({
  open,
  onClose,
  icon,
  tone = 'primary',
  title,
  description,
  children,
  confirmLabel,
  onConfirm,
  confirmVariant = 'primary',
  confirmLoading = false,
  confirmDisabled = false,
  cancelLabel,
  onCancel,
  dismissOnBackdrop = false,
  className = '',
}: CdsDialogProps) {
  if (!open) return null

  const showCancel = Boolean(cancelLabel && onCancel)

  return (
    <div className="fixed inset-0 z-1300">
      <div className="fixed inset-0 bg-(--overlay-backdrop)" />
      <div
        className="fixed inset-0 flex items-center justify-center p-4"
        onClick={dismissOnBackdrop ? onClose : undefined}
      >
        <div
          className={`relative flex w-full max-w-sm flex-col items-center gap-4 rounded-xl border border-(--border) bg-(--surface) p-6 shadow-(--shadow-overlay) ${className}`}
          onClick={dismissOnBackdrop ? (e) => e.stopPropagation() : undefined}
        >
          {/* Icon badge */}
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full [&>svg]:h-6 [&>svg]:w-6 ${TONE_BADGE[tone]}`}>
            {icon}
          </span>

          {/* Title + description */}
          <div className="flex flex-col items-center gap-1.5 text-center">
            <h2 className="type-h5 font-bold text-(--text)">{title}</h2>
            {description && (
              <p className="type-body text-(--muted)">{description}</p>
            )}
          </div>

          {/* Optional slot */}
          {children && (
            <div className="w-full">{children}</div>
          )}

          {/* Actions — extra top margin (mt-2 over the container gap-4 = 24px) so the
             action zone reads as a distinct block, separated from the content above. */}
          <div className="mt-2 flex w-full flex-col items-center gap-3">
            <CdsButton
              variant="primary"
              size="md"
              width="full"
              onClick={onConfirm}
              loading={confirmLoading}
              disabled={confirmDisabled}
              className={confirmVariant === 'danger' ? 'bg-(--danger) text-(--on-primary) hover:bg-(--danger)' : ''}
            >
              {confirmLabel}
            </CdsButton>
            {showCancel && (
              <button
                type="button"
                className="type-body font-bold text-(--accent) cursor-pointer hover:text-(--accent-hover) transition-colors text-center"
                onClick={onCancel}
              >
                {cancelLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
