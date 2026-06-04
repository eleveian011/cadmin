// @ts-nocheck
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react'
import { Pencil, Trash2, MoreHorizontal } from 'lucide-react'
import { CdsButton } from '../../../components/cds'

/**
 * Frozen-right row actions for the Channel Accounts table (§7.4 Operations):
 * Edit, Delete (soft delete). Viewing detail is the row click itself. All handlers
 * stopPropagation so the menu doesn't also trigger the row-click detail modal.
 */
export function RowActions({ row, onEdit, onDelete, t }) {
  const itemCls = 'flex w-full items-center gap-2 rounded-md px-2 py-1.5 type-body text-(--text) data-[focus]:bg-(--item-hover) cursor-pointer'

  return (
    <div className="flex items-center justify-end gap-1 shrink-0 whitespace-nowrap">
      <Menu>
        <MenuButton as="div" onClick={(e) => e.stopPropagation()}>
          <CdsButton variant="text" size="sm" icon={<MoreHorizontal size={16} />} />
        </MenuButton>
        <MenuItems
          anchor="bottom end"
          className="z-1200 w-40 rounded-lg border border-(--border) bg-(--surface-overlay) p-1.5 shadow-(--shadow-overlay) [--anchor-gap:6px]"
        >
          <MenuItem>
            <button type="button" className={itemCls}
              onClick={(e) => { e.stopPropagation(); onEdit(row) }}>
              <Pencil size={14} /> {t('channelAccount.actions.edit')}
            </button>
          </MenuItem>
          <MenuItem>
            <button type="button" className={`${itemCls} text-(--danger-text) data-[focus]:bg-(--danger-bg)`}
              onClick={(e) => { e.stopPropagation(); onDelete(row) }}>
              <Trash2 size={14} /> {t('channelAccount.actions.delete')}
            </button>
          </MenuItem>
        </MenuItems>
      </Menu>
    </div>
  )
}
