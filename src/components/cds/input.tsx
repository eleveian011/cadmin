import React from 'react'
import { CircleX } from 'lucide-react'

export type CdsInputSize = 'sm' | 'md' | 'lg'

export interface CdsInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?:      CdsInputSize
  onClear?:   () => void
  className?: string
}

const sizes: Record<CdsInputSize, string> = {
  sm: 'h-8 px-2.5 type-body-sm',
  md: 'h-9 px-3 type-body',
  lg: 'h-10 px-3 type-body',
}

export function CdsInput({ className = '', size = 'lg', onClear, value, ...props }: CdsInputProps) {
  const hasValue = value !== undefined && value !== ''
  return (
    <div className={`relative ${className}`}>
      <input
        value={value}
        className={`w-full rounded-md border border-(--border) bg-(--surface) ${onClear ? 'pr-8' : ''} text-(--text) placeholder:text-(--subtle) outline-none transition hover:bg-(--item-hover) focus:border-(--accent) focus:bg-(--surface) ${sizes[size]}`}
        {...props}
      />
      {onClear && hasValue && (
        <button type="button" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-(--muted) hover:text-(--text) cursor-pointer transition-colors" onClick={onClear}>
          <CircleX size={14} />
        </button>
      )}
    </div>
  )
}
