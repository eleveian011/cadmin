import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { NavLink } from 'react-router-dom'
import {
  SwatchBook,
  ClipboardList, ReceiptText, Landmark, FileJson, Scale,
  MoreHorizontal, Sun, Moon, LogOut, Menu,
  type LucideIcon,
} from 'lucide-react'
import { CdsAvatar, CdsMenuItem } from '../../components/cds'
import { useTheme } from '../../hooks/useTheme'
import { useTaskBadgeCount } from '../../services/hooks'
import Logo from './Logo'

interface LeafNavItem {
  to:    string
  Icon:  LucideIcon
  label: string
}

type NavItem = LeafNavItem

const NAV_ITEMS: NavItem[] = [
  { to: '/task-center',     Icon: ClipboardList, label: 'Task Center' },
  { to: '/orders',          Icon: ReceiptText,   label: 'Order Management' },
  { to: '/channel-accounts', Icon: Landmark,     label: 'Fiat Account Mapping' },
  { to: '/reconciliation',  Icon: Scale,         label: 'Reconciliation Report' },
  { to: '/gldb-parser',     Icon: FileJson,      label: 'GLDB Webhook Parser' },
  { to: '/cds-guideline',   Icon: SwatchBook,    label: 'CDS Guideline' },
]

const ROW = [
  'flex w-full items-center gap-2 px-4 py-2',
  'type-body text-left outline-none',
  'bg-transparent border-0 cursor-pointer',
  'transition-colors duration-100',
].join(' ')

const ROW_ACTIVE  = `${ROW} bg-(--accent-subtle) font-semibold text-(--accent-text)`
const ROW_DEFAULT = `${ROW} text-(--text) hover:bg-(--item-hover)`

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      className="relative flex shrink-0 cursor-pointer items-center rounded-full border border-(--border) bg-(--fill) transition-colors hover:border-(--border-strong)"
      style={{ width: '54px', height: '40px' }}
    >
      <div
        className="absolute flex h-8 w-8 items-center justify-center rounded-full bg-(--surface) shadow-(--shadow-sm) transition-all duration-300 ease-in-out"
        style={{ left: isDark ? '19px' : '3px', top: '3px' }}
      >
        {isDark
          ? <Moon size={16} className="text-(--text)" />
          : <Sun size={16} className="text-(--text)" />
        }
      </div>
    </button>
  )
}
function ProfileMenu() {
  const displayName = 'Admin User'
  const [open, setOpen] = useState(false)
  const [pos, setPos]   = useState<{ bottom?: number; left?: number; width?: number }>({})
  const triggerRef      = useRef<HTMLDivElement>(null)
  const menuRef         = useRef<HTMLDivElement>(null)

  const openMenu = () => {
    const r = triggerRef.current!.getBoundingClientRect()
    setPos({ bottom: window.innerHeight - r.top + 6, left: r.left, width: r.width })
    setOpen(true)
  }
  const closeMenu = () => setOpen(false)

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node) && !triggerRef.current?.contains(e.target as Node))
        closeMenu()
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') closeMenu() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open])

  return (
    <>
      <div
        ref={triggerRef}
        className="flex cursor-pointer items-center gap-3 p-2 m-2 rounded-md transition-colors hover:bg-(--item-hover)"
        onClick={openMenu}
      >
        <CdsAvatar size="md" name={displayName} />
        <div className="min-w-0 flex-1">
          <p className="type-body font-semibold text-(--text) truncate">{displayName}</p>
        </div>
        <MoreHorizontal size={14} className="shrink-0 text-(--subtle)" />
      </div>

      {open && createPortal(
        <div
          ref={menuRef}
          className="fixed z-1200 overflow-hidden rounded-lg border border-(--border) bg-(--surface) shadow-(--shadow-overlay)"
          style={{ bottom: pos.bottom, left: pos.left, width: pos.width }}
        >
          <div className="flex items-center justify-between border-b border-(--border) px-4 py-3">
            <span className="type-body font-medium text-(--text)">Theme</span>
            <ThemeToggle />
          </div>
          <div className="p-1.5">
            <CdsMenuItem variant="danger" icon={<LogOut size={14} />} onClick={closeMenu}>
              Sign out
            </CdsMenuItem>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
interface SidebarProps {
  isMobile?:       boolean
  mobileOpen?:     boolean
  onClose?:        () => void
  onMobileToggle?: () => void
}

export default function Sidebar({ isMobile = false, mobileOpen = false, onClose, onMobileToggle }: SidebarProps) {
  const { data: taskBadge } = useTaskBadgeCount()
  const taskCount = taskBadge?.badgeCount ?? 0

  const asideClasses = [
    'fixed bottom-0 left-0 top-0 flex flex-col',
    'border-r border-(--border) bg-(--surface)',
    isMobile
      ? `z-110 w-(--sidebar-w) transition-transform duration-300 ease-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`
      : 'z-90 w-(--sidebar-w)',
  ].join(' ')

  return (
    <aside className={asideClasses}>
      {/* Logo header */}
      <div className="flex h-(--header-h) shrink-0 items-center gap-2 border-b border-(--border) px-(--sidebar-px)">
        {isMobile && onMobileToggle && (
          <button
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center text-(--muted) transition-colors hover:text-(--text)"
            onClick={onMobileToggle}
            title="Toggle menu"
          >
            <Menu size={18} />
          </button>
        )}
        <Logo height={28} />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-none">
        <nav className="py-2.5">
          {NAV_ITEMS.map((item) => {
            const badge = item.to === '/task-center' ? taskCount : 0
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => onClose?.()}
                className={({ isActive }) => isActive ? ROW_ACTIVE : ROW_DEFAULT}
              >
                <item.Icon size={15} className="shrink-0 opacity-80" />
                <span className="flex-1 truncate">{item.label}</span>
                {badge > 0 && (
                  <span className="shrink-0 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-(--danger) text-(--on-primary) type-caption font-bold tabular-nums">
                    {badge}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>
      </div>
      <div className="shrink-0">
        <ProfileMenu />
      </div>
    </aside>
  )
}
