import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutGrid, Wallet, SwatchBook, FileText,
  ChevronRight, ChevronDown,
  MoreHorizontal, Sun, Moon, LogOut,
  type LucideIcon,
} from 'lucide-react'
import { CdsAvatar, CdsMenuItem } from '../../components/cds'
import { useTheme } from '../../hooks/useTheme'

interface LeafNavItem {
  to:    string
  Icon:  LucideIcon
  label: string
  type?: never
}

interface GroupNavItem {
  type:  'group'
  key:   string
  Icon:  LucideIcon
  label: string
  items: LeafNavItem[]
}

type NavItem = LeafNavItem | GroupNavItem

interface NavSection {
  key:   string
  label: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    key: 'workspace',
    label: 'Workspace',
    items: [
      { to: '/assets',        Icon: Wallet,    label: 'Assets' },
      { to: '/cds-guideline', Icon: SwatchBook, label: 'CDS Guideline' },
      {
        type: 'group', key: 'examples', Icon: LayoutGrid, label: 'Examples',
        items: [
          { to: '/blank', Icon: FileText, label: 'Blank Page' },
        ],
      },
    ],
  },
]

const ROW = [
  'flex w-full items-center gap-2 px-4 py-2',
  'type-body text-left outline-none',
  'bg-transparent border-0 cursor-pointer',
  'transition-colors duration-100',
].join(' ')

const ROW_ACTIVE  = `${ROW} bg-(--accent-subtle) font-semibold text-(--accent-text)`
const ROW_DEFAULT = `${ROW} text-(--text) hover:bg-(--item-hover)`
const ROW_MUTED   = `${ROW} pl-[calc(var(--sidebar-px)+23px)] text-(--muted) hover:text-(--text) hover:bg-(--item-hover)`
const ROW_MUTED_ACTIVE = `${ROW} pl-[calc(var(--sidebar-px)+23px)] bg-(--accent-subtle) font-semibold text-(--accent-text)`

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
  isMobile?:   boolean
  mobileOpen?: boolean
  onClose?:    () => void
}

export default function Sidebar({ isMobile = false, mobileOpen = false, onClose }: SidebarProps) {
  const location = useLocation()
  const [openGroup, setOpenGroup] = useState<string | null>('examples')

  useEffect(() => {
    const path = location.pathname
    for (const section of NAV_SECTIONS) {
      for (const item of section.items) {
        if (item.type === 'group' && item.items.some(sub => path.startsWith(sub.to))) {
          setOpenGroup(item.key)
          return
        }
      }
    }
  }, [location.pathname])

  const toggleGroup = (key: string) =>
    setOpenGroup(prev => prev === key ? null : key)

  const renderLeafItem = (item: LeafNavItem, sectionKey: string, isSub = false) => {
    const { Icon, label } = item
    return (
      <NavLink
        key={`${sectionKey}-${item.to}`}
        to={item.to}
        onClick={() => onClose?.()}
        className={({ isActive }) =>
          isSub
            ? (isActive ? ROW_MUTED_ACTIVE : ROW_MUTED)
            : (isActive ? ROW_ACTIVE : ROW_DEFAULT)
        }
      >
        {!isSub && <Icon size={15} className="shrink-0 opacity-80" />}
        <span className="flex-1 truncate">{label}</span>
      </NavLink>
    )
  }

  const asideClasses = [
    'fixed bottom-0 left-0 flex flex-col',
    'border-r border-(--border) bg-(--surface)',
    isMobile
      ? `top-0 z-110 w-(--sidebar-w) transition-transform duration-300 ease-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`
      : 'top-(--header-h) z-90 w-(--sidebar-w)',
  ].join(' ')

  return (
    <aside className={asideClasses}>
      {/* Workspace label */}
      <div className="flex items-center gap-2 p-2 m-2 rounded-md">
        <div className="flex-1 min-w-0">
          <span className="type-caption font-semibold uppercase text-(--subtle)">Workspace</span>
          <p className="type-body font-medium text-(--text) truncate mt-0.5">My Workspace</p>
        </div>
        <ChevronDown size={16} className="shrink-0 text-(--subtle)" />
      </div>

      {/* Nav */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-none">
        <nav className="py-2.5">
          <div className="px-4 pt-1">
            <span className="type-caption font-semibold uppercase text-(--subtle)">Navigation</span>
          </div>
          {NAV_SECTIONS.map(({ key, items }) =>
            items.map((item) => {
              if (item.type === 'group') {
                const isOpen = openGroup === item.key
                const GroupIcon = item.Icon
                return (
                  <div key={`${key}-${item.key}`}>
                    <button
                      className={ROW_DEFAULT}
                      onClick={() => toggleGroup(item.key)}
                      aria-expanded={isOpen}
                    >
                      <GroupIcon size={15} className="shrink-0 opacity-80" />
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronRight
                        size={16}
                        className={`shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-90 text-(--muted)' : 'text-(--subtle)'}`}
                      />
                    </button>
                    <div className={`grid transition-[grid-template-rows] duration-200 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                      <div className="overflow-hidden">
                        {item.items.map(sub => renderLeafItem(sub, key, true))}
                      </div>
                    </div>
                  </div>
                )
              }
              return renderLeafItem(item, key, false)
            })
          )}
        </nav>
      </div>

      {/* Profile */}
      <div className="shrink-0">
        <ProfileMenu />
      </div>
    </aside>
  )
}
