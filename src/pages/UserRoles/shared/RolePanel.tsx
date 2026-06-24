// @ts-nocheck
import { useState, useEffect, useMemo } from 'react'
import { CdsButton, useToast } from '../../../components/cds'
import { useUpdateRole } from '../../../services/hooks'
import { PERMISSION_CATALOG } from '../../../data/user-roles'
import { PermissionList } from './PermissionList'

/* ─── Role panel ─────────────────────────────────────────────────────────────
 * One role's view: Role Name + Description are read-only; the permission list is
 * editable. Edits live in local draft state; Save persists to the store.
 * Toggling a parent permission off cascades its children off (mirrors the
 * store's normalization).
 */

export function RolePanel({ role, t }) {
  const toast  = useToast()
  const update = useUpdateRole()

  const [perms, setPerms] = useState(() => ({ ...role.permissions }))

  // Reset the draft whenever the selected role (or its persisted grants) change.
  useEffect(() => { setPerms({ ...role.permissions }) }, [role.key, role.permissions])

  const togglePermission = (key, value) => {
    setPerms(prev => {
      const next = { ...prev, [key]: value }
      // Cascade: turning a parent off forces its children off.
      if (!value) {
        const node = PERMISSION_CATALOG.find(n => n.key === key)
        node?.children?.forEach(c => { next[c.key] = false })
      }
      return next
    })
  }

  const dirty = useMemo(
    () => Object.keys(perms).some(k => role.permissions[k] !== perms[k]),
    [role, perms],
  )

  const handleSave = () => {
    update.mutateAsync({ key: role.key, permissions: perms })
      .then(() => toast.show(t('userRole.toast.saved', { role: role.name })))
      .catch(e => toast.show(e?.message || 'Save failed'))
  }

  const handleReset = () => setPerms({ ...role.permissions })

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div className="flex flex-col gap-1">
          <span className="type-caption font-semibold uppercase text-(--subtle)">{t('userRole.field.roleName')}</span>
          <span className="type-body-lg font-bold text-(--text)">{role.name}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="type-caption font-semibold uppercase text-(--subtle)">{t('userRole.field.roleDesc')}</span>
          <span className="type-body text-(--muted)">{role.description}</span>
        </div>
      </div>

      <PermissionList perms={perms} onToggle={togglePermission} t={t} />

      <div className="flex items-center justify-end gap-2">
        <CdsButton variant="ghost" size="md" disabled={!dirty || update.isPending} onClick={handleReset}>
          {t('userRole.actions.reset')}
        </CdsButton>
        <CdsButton variant="primary" size="md" disabled={!dirty} loading={update.isPending} onClick={handleSave}>
          {t('userRole.actions.save')}
        </CdsButton>
      </div>
    </div>
  )
}
