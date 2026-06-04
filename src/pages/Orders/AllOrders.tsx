// @ts-nocheck
import { useState, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, SlidersHorizontal, GripVertical } from 'lucide-react'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { useDepositOrders, useExport } from '../../services/hooks'
import type { DepositOrder } from '../../types/deposit-order'
import {
  CdsPageHeader, CdsBadge, CdsTable, CdsTableState,
  CdsPagination, CdsFilterPill, CdsFilterPanel,
  CdsCheckbox, CdsButton, CdsDropdownPanel,
  CdsModal, CdsStackedListbox, CdsDateRangePicker,
  CdsStatusState, useToast,
} from '../../components/cds'
import type { BadgeTone, BreadcrumbItem, CdsTableColumn } from '../../components/cds'

const BREADCRUMBS: BreadcrumbItem[] = [
  { label: 'Orders', to: '/orders/all' },
  { label: 'All Orders' },
]

const STATUS_TONE: Record<string, BadgeTone> = {
  'processing.auto':            'info',
  'processing.manual_review':   'warning',
  'processing.deferred':        'neutral',
  'pending.rfi_missing_fields': 'warning',
  'pending.rfi_screening':      'warning',
  'successful':                 'success',
  'failed':                     'danger',
  'refunding':                  'neutral',
  'refunded':                   'neutral',
}

const CHANNEL_TONE: Record<string, BadgeTone> = {
  GLDB:         'primary',
  SGB:          'info',
  TransferMate: 'neutral',
  Tazapay:      'neutral',
}

const SCREENING_TONE: Record<string, BadgeTone> = {
  pass:           'success',
  pending_review: 'warning',
  rejected:       'danger',
  rfi:            'warning',
}

const CHANNEL_OPTIONS  = ['GLDB', 'SGB', 'TransferMate', 'Tazapay']
const STATUS_OPTIONS   = [
  'processing.auto', 'processing.manual_review', 'processing.deferred',
  'pending.rfi_missing_fields', 'pending.rfi_screening',
  'successful', 'failed', 'refunding', 'refunded',
]
const PARTY_OPTIONS    = ['1st_party', '3rd_party', 'unclassified']

const EXPORT_STATUS_OPTS = [
  { value: 'all', label: 'All statuses' },
  { value: 'successful', label: 'Successful' },
  { value: 'processing.auto', label: 'Processing (Auto)' },
  { value: 'processing.manual_review', label: 'Processing (Manual)' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
]

function fmtAmount(minor: number): string {
  return new Intl.NumberFormat('en-SG', { minimumFractionDigits: 2 }).format(minor / 100)
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-SG', {
    timeZone: 'Asia/Singapore',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

function fmtDay(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const DEFAULT_HIDDEN = new Set(['screening_result', 'ops_handler', 'remarks', 'created_at'])

/* ─── Column manager ────────────────────────────────────────── */

function ColumnManageButton({ columns, hiddenKeys, onToggle, onReorder, columnOrder }) {
  const dragRef = useRef(null)
  const [dragOver, setDragOver] = useState(null)

  const sorted = useMemo(() => {
    if (!columnOrder?.length) return columns
    const orderMap = new Map(columnOrder.map((key, idx) => [key, idx]))
    return [...columns].sort((a, b) => (orderMap.get(a.key) ?? Infinity) - (orderMap.get(b.key) ?? Infinity))
  }, [columns, columnOrder])

  const handleDrop = (targetKey) => {
    const src = dragRef.current
    dragRef.current = null
    setDragOver(null)
    if (!src || src === targetKey) return
    const order = sorted.map(c => c.key)
    const si = order.indexOf(src), ti = order.indexOf(targetKey)
    if (si === -1 || ti === -1) return
    order.splice(si, 1)
    order.splice(ti, 0, src)
    onReorder(order)
  }

  return (
    <Popover className="relative">
      <PopoverButton as="div">
        <CdsButton variant="text" size="xs" icon={<SlidersHorizontal size={14} />}>Manage Columns</CdsButton>
      </PopoverButton>
      <PopoverPanel className="absolute right-0 z-50 mt-1">
        <CdsDropdownPanel className="w-52 p-2">
          {sorted.map(col => (
            <div
              key={col.key}
              draggable
              onDragStart={() => { dragRef.current = col.key }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(col.key) }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => { e.preventDefault(); handleDrop(col.key) }}
              onDragEnd={() => { dragRef.current = null; setDragOver(null) }}
              className={`relative flex items-center gap-2 rounded-md px-2 py-1.5 type-body-sm text-(--text) hover:bg-(--item-hover) cursor-grab`}
            >
              {dragOver === col.key && <span className="absolute top-0 left-2 right-2 h-0.5 bg-(--accent) rounded-full" />}
              <CdsCheckbox checked={!hiddenKeys.has(col.key)} onChange={() => onToggle(col.key)} />
              <span className="flex-1">{col.header}</span>
              <GripVertical size={12} className="text-(--muted) shrink-0" />
            </div>
          ))}
        </CdsDropdownPanel>
      </PopoverPanel>
    </Popover>
  )
}

/* ─── Multi-select filter pill content ─────────────────────── */

function MultiCheckList({ options, draft, setDraft, label, close, onApply }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="type-body font-bold text-(--text)">{label}</span>
      <div className="flex flex-col gap-0.5 max-h-52 overflow-y-auto">
        {options.map(({ value, label: optLabel }) => (
          <label key={value} className="flex items-center gap-2 rounded-md px-2 py-1.5 type-body-sm text-(--text) hover:bg-(--item-hover) cursor-pointer">
            <CdsCheckbox
              checked={draft.includes(value)}
              onChange={() => setDraft(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value])}
            />
            {optLabel}
          </label>
        ))}
      </div>
      <CdsButton variant="primary" size="sm" className="w-full" onClick={() => { onApply(); close() }}>Apply</CdsButton>
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────────── */

const PER_PAGE_DEFAULT = 20

export default function AllOrders({ embedded = false }: { embedded?: boolean }) {
  const { t } = useTranslation()
  const toast  = useToast()
  const exportMutation = useExport()

  // committed filters
  const [channelFilter, setChannelFilter] = useState([])
  const [statusFilter,  setStatusFilter]  = useState([])
  const [partyFilter,   setPartyFilter]   = useState([])
  const [dateRange,     setDateRange]     = useState({ from: null, to: null })
  const [page,          setPage]          = useState(1)
  const [pageSize,      setPageSize]      = useState(PER_PAGE_DEFAULT)

  // draft filters (inside pills before Apply)
  const [draftChannel, setDraftChannel] = useState([])
  const [draftStatus,  setDraftStatus]  = useState([])
  const [draftParty,   setDraftParty]   = useState([])
  const [draftDate,    setDraftDate]    = useState({ from: null, to: null })

  // export modal state
  const today          = new Date()
  const thirtyDaysAgo  = new Date(today.getTime() - 29 * 86400000)
  const [exportOpen,        setExportOpen]        = useState(false)
  const [exportStatus,      setExportStatus]      = useState('all')
  const [exportDateRange,   setExportDateRange]   = useState({ from: fmtDay(thirtyDaysAgo), to: fmtDay(today) })
  const [exportError,       setExportError]       = useState('')

  // column manage
  const [columnOrder,  setColumnOrder]  = useState([])
  const [hiddenCols,   setHiddenCols]   = useState(new Set(DEFAULT_HIDDEN))

  const hasFilters = channelFilter.length || statusFilter.length || partyFilter.length || dateRange.from

  const { data, isLoading, isFetching, isError, refetch } = useDepositOrders({
    channel:  channelFilter.join(',') || undefined,
    status:   statusFilter.join(',')  || undefined,
    party:    partyFilter.join(',')   || undefined,
    page,
    per_page: pageSize,
  })

  const total      = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const handleReset = () => {
    setChannelFilter([]); setStatusFilter([]); setPartyFilter([]); setDateRange({ from: null, to: null })
    setDraftChannel([]); setDraftStatus([]); setDraftParty([]); setDraftDate({ from: null, to: null })
    setPage(1)
  }

  const handleExport = () => {
    if (!exportDateRange.from || !exportDateRange.to) {
      toast.show('Please select a date range before exporting')
      return
    }
    setExportError('')
    const filters: Record<string, string> = { from: exportDateRange.from, to: exportDateRange.to }
    if (exportStatus !== 'all') filters.status = exportStatus
    exportMutation.mutate(
      { type: 'deposit', filters },
      {
        onSuccess: (result) => {
          if (result.download_url) window.open(result.download_url, '_blank')
          setExportOpen(false)
          toast.show('Export ready')
        },
        onError: (err) => setExportError(err?.message ?? 'Export failed'),
      }
    )
  }

  /* ── columns ─────────────────────────────────────────────── */
  const ALL_COLUMNS: CdsTableColumn<DepositOrder>[] = useMemo(() => [
    {
      key: 'transaction_id',
      header: t('depositOrder.col.transactionId'),
      width: '180px',
      frozen: 'left',
      render: (_, row) => (
        <span className="type-body font-medium text-(--accent) cursor-pointer hover:underline">
          {row.transaction_id}
        </span>
      ),
    },
    {
      key: 'payment_channel',
      header: t('depositOrder.col.paymentChannel'),
      width: '130px',
      hidden: hiddenCols.has('payment_channel'),
      render: (_, row) => (
        <CdsBadge tone={CHANNEL_TONE[row.payment_channel] ?? 'neutral'}>{row.payment_channel}</CdsBadge>
      ),
    },
    {
      key: 'amount',
      header: t('depositOrder.col.amount'),
      width: '160px',
      align: 'right',
      hidden: hiddenCols.has('amount'),
      render: (_, row) => (
        <span className="type-body tabular-nums">{fmtAmount(row.amount_minor)}&nbsp;{row.currency}</span>
      ),
    },
    {
      key: 'value_date',
      header: t('depositOrder.col.valueDate'),
      width: '120px',
      hidden: hiddenCols.has('value_date'),
      render: (_, row) => <span className="type-body-sm tabular-nums">{row.value_date ?? '—'}</span>,
    },
    {
      key: 'credit_date',
      header: t('depositOrder.col.creditDate'),
      width: '160px',
      hidden: hiddenCols.has('credit_date'),
      render: (_, row) => <span className="type-body-sm tabular-nums text-(--muted)">{fmtDate(row.credit_date)}</span>,
    },
    {
      key: 'sender_name',
      header: t('depositOrder.col.senderName'),
      width: '180px',
      hidden: hiddenCols.has('sender_name'),
      render: (_, row) => row.sender_name ?? <span className="text-(--subtle)">—</span>,
    },
    {
      key: 'sender_account',
      header: t('depositOrder.col.senderAccount'),
      width: '180px',
      hidden: hiddenCols.has('sender_account'),
      render: (_, row) => <span className="type-body-sm text-(--muted) tabular-nums">{row.sender_account ?? '—'}</span>,
    },
    {
      key: 'sender_bank_swift',
      header: t('depositOrder.col.senderSwift'),
      width: '130px',
      hidden: hiddenCols.has('sender_bank_swift'),
      render: (_, row) => <span className="type-body-sm text-(--muted) tabular-nums">{row.sender_bank_swift ?? '—'}</span>,
    },
    {
      key: 'sender_bank_name',
      header: t('depositOrder.col.senderBankName'),
      width: '180px',
      hidden: hiddenCols.has('sender_bank_name'),
      render: (_, row) => row.sender_bank_name ?? <span className="text-(--subtle)">—</span>,
    },
    {
      key: 'beneficiary_name',
      header: t('depositOrder.col.beneficiaryName'),
      width: '180px',
      hidden: hiddenCols.has('beneficiary_name'),
      render: (_, row) => row.beneficiary_name
        ?? <span className="text-(--danger-text) italic">Unidentified</span>,
    },
    {
      key: 'beneficiary_account',
      header: t('depositOrder.col.beneficiaryAccount'),
      width: '160px',
      hidden: hiddenCols.has('beneficiary_account'),
      render: (_, row) => <span className="type-body-sm text-(--muted) tabular-nums">{row.beneficiary_account ?? '—'}</span>,
    },
    {
      key: 'reference_code',
      header: t('depositOrder.col.referenceCode'),
      width: '150px',
      hidden: hiddenCols.has('reference_code'),
      render: (_, row) => <span className="type-body-sm tabular-nums text-(--muted)">{row.reference_code ?? '—'}</span>,
    },
    {
      key: 'party_classification',
      header: t('depositOrder.col.partyClassification'),
      width: '120px',
      hidden: hiddenCols.has('party_classification'),
      render: (_, row) => (
        <span className="type-body-sm text-(--muted)">{t(`depositOrder.party.${row.party_classification}`)}</span>
      ),
    },
    {
      key: 'status',
      header: t('depositOrder.col.status'),
      width: '170px',
      hidden: hiddenCols.has('status'),
      render: (_, row) => {
        const key = row.status.replaceAll('.', '_')
        return <CdsBadge tone={STATUS_TONE[row.status] ?? 'neutral'}>{t(`depositOrder.status.${key}`)}</CdsBadge>
      },
    },
    {
      key: 'matched_rule_step',
      header: t('depositOrder.col.matchedRuleStep'),
      width: '120px',
      hidden: hiddenCols.has('matched_rule_step'),
      render: (_, row) => row.matched_rule_step != null
        ? <span className="type-body-sm text-(--muted)">Step {row.matched_rule_step}</span>
        : <span className="text-(--subtle)">—</span>,
    },
    {
      key: 'screening_result',
      header: t('depositOrder.col.screeningResult'),
      width: '150px',
      hidden: hiddenCols.has('screening_result'),
      render: (_, row) => row.screening_result ? (
        <CdsBadge tone={SCREENING_TONE[row.screening_result] ?? 'neutral'}>
          {t(`depositOrder.screening.${row.screening_result}`)}
        </CdsBadge>
      ) : <span className="text-(--subtle)">—</span>,
    },
    {
      key: 'ops_handler',
      header: t('depositOrder.col.opsHandler'),
      width: '140px',
      hidden: hiddenCols.has('ops_handler'),
      render: (_, row) => row.ops_handler ?? <span className="text-(--subtle)">—</span>,
    },
    {
      key: 'remarks',
      header: t('depositOrder.col.remarks'),
      width: '220px',
      hidden: hiddenCols.has('remarks'),
      render: (_, row) => <span className="type-body-sm text-(--muted) line-clamp-2">{row.remarks ?? '—'}</span>,
    },
    {
      key: 'created_at',
      header: t('depositOrder.col.createdAt'),
      width: '160px',
      hidden: hiddenCols.has('created_at'),
      render: (_, row) => <span className="type-body-sm text-(--subtle) tabular-nums">{fmtDate(row.created_at)}</span>,
    },
  ], [hiddenCols, t])

  const toggleableColumns = useMemo(
    () => ALL_COLUMNS.filter(c => !c.frozen).map(c => ({ key: c.key, header: c.header })),
    [ALL_COLUMNS],
  )

  const hiddenKeys = useMemo(
    () => new Set(ALL_COLUMNS.filter(c => c.hidden).map(c => c.key)),
    [ALL_COLUMNS],
  )

  const toggleColumn = (key: string) => {
    setHiddenCols(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  /* ── option labels ──────────────────────────────────────── */
  const statusOptionsList = STATUS_OPTIONS.map(s => ({
    value: s,
    label: t(`depositOrder.status.${s.replaceAll('.', '_')}`),
  }))
  const partyOptionsList = PARTY_OPTIONS.map(p => ({
    value: p,
    label: t(`depositOrder.party.${p}`),
  }))

  /* ── filter pill labels ─────────────────────────────────── */
  const channelPillLabel = channelFilter.length ? channelFilter.join(', ') : null
  const statusPillLabel  = statusFilter.length  ? `${statusFilter.length} selected`  : null
  const partyPillLabel   = partyFilter.length   ? `${partyFilter.length} selected`   : null
  const datePillLabel    = dateRange.from ? `${dateRange.from}${dateRange.to ? ' → ' + dateRange.to : ''}` : null

  return (
    <div className="flex flex-col gap-4">
      {!embedded && (
        <CdsPageHeader
          breadcrumb={BREADCRUMBS}
          title={t('depositOrder.pageTitle.all')}
          subtitle={t('depositOrder.pageSubtitle.all')}
          actions={
            <CdsButton variant="subtle" size="sm" icon={<Download size={14} />} onClick={() => setExportOpen(true)}>
              Export
            </CdsButton>
          }
        />
      )}

      {/* Export modal */}
      <CdsModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        size="md"
        headerMode="close"
        title="Export Deposit Orders"
        footer={[{
          label: exportMutation.isPending ? 'Generating…' : 'Export',
          onClick: handleExport,
          loading: exportMutation.isPending,
        }]}
        dismissOnBackdrop
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="type-caption font-semibold text-(--text) mb-1 block">
              Date Range <span className="text-(--danger)">*</span>
            </label>
            <CdsDateRangePicker size="md" value={exportDateRange} onChange={setExportDateRange} />
          </div>
          <div>
            <label className="type-caption font-semibold text-(--text) mb-1 block">Status</label>
            <CdsStackedListbox size="md" buttonWidthClass="w-full" value={exportStatus} onChange={setExportStatus} options={EXPORT_STATUS_OPTS} />
          </div>
          {exportError && <span className="type-body-sm text-(--danger)">{exportError}</span>}
        </div>
      </CdsModal>

      <CdsFilterPanel
        active={!!hasFilters}
        count={total}
        onClear={handleReset}
        trailing={
          <div className="flex items-center gap-2">
            {embedded && (
              <CdsButton variant="subtle" size="xs" icon={<Download size={13} />} onClick={() => setExportOpen(true)}>
                Export
              </CdsButton>
            )}
            <ColumnManageButton
              columns={toggleableColumns}
              hiddenKeys={hiddenKeys}
              onToggle={toggleColumn}
              onReorder={setColumnOrder}
              columnOrder={columnOrder}
            />
          </div>
        }
      >
        <CdsFilterPill
          title="Channel"
          value={channelPillLabel}
          onClear={() => { setChannelFilter([]); setDraftChannel([]); setPage(1) }}
        >
          {({ close }) => (
            <MultiCheckList
              label="Payment Channel"
              options={CHANNEL_OPTIONS.map(c => ({ value: c, label: c }))}
              draft={draftChannel}
              setDraft={setDraftChannel}
              close={close}
              onApply={() => { setChannelFilter(draftChannel); setPage(1) }}
            />
          )}
        </CdsFilterPill>

        <CdsFilterPill
          title="Status"
          value={statusPillLabel}
          onClear={() => { setStatusFilter([]); setDraftStatus([]); setPage(1) }}
        >
          {({ close }) => (
            <MultiCheckList
              label="Status"
              options={statusOptionsList}
              draft={draftStatus}
              setDraft={setDraftStatus}
              close={close}
              onApply={() => { setStatusFilter(draftStatus); setPage(1) }}
            />
          )}
        </CdsFilterPill>

        <CdsFilterPill
          title="Party Type"
          value={partyPillLabel}
          onClear={() => { setPartyFilter([]); setDraftParty([]); setPage(1) }}
        >
          {({ close }) => (
            <MultiCheckList
              label="Party Type"
              options={partyOptionsList}
              draft={draftParty}
              setDraft={setDraftParty}
              close={close}
              onApply={() => { setPartyFilter(draftParty); setPage(1) }}
            />
          )}
        </CdsFilterPill>

        <CdsFilterPill
          title="Date"
          value={datePillLabel}
          onClear={() => { setDateRange({ from: null, to: null }); setDraftDate({ from: null, to: null }); setPage(1) }}
        >
          {({ close }) => (
            <div className="flex flex-col gap-3">
              <span className="type-body font-bold text-(--text)">Date Range</span>
              <CdsDateRangePicker size="md" value={draftDate} onChange={setDraftDate} />
              <CdsButton variant="primary" size="sm" className="w-full" onClick={() => { setDateRange(draftDate); setPage(1); close() }}>Apply</CdsButton>
            </div>
          )}
        </CdsFilterPill>
      </CdsFilterPanel>

      <CdsTableState isLoading={isLoading} isFetching={isFetching} isError={isError} onRetry={refetch}>
        {(data?.items ?? []).length === 0
          ? <CdsStatusState type={hasFilters ? 'no-results' : 'empty'} />
          : (
            <>
              <CdsTable
                columns={ALL_COLUMNS}
                data={data?.items ?? []}
                rowKey="id"
                hover
                stickyHeader
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
    </div>
  )
}
