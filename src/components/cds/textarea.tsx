import React from 'react'

export type CdsTextareaSize = 'sm' | 'md' | 'lg'

export interface CdsTextareaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  maxLength?: number
  disabled?: boolean
  size?: CdsTextareaSize
  className?: string
}

const sizes: Record<CdsTextareaSize, string> = {
  sm: 'px-2.5 py-1.5 type-body-sm',
  md: 'px-3 py-2 type-body',
  lg: 'px-3 py-2.5 type-body',
}

export function CdsTextarea({ value, onChange, placeholder, rows = 3, maxLength, disabled = false, size = 'md', className = '' }: CdsTextareaProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <textarea
        className={`w-full rounded-md border border-(--border) bg-(--surface) text-(--text) placeholder:text-(--subtle) outline-none transition hover:bg-(--item-hover) focus:border-(--accent) focus:bg-(--surface) disabled:opacity-50 disabled:cursor-not-allowed resize-y ${sizes[size]}`}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
      />
      {maxLength && (
        <span className="type-caption text-(--subtle) self-end">{value.length}/{maxLength}</span>
      )}
    </div>
  )
}
