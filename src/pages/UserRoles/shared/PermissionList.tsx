// @ts-nocheck
import { CdsSwitch } from '../../../components/cds'
import { PERMISSION_CATALOG } from '../../../data/user-roles'

/* ─── Permission list ────────────────────────────────────────────────────────
 * Renders the permission catalog as a dependency-aware switch tree. Child rows
 * are indented under their parent; a child is disabled (and forced off) whenever
 * its parent is off. Toggling a parent off cascades its children off.
 */

function PermissionRow({ node, perms, onToggle, depth, parentOn, t }) {
  const checked  = !!perms[node.key]
  const disabled = depth > 0 && !parentOn

  return (
    <>
      <div
        className={`flex items-start justify-between gap-4 py-3 ${depth > 0 ? 'pl-10' : 'pl-4'} pr-4 ${depth === 0 ? 'border-t border-(--border)' : ''}`}
      >
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className={`type-body ${disabled ? 'text-(--disabled-text)' : 'text-(--text)'}`}>
            {t(`userRole.perm.${node.key}.label`)}
          </span>
          <span className="type-body-sm text-(--muted)">
            {t(`userRole.perm.${node.key}.desc`)}
          </span>
        </div>
        <div className="pt-0.5 shrink-0">
          <CdsSwitch
            checked={checked}
            disabled={disabled}
            onChange={(v) => onToggle(node.key, v)}
            ariaLabel={t(`userRole.perm.${node.key}.label`)}
          />
        </div>
      </div>
      {node.children?.map((child) => (
        <PermissionRow
          key={child.key}
          node={child}
          perms={perms}
          onToggle={onToggle}
          depth={depth + 1}
          parentOn={checked}
          t={t}
        />
      ))}
    </>
  )
}

export function PermissionList({ perms, onToggle, t }) {
  return (
    <div className="rounded-lg border border-(--border) bg-(--surface) overflow-hidden">
      <div className="px-4 py-2.5 bg-(--fill)">
        <span className="type-caption font-semibold uppercase text-(--subtle)">
          {t('userRole.permissionsHeader')}
        </span>
      </div>
      {PERMISSION_CATALOG.map((node) => (
        <PermissionRow
          key={node.key}
          node={node}
          perms={perms}
          onToggle={onToggle}
          depth={0}
          parentOn
          t={t}
        />
      ))}
    </div>
  )
}
