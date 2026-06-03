import React from 'react'
import { Check, Minus } from 'lucide-react'

export interface CdsCheckboxProps {
  checked?:        boolean
  indeterminate?:  boolean
  onChange?:       (checked: boolean) => void
  disabled?:       boolean
  className?:      string
}

export function CdsCheckbox({ checked = false, indeterminate = false, onChange, disabled = false, className = '' }: CdsCheckboxProps) {
  const isOn = checked || indeterminate

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={[
        'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
        isOn
          ? 'border-(--accent) bg-(--accent) text-white'
          : 'border-(--border) bg-(--surface) text-transparent hover:border-(--accent)',
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
        className,
      ].join(' ')}
    >
      {indeterminate ? <Minus size={10} strokeWidth={3} /> : checked ? <Check size={10} strokeWidth={3} /> : null}
    </button>
  )
}
