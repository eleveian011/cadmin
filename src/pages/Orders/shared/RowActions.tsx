// @ts-nocheck

/**
 * Frozen-right row actions for the Abnormal Orders table (text links, no menu/icons).
 * - "Task": navigates to the linked Task Center task (only when task_center_id present).
 * Refund handling is done from Task Center, not here. All handlers stopPropagation so
 * they don't trigger the row-click detail modal.
 */
export function RowActions({ row, onViewTask, t }) {
  const canViewTask = !!row.task_center_id
  const linkCls = 'type-body font-bold text-(--accent) hover:text-(--accent-hover) cursor-pointer transition-colors whitespace-nowrap'

  return (
    <div className="flex items-center justify-end gap-2 shrink-0 whitespace-nowrap">
      {canViewTask ? (
        <button type="button" className={linkCls} onClick={(e) => { e.stopPropagation(); onViewTask(row) }}>
          {t('depositOrder.actions.task')}
        </button>
      ) : (
        <span className="type-body text-(--subtle)">—</span>
      )}
    </div>
  )
}
