// @ts-nocheck
import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useDepositOrders } from '../../services/hooks'
import type { DepositOrder } from '../../types/deposit-order'
import {
  CdsTable, CdsTableState, CdsPagination, CdsStatusState,
} from '../../components/cds'
import type { CdsTableColumn } from '../../components/cds'
import { OrderFilters, EMPTY_ORDER_FILTERS } from './shared/OrderFilters'
import { buildOrderColumns, ColumnManageButton } from './shared/columns'
import { toOrderQuery, hasOrderFilters } from './shared/helpers'
import { OrderDetailModal } from './shared/OrderDetailModal'
import { MarkRefundedModal } from './shared/OrderActionModals'

const PER_PAGE_DEFAULT = 20

// Full Transaction tab — many columns available; hide the long tail by default,
// Ops reveals what they need via Manage Columns.
const DEFAULT_HIDDEN = new Set([
  'sub_status', 'transaction_type', 'order_category',
  'channel_account_no', 'credited_amount', 'channel_fee_amount', 'service_fee_amount',
  'counterparty_account_no', 'counterparty_bank_swift_bic',
  'counterparty_bank_country', 'counterparty_country', 'payment_reference',
  'beneficiary_account_no', 'beneficiary_bank_name', 'beneficiary_bank_swift_bic',
  'reference_code', 'matched_rule_step', 'screening_result',
  'ops_handler', 'remarks', 'updated_at',
])

// Columns that must always stay visible / non-reorderable.
const PINNED_COLS = new Set(['transaction_id', '_actions'])

export default function AllOrders({ embedded = false }: { embedded?: boolean }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [filters,  setFilters]  = useState(EMPTY_ORDER_FILTERS)
  const [page,     setPage]     = useState(1)
  const [pageSize, setPageSize] = useState(PER_PAGE_DEFAULT)

  const [columnOrder, setColumnOrder] = useState([])
  const [hiddenCols,  setHiddenCols]  = useState(new Set(DEFAULT_HIDDEN))

  // Row action / detail modal targets
  const [detailOrder, setDetailOrder] = useState<DepositOrder | null>(null)
  const [refundOrder, setRefundOrder] = useState<DepositOrder | null>(null)

  const onViewTask = useCallback((row: DepositOrder) => {
    if (row.task_center_id) navigate(`/task-center?task=${encodeURIComponent(row.task_center_id)}`)
  }, [navigate])

  const { data, isLoading, isFetching, isError, refetch } = useDepositOrders({
    ...toOrderQuery(filters),
    page,
    per_page: pageSize,
  })

  const rows       = data?.items ?? []
  const total      = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const hasFilters = hasOrderFilters(filters)

  const handleApply = (next) => { setFilters(next); setPage(1) }
  const handleReset = () => { setFilters(EMPTY_ORDER_FILTERS); setPage(1) }

  const ALL_COLUMNS: CdsTableColumn<DepositOrder>[] = useMemo(
    () => buildOrderColumns({
      variant: 'all', hiddenCols,
      onViewTask, onMarkRefunded: setRefundOrder, t,
    }),
    [hiddenCols, t, onViewTask],
  )

  const toggleableColumns = useMemo(
    () => ALL_COLUMNS.filter(c => !c.frozen && !PINNED_COLS.has(c.key)).map(c => ({ key: c.key, header: c.header })),
    [ALL_COLUMNS],
  )
  const hiddenKeys = useMemo(() => new Set(ALL_COLUMNS.filter(c => c.hidden).map(c => c.key)), [ALL_COLUMNS])
  const toggleColumn = (key: string) => {
    setHiddenCols(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <OrderFilters
        applied={filters}
        onApply={handleApply}
        onReset={handleReset}
        count={total}
        t={t}
      />

      <div className="flex justify-end">
        <ColumnManageButton
          columns={toggleableColumns}
          hiddenKeys={hiddenKeys}
          onToggle={toggleColumn}
          onReorder={setColumnOrder}
          columnOrder={columnOrder}
          t={t}
        />
      </div>

      <CdsTableState isLoading={isLoading} isFetching={isFetching} isError={isError} onRetry={refetch}>
        {rows.length === 0
          ? <CdsStatusState type={hasFilters ? 'no-results' : 'empty'} />
          : (
            <>
              <CdsTable
                columns={ALL_COLUMNS}
                data={rows}
                rowKey="id"
                hover
                stickyHeader
                onRowClick={setDetailOrder}
                columnOrder={columnOrder.length ? columnOrder : undefined}
                onColumnReorder={setColumnOrder}
              />
              <CdsPagination
                page={page}
                totalPages={totalPages}
                onChange={setPage}
                pageSize={pageSize}
                onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
              />
            </>
          )
        }
      </CdsTableState>

      <OrderDetailModal order={detailOrder} open={!!detailOrder} onClose={() => setDetailOrder(null)} t={t} />
      <MarkRefundedModal order={refundOrder} open={!!refundOrder} onClose={() => setRefundOrder(null)} t={t} />
    </div>
  )
}
