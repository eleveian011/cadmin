import React, { type ReactNode } from 'react'
import { Popover, PopoverButton, PopoverPanel, CloseButton } from '@headlessui/react'
import { PlusCircle, XCircle } from 'lucide-react'

export interface CdsFilterPillProps {
  title: string
  value?: string | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onClear?: () => void
  children: ReactNode | ((bag: { close: () => void }) => ReactNode)
  className?: string
}

export function CdsFilterPill({
  title,
  value,
  onClear,
  children,
  className = '',
}: CdsFilterPillProps) {
  const isActive = value != null && value !== ''

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onClear?.()
  }

  const pillBase = [
    'inline-flex items-center gap-1.5 h-7 px-2 rounded-full',
    'type-body-sm font-bold transition-colors cursor-pointer',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)',
    'hover:bg-(--item-hover)',
  ].join(' ')

  const pillState = isActive
    ? 'border border-solid border-(--border-strong) text-(--text)'
    : 'border border-dashed border-(--border-strong) text-(--text)'

  return (
    <Popover className={`relative inline-block ${className}`}>
      {({ close }) => (
        <>
          <PopoverButton className={`${pillBase} ${pillState}`}>
            {isActive ? (
              <span onClick={handleClear} className="shrink-0 inline-flex">
                <XCircle size={14} />
              </span>
            ) : (
              <PlusCircle size={14} className="shrink-0" />
            )}
            <span>{title}</span>
            {isActive && (
              <>
                <span className="w-px h-4 border-r border-(--border)" />
                <span className="font-semibold text-(--accent)">{value}</span>
              </>
            )}
          </PopoverButton>

          <PopoverPanel
            anchor="bottom start"
            className="z-50 mt-1 min-w-60 rounded-lg border border-(--border) bg-(--surface) p-3 shadow-(--shadow-overlay)"
          >
            {typeof children === 'function' ? children({ close }) : children}
          </PopoverPanel>
        </>
      )}
    </Popover>
  )
}
