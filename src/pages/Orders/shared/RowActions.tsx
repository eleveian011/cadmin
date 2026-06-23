// @ts-nocheck
import { CdsButton } from '../../../components/cds'

/**
 * Frozen-right row actions for the Abnormal Orders table (text links, no menu/icons).
 * - "Task": navigates to the linked Task Center task (only when task_center_id present).
 * - "Mark Refunded": only for unidentified + processing.manual_review (PRD §7.7.8).
 * Separator shown only when both entries are present. All handlers stopPropagation so
 * they don't trigger the row-click detail modal.
 */
export function RowActions({ row, onViewTask, onMarkRefunded, t }) {
  const canViewTask = !!row.task_center_id
  const canRefund = row.internal_reason === 'unidentified' && row.status === 'processing.manual_review'
  const linkCls = 'type-body font-bold text-(--accent) hover:text-(--accent-hover) cursor-pointer transition-colors whitespace-nowrap'

  return (
    <div className="flex items-center justify-end gap-2 shrink-0 whitespace-nowrap">
      {canViewTask && (
        <button type="button" className={linkCls} onClick={(e) => { e.stopPropagation(); onViewTask(row) }}>
          {t('depositOrder.actions.task')}
        </button>
      )}
      {canViewTask && canRefund && <span className="text-(--border-strong)">|</span>}
      {canRefund && (
        <button type="button" className={linkCls} onClick={(e) => { e.stopPropagation(); onMarkRefunded(row) }}>
          {t('depositOrder.actions.markRefundedShort')}
        </button>
      )}
      {!canViewTask && !canRefund && <span className="type-body text-(--subtle)">—</span>}
    </div>
  )
}
