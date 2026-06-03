import React from 'react'
import { CdsMenuItem } from './menu-item'

export interface SubMenuItem {
  value:      string
  label:      string
  subLabel?:  string
}

export interface CdsSubMenuProps {
  label:      string
  icon?:      React.ReactNode
  onClick?:   () => void
  className?: string
}

export function CdsSubMenu({
  label,
  icon,
  onClick,
  className = '',
}: CdsSubMenuProps) {
  return (
    <div className={className}>
      <CdsMenuItem icon={icon} onClick={onClick}>
        {label}
      </CdsMenuItem>
    </div>
  )
}
