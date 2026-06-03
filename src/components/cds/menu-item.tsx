import React from 'react'

export type CdsMenuItemVariant = 'action' | 'danger' | 'readonly' | 'header' | 'custom'

export interface CdsMenuItemProps {
  variant?:    CdsMenuItemVariant
  onClick?:    () => void
  icon?:       React.ReactNode
  trailing?:   React.ReactNode
  selected?:   boolean
  className?:  string
  children:    React.ReactNode
}

const BASE =
  'flex w-full items-center gap-2 rounded-md border-0 bg-transparent cursor-pointer ' +
  'px-2.5 py-2 type-body text-left outline-none transition-colors'

const VARIANT_CLASSES: Record<CdsMenuItemVariant, string> = {
  action:   `${BASE} text-(--text) hover:bg-(--accent-subtle) hover:text-(--accent-text)`,
  danger:   `${BASE} text-(--danger) hover:bg-(--danger-bg)`,
  readonly: 'flex w-full items-center gap-2 rounded-md border-0 bg-transparent cursor-default px-2.5 py-2 type-body text-left outline-none transition-colors text-(--muted)',
  header:   'px-2.5 pb-1 pt-2.5 type-caption font-semibold uppercase text-left text-(--subtle)',
  custom:   `${BASE} text-(--text) hover:bg-(--accent-subtle) hover:text-(--accent-text)`,
}

export function CdsMenuItem({
  variant = 'action',
  onClick,
  icon,
  trailing,
  selected,
  className = '',
  children,
}: CdsMenuItemProps) {
  const cls = `${VARIANT_CLASSES[variant]} ${selected ? 'font-semibold' : ''} ${className}`

  if (variant === 'header') {
    return <div className={`${VARIANT_CLASSES.header} ${className}`}>{children}</div>
  }

  if (variant === 'readonly') {
    return (
      <div className={cls}>
        {icon && <span className="shrink-0 text-(--muted)">{icon}</span>}
        <span className="flex-1 truncate">{children}</span>
        {trailing}
      </div>
    )
  }

  return (
    <button type="button" className={cls} onClick={onClick}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="flex-1 truncate">{children}</span>
      {trailing}
    </button>
  )
}
