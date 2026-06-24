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

const PER_PAGE_DEFAULT = 20

// Abnormal tab leans on ops-detail columns; hide only the long tail by default.
const DEFAULT_HIDDEN = new Set([
  'sub_status', 'transaction_type', 'order_category', 'bank_transfer_type',
  'channel_account_no', 'account_type', 'credited_amount', 'channel_fee_amount', 'service_fee_amount',
  'sender_account_no', 'sender_bank_name', 'sender_bank_swift_bic',
  'sender_bank_country', 'sender_country', 'payment_reference',
  'recipient_account_no', 'recipient_bank_name', 'recipient_bank_swift_bic',
  'reference_code', 'matched_rule_step', 'screening_result', 'value_date', 'credit_date',
  'ops_handler', 'remarks', 'created_at', 'updated_at',
])
const PINNED_COLS = new Set(['transaction_id', '_actions', 'ageing', 'internal_reason'])

export default function AbnormalOrders({ embedded = false }: { embedded?: boolean }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [filters,  setFilters]  = useState(EMPTY_ORDER_FILTERS)
  const [page,     setPage]     = useState(1)
  const [pageSize, setPageSize] = useState(PER_PAGE_DEFAULT)

  const [columnOrder, setColumnOrder] = useState([])
  const [hiddenCols,  setHiddenCols]  = useState(new Set(DEFAULT_HIDDEN))

  const [detailOrder, setDetailOrder] = useState<DepositOrder | null>(null)

  const onViewTask = useCallback((row: DepositOrder) => {
    if (row.task_center_id) navigate(`/task-center?task=${encodeURIComponent(row.task_center_id)}`)
  }, [navigate])

  const { data, isLoading, isFetching, isError, refetch } = useDepositOrders({
    anomalous: true,
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
      variant: 'abnormal', hiddenCols,
      onViewTask, t,
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
    </div>
  )
}
