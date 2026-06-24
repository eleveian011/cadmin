import type { RoleDefinition, RoleKey, PermissionKey, PermissionMap } from '../types/user-role'

/**
 * Manage User Role seed (mock build).
 *
 * Two pieces:
 *  - PERMISSION_CATALOG — the structure of the permission list: order, grouping,
 *    and the parent→child dependency tree. The page renders from this.
 *  - roleDefinitions    — the three roles (maker / checker / admin) with their
 *    name, description, and current grants. Mutated in-memory by the store.
 *
 * Dependency rule (enforced in the store + UI): a child permission can only be
 * granted while its parent is granted. Revoking a parent cascades to its
 * children.
 */

/** A node in the permission catalog. `children` form the dependency sub-tree. */
export interface PermissionNode {
  key:      PermissionKey
  /** i18n key suffix under `userRole.perm.*` for label + description. */
  children?: PermissionNode[]
}

/** Ordered permission tree shown in every role tab. */
export const PERMISSION_CATALOG: PermissionNode[] = [
  { key: 'manage_org_users' },
  { key: 'review_withdraw' },
  { key: 'submit_withdraw' },
  { key: 'handle_rfi' },
  {
    key: 'view_task_center',
    children: [
      { key: 'view_task_own' },
      { key: 'view_task_others' },
      { key: 'assign_task' },
    ],
  },
]

export const ROLE_KEYS: RoleKey[] = ['maker', 'checker', 'admin']

/** All permission keys flattened from the catalog (catalog order). */
export const PERMISSION_KEYS: PermissionKey[] = PERMISSION_CATALOG.flatMap(
  n => [n.key, ...(n.children?.map(c => c.key) ?? [])],
)

/** Map of child permission → its parent (for dependency enforcement). */
export const PERMISSION_PARENT: Partial<Record<PermissionKey, PermissionKey>> = (() => {
  const map: Partial<Record<PermissionKey, PermissionKey>> = {}
  for (const node of PERMISSION_CATALOG) {
    for (const child of node.children ?? []) map[child.key] = node.key
  }
  return map
})()

/** Build a full PermissionMap, defaulting every key to false then applying grants. */
function grants(...keys: PermissionKey[]): PermissionMap {
  const map = Object.fromEntries(PERMISSION_KEYS.map(k => [k, false])) as PermissionMap
  for (const k of keys) map[k] = true
  return map
}

export const roleDefinitions: RoleDefinition[] = [
  {
    key: 'maker',
    name: 'Maker',
    description: 'Submits withdraw orders to the Task Center and tracks their own queue. Cannot review or approve.',
    permissions: grants(
      'submit_withdraw',
      'handle_rfi',
      'view_task_center', 'view_task_own',
    ),
  },
  {
    key: 'checker',
    name: 'Checker',
    description: 'Reviews and approves withdraw orders. Has full visibility of the Task Center and can assign work.',
    permissions: grants(
      'review_withdraw',
      'handle_rfi',
      'view_task_center', 'view_task_own', 'view_task_others', 'assign_task',
    ),
  },
  {
    key: 'admin',
    name: 'Admin',
    description: 'Manages organization users and roles. Has every operational permission.',
    permissions: grants(...PERMISSION_KEYS),
  },
]
