import React from 'react'

export interface CdsRadioProps {
  checked?:   boolean
  onChange?:  (checked: boolean) => void
  disabled?:  boolean
  className?: string
  name?:      string
  value?:     string
}

export function CdsRadio({ checked = false, onChange, disabled = false, className = '', name, value }: CdsRadioProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      disabled={disabled}
      data-name={name}
      data-value={value}
      onClick={() => onChange?.(!checked)}
      className={[
        'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors',
        checked
          ? 'border-(--accent) bg-(--accent)'
          : 'border-(--border) bg-(--surface) hover:border-(--accent)',
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
        className,
      ].join(' ')}
    >
      {checked && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
    </button>
  )
}
