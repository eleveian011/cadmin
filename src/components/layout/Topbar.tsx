import React from 'react'
import { Bell, Menu } from 'lucide-react'
import { CdsButton } from '../../components/cds'
import Logo from './Logo'

interface TopbarProps {
  isMobile?:       boolean
  onMobileToggle?: () => void
  children?:       React.ReactNode
}

export default function Topbar({ isMobile = false, onMobileToggle, children }: TopbarProps) {
  return (
    <div className="fixed inset-x-0 top-0 z-100 flex h-(--header-h) items-center border-b border-(--border) bg-(--surface-glass) backdrop-blur-md">
      <div className="flex h-full shrink-0 items-center gap-3 pl-4 pr-4 md:pr-5">
        {isMobile && onMobileToggle && (
          <button
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center text-(--muted) transition-colors hover:text-(--text)"
            onClick={onMobileToggle}
            title="Toggle menu"
          >
            <Menu size={18} />
          </button>
        )}
        <Logo height={32} />
      </div>

      {children && (
        <div className="flex shrink-0 items-center gap-2 pl-2">{children}</div>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-2 pl-4 pr-4 md:pr-5">
        <CdsButton variant="subtle" size="sm" icon={<Bell size={14} />} />
      </div>
    </div>
  )
}
