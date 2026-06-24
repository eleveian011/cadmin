/**
 * Role permission model (Manage User Role admin page).
 *
 * Three fixed roles — maker / checker / admin — each carrying a display name, a
 * description, and a flat map of permission flags. Permissions form a small
 * dependency tree (see `PERMISSION_CATALOG` in the page's data file): a child
 * permission may only be enabled while its parent is enabled.
 *
 * Mock-only for now; the store seam mirrors the other reference tables so a real
 * backend can be wired in without page changes.
 */

/** The three configurable roles. */
export type RoleKey = 'maker' | 'checker' | 'admin'

/** Every configurable permission key. */
export type PermissionKey =
  | 'manage_org_users'
  | 'review_withdraw'
  | 'submit_withdraw'
  | 'handle_rfi'
  | 'view_task_center'
  | 'view_task_own'
  | 'view_task_others'
  | 'assign_task'

/** Map of permission key → granted flag. */
export type PermissionMap = Record<PermissionKey, boolean>

/** A single role definition: identity + its permission grants. */
export interface RoleDefinition {
  key:         RoleKey
  name:        string
  description: string
  permissions: PermissionMap
}
