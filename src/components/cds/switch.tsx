import React from 'react'

export type CdsSwitchSize = 'sm' | 'md'

export interface CdsSwitchProps {
  checked?:    boolean
  onChange?:   (checked: boolean) => void
  disabled?:   boolean
  size?:       CdsSwitchSize
  className?:  string
  ariaLabel?:  string
}

const TRACK = {
  sm: 'h-4 w-7',
  md: 'h-5 w-9',
}

const THUMB = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
}

const THUMB_TRANSLATE = {
  sm: { on: 'translate-x-3.5', off: 'translate-x-0.5' },
  md: { on: 'translate-x-4.5', off: 'translate-x-0.5' },
}

export function CdsSwitch({
  checked = false,
  onChange,
  disabled = false,
  size = 'md',
  className = '',
  ariaLabel,
}: CdsSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={[
        'relative inline-flex shrink-0 items-center rounded-full transition-colors',
        TRACK[size],
        checked ? 'bg-(--accent)' : 'bg-(--border-strong)',
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
        className,
      ].join(' ')}
    >
      <span
        className={[
          'inline-block rounded-full bg-white shadow-(--shadow-sm) transition-transform',
          THUMB[size],
          checked ? THUMB_TRANSLATE[size].on : THUMB_TRANSLATE[size].off,
        ].join(' ')}
      />
    </button>
  )
}
