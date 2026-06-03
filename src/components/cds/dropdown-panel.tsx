import React from 'react'

export interface CdsDropdownPanelProps {
  className?: string
  children?:  React.ReactNode
}

export function CdsDropdownPanel({ className = '', children }: CdsDropdownPanelProps) {
  return (
    <div className={`rounded-lg border border-(--border) bg-(--surface-overlay) shadow-(--shadow-overlay) ${className}`}>
      {children}
    </div>
  )
}
