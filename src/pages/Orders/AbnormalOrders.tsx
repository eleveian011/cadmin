// @ts-nocheck
import { useState, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { SlidersHorizontal, GripVertical, ExternalLink, AlertTriangle, FilePlus, Undo2, MoreHorizontal } from 'lucide-react'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { useDepositOrders, useAddDepositNote, useMarkDepositRefunded } from '../../services/hooks'
import type { DepositOrder } from '../../types/deposit-order'
import {
  CdsPageHeader, CdsBadge, CdsTable, CdsTableState,
  CdsPagination, CdsFilterPill, CdsFilterPanel,
  CdsCheckbox, CdsButton, CdsDropdownPanel, CdsStatusState,
  CdsNotificationBar, CdsModal, CdsInput, CdsTextarea, useToast,
} from '../../components/cds'
import type { BadgeTone, BreadcrumbItem, CdsTableColumn } from '../../components/cds'

const BREADCRUMBS: BreadcrumbItem[] = [
  { label: 'Orders', to: '/orders' },
  { label: 'Abnormal Orders' },
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

const REASON_TONE: Record<string, BadgeTone> = {
  unidentified:     'danger',
  status_exception: 'warning',
  classification:   'warning',
  missing_fields:   'warning',
  screening_review: 'info',
}

const CHANNEL_TONE: Record<string, BadgeTone> = {
  GLDB: 'primary', SGB: 'info', TransferMate: 'neutral', Tazapay: 'neutral',
}

const SCREENING_TONE: Record<string, BadgeTone> = {
  pass: 'success', pending_review: 'warning', rejected: 'danger', rfi: 'warning',
}

const CHANNEL_OPTIONS = ['GLDB', 'SGB', 'TransferMate', 'Tazapay']
const REASON_OPTIONS  = ['unidentified', 'status_exception', 'classification', 'missing_fields', 'screening_review']
const STATUS_OPTIONS  = ['processing.manual_review', 'pending.rfi_missing_fields']

/* ── Ageing helpers ─────────────────────────────────────────── */

type AgeingTier = 'green' | 'amber' | 'red' | 'purple'

function ageDays(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000)
}

function ageTier(days: number): AgeingTier {
  if (days >= 90) return 'purple'
  if (days >= 30) return 'red'
  if (days >= 7)  return 'amber'
  return 'green'
}

const AGEING_TONE: Record<AgeingTier, BadgeTone> = {
  green: 'success', amber: 'warning', red: 'danger', purple: 'primary',
}

function AgeingBadge({ createdAt }: { createdAt: string }) {
  const days = ageDays(createdAt)
  const label = days === 0 ? 'Today' : days === 1 ? '1d' : `${days}d`
  return <CdsBadge tone={AGEING_TONE[ageTier(days)]}>{label}</CdsBadge>
}

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

const DEFAULT_HIDDEN = new Set(['screening_result', 'ops_handler', 'remarks'])

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
              className="relative flex items-center gap-2 rounded-md px-2 py-1.5 type-body-sm text-(--text) hover:bg-(--item-hover) cursor-grab"
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

/* ─── Row actions (Add Note / Mark Refunded / View in Task Center) ─── */

function RowActions({ row, onAddNote, onMarkRefunded, t }) {
  // Mark as Refunded: only unidentified + processing.manual_review (PRD §7.7.8)
  const canRefund = row.anomalous_reason === 'unidentified' && row.status === 'processing.manual_review'
  const stop = (e, fn) => { e.stopPropagation(); fn(row) }

  return (
    <div className="flex items-center justify-end gap-1">
      {row.task_center_id && (
        <CdsButton variant="text" size="xs" icon={<ExternalLink size={13} />}
          onClick={(e) => { e.stopPropagation(); window.alert(`Open Task Center: ${row.task_center_id}`) }}>
          {t('common.viewInTaskCenter')}
        </CdsButton>
      )}
      <Popover className="relative">
        <PopoverButton as="div">
          <CdsButton variant="text" size="xs" icon={<MoreHorizontal size={15} />} />
        </PopoverButton>
        <PopoverPanel className="absolute right-0 z-50 mt-1">
          {({ close }) => (
            <CdsDropdownPanel className="w-44 p-1.5">
              <button type="button"
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 type-body-sm text-(--text) hover:bg-(--item-hover) cursor-pointer"
                onClick={(e) => { close(); stop(e, onAddNote) }}>
                <FilePlus size={14} /> {t('depositOrder.actions.addNote')}
              </button>
              {canRefund && (
                <button type="button"
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 type-body-sm text-(--text) hover:bg-(--item-hover) cursor-pointer"
                  onClick={(e) => { close(); stop(e, onMarkRefunded) }}>
                  <Undo2 size={14} /> {t('depositOrder.actions.markRefunded')}
                </button>
              )}
            </CdsDropdownPanel>
          )}
        </PopoverPanel>
      </Popover>
    </div>
  )
}

/* ─── Add Note modal ────────────────────────────────────────── */

function AddNoteModal({ order, open, onClose, t }) {
  const toast   = useToast()
  const addNote = useAddDepositNote()
  const [note, setNote] = useState('')

  const handleSave = () => {
    if (!note.trim()) return
    addNote.mutateAsync({ id: order.id, note: note.trim() })
      .then(() => { toast.show(t('depositOrder.toast.noteSaved')); setNote(''); onClose() })
      .catch(e => toast.show(e?.message || 'Failed to save note'))
  }

  return (
    <CdsModal
      open={open}
      onClose={onClose}
      size="md"
      headerMode="close"
      title={t('depositOrder.actions.addNote')}
      footer={[{ label: 'Save', onClick: handleSave, loading: addNote.isPending, disabled: !note.trim() }]}
      dismissOnBackdrop
    >
      <div className="flex flex-col gap-3">
        <div className="type-body-sm text-(--muted)">
          {t('depositOrder.col.transactionId')}: <span className="text-(--text) font-medium">{order?.transaction_id}</span>
        </div>
        <CdsTextarea value={note} onChange={setNote} placeholder={t('depositOrder.notePlaceholder')} />
      </div>
    </CdsModal>
  )
}

/* ─── Mark Refunded modal (PRD §7.7.8) ──────────────────────── */

function MarkRefundedModal({ order, open, onClose, t }) {
  const toast      = useToast()
  const markRefund = useMarkDepositRefunded()
  const [orderNo, setOrderNo] = useState('')
  const [date,    setDate]    = useState(fmtDay(new Date()))
  const [notes,   setNotes]   = useState('')

  const reset = () => { setOrderNo(''); setDate(fmtDay(new Date())); setNotes('') }
  const valid = orderNo.trim() && date

  const handleConfirm = () => {
    if (!valid) return
    markRefund.mutateAsync({
      id: order.id,
      refund_order_number: orderNo.trim(),
      refund_date: date,
      refund_notes: notes.trim() || undefined,
    })
      .then(() => { toast.show(t('depositOrder.toast.refundMarked')); reset(); onClose() })
      .catch(e => toast.show(e?.message || 'Failed to mark refunded'))
  }

  return (
    <CdsModal
      open={open}
      onClose={() => { reset(); onClose() }}
      size="md"
      headerMode="close"
      title={t('depositOrder.actions.markRefunded')}
      footer={[{ label: t('depositOrder.refund.confirm'), onClick: handleConfirm, loading: markRefund.isPending, disabled: !valid }]}
      dismissOnBackdrop
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-md bg-(--fill) px-3 py-2 type-body-sm text-(--muted)">
          {t('depositOrder.refund.intro')}
        </div>
        <div className="flex flex-col gap-3">
          <div className="type-body-sm text-(--muted)">
            {t('depositOrder.col.transactionId')}: <span className="text-(--text) font-medium">{order?.transaction_id}</span>
            <span className="mx-2">·</span>
            {fmtAmount(order?.amount_minor ?? 0)} {order?.currency}
          </div>
          <div>
            <label className="type-caption font-semibold text-(--text) mb-1 block">
              {t('depositOrder.refund.orderNumber')} <span className="text-(--danger)">*</span>
            </label>
            <CdsInput value={orderNo} onChange={e => setOrderNo(e.target.value)} onClear={() => setOrderNo('')} placeholder="RFND-…" size="md" />
          </div>
          <div>
            <label className="type-caption font-semibold text-(--text) mb-1 block">
              {t('depositOrder.refund.date')} <span className="text-(--danger)">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full rounded-md border border-(--border) bg-(--surface) px-3 py-2 type-body text-(--text) outline-none focus:border-(--accent)"
            />
          </div>
          <div>
            <label className="type-caption font-semibold text-(--text) mb-1 block">{t('depositOrder.refund.notes')}</label>
            <CdsTextarea value={notes} onChange={setNotes} placeholder={t('depositOrder.refund.notesPlaceholder')} />
          </div>
        </div>
      </div>
    </CdsModal>
  )
}

/* ─── Page ──────────────────────────────────────────────────── */

const PER_PAGE_DEFAULT = 20

export default function AbnormalOrders({ embedded = false }: { embedded?: boolean }) {
  const { t } = useTranslation()

  const [reasonFilter,  setReasonFilter]  = useState([])
  const [channelFilter, setChannelFilter] = useState([])
  const [statusFilter,  setStatusFilter]  = useState([])
  const [page,          setPage]          = useState(1)
  const [pageSize,      setPageSize]      = useState(PER_PAGE_DEFAULT)

  const [draftReason,  setDraftReason]  = useState([])
  const [draftChannel, setDraftChannel] = useState([])
  const [draftStatus,  setDraftStatus]  = useState([])

  const [columnOrder, setColumnOrder] = useState([])
  const [hiddenCols,  setHiddenCols]  = useState(new Set(DEFAULT_HIDDEN))

  // Row action modals
  const [noteOrder,   setNoteOrder]   = useState<DepositOrder | null>(null)
  const [refundOrder, setRefundOrder] = useState<DepositOrder | null>(null)

  const hasFilters = reasonFilter.length || channelFilter.length || statusFilter.length

  const { data, isLoading, isFetching, isError, refetch } = useDepositOrders({
    anomalous: true,
    reason:  reasonFilter.join(',')  || undefined,
    channel: channelFilter.join(',') || undefined,
    status:  statusFilter.join(',')  || undefined,
    page,
    per_page: pageSize,
  })

  const rows       = data?.items ?? []
  const total      = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const escalatingCount = useMemo(
    () => rows.filter(r => ageDays(r.created_at) >= 60).length,
    [rows],
  )

  const handleReset = () => {
    setReasonFilter([]); setChannelFilter([]); setStatusFilter([])
    setDraftReason([]); setDraftChannel([]); setDraftStatus([])
    setPage(1)
  }

  /* ── columns ─────────────────────────────────────────────── */
  const ALL_COLUMNS: CdsTableColumn<DepositOrder>[] = useMemo(() => [
    {
      key: 'transaction_id',
      header: t('depositOrder.col.transactionId'),
      width: '180px',
      frozen: 'left',
      render: (_, row) => (
        <span className="type-body font-medium text-(--accent) cursor-pointer hover:underline">{row.transaction_id}</span>
      ),
    },
    { key: 'ageing', header: 'Ageing', width: '80px', render: (_, row) => <AgeingBadge createdAt={row.created_at} /> },
    {
      key: 'anomalous_reason',
      header: t('depositOrder.col.anomalousReason'),
      width: '200px',
      render: (_, row) => row.anomalous_reason ? (
        <CdsBadge tone={REASON_TONE[row.anomalous_reason] ?? 'warning'}>{t(`depositOrder.anomalousReason.${row.anomalous_reason}`)}</CdsBadge>
      ) : <span className="text-(--subtle)">—</span>,
    },
    {
      key: 'payment_channel',
      header: t('depositOrder.col.paymentChannel'),
      width: '130px',
      hidden: hiddenCols.has('payment_channel'),
      render: (_, row) => <CdsBadge tone={CHANNEL_TONE[row.payment_channel] ?? 'neutral'}>{row.payment_channel}</CdsBadge>,
    },
    {
      key: 'amount',
      header: t('depositOrder.col.amount'),
      width: '160px',
      align: 'right',
      hidden: hiddenCols.has('amount'),
      render: (_, row) => <span className="type-body tabular-nums">{fmtAmount(row.amount_minor)}&nbsp;{row.currency}</span>,
    },
    {
      key: 'sender_name', header: t('depositOrder.col.senderName'), width: '180px',
      hidden: hiddenCols.has('sender_name'),
      render: (_, row) => row.sender_name ?? <span className="text-(--subtle)">—</span>,
    },
    {
      key: 'sender_account', header: t('depositOrder.col.senderAccount'), width: '180px',
      hidden: hiddenCols.has('sender_account'),
      render: (_, row) => <span className="type-body-sm text-(--muted) tabular-nums">{row.sender_account ?? '—'}</span>,
    },
    {
      key: 'sender_bank_swift', header: t('depositOrder.col.senderSwift'), width: '130px',
      hidden: hiddenCols.has('sender_bank_swift'),
      render: (_, row) => <span className="type-body-sm text-(--muted) tabular-nums">{row.sender_bank_swift ?? '—'}</span>,
    },
    {
      key: 'sender_bank_name', header: t('depositOrder.col.senderBankName'), width: '180px',
      hidden: hiddenCols.has('sender_bank_name'),
      render: (_, row) => row.sender_bank_name ?? <span className="text-(--subtle)">—</span>,
    },
    {
      key: 'beneficiary_name', header: t('depositOrder.col.beneficiaryName'), width: '180px',
      hidden: hiddenCols.has('beneficiary_name'),
      render: (_, row) => row.beneficiary_name ?? <span className="text-(--danger-text) italic">Unidentified</span>,
    },
    {
      key: 'beneficiary_code', header: t('depositOrder.col.beneficiaryCode'), width: '150px',
      hidden: hiddenCols.has('beneficiary_code'),
      render: (_, row) => <span className="type-body-sm text-(--muted)">{row.beneficiary_code ?? '—'}</span>,
    },
    {
      key: 'reference_code', header: t('depositOrder.col.referenceCode'), width: '150px',
      hidden: hiddenCols.has('reference_code'),
      render: (_, row) => <span className="type-body-sm tabular-nums text-(--muted)">{row.reference_code ?? '—'}</span>,
    },
    {
      key: 'matched_rule_step', header: t('depositOrder.col.matchedRuleStep'), width: '120px',
      hidden: hiddenCols.has('matched_rule_step'),
      render: (_, row) => row.matched_rule_step != null
        ? <span className="type-body-sm text-(--muted)">Step {row.matched_rule_step}</span>
        : <span className="text-(--subtle)">—</span>,
    },
    {
      key: 'status', header: t('depositOrder.col.status'), width: '200px',
      hidden: hiddenCols.has('status'),
      render: (_, row) => {
        const key = row.status.replaceAll('.', '_')
        return <CdsBadge tone={STATUS_TONE[row.status] ?? 'neutral'}>{t(`depositOrder.status.${key}`)}</CdsBadge>
      },
    },
    {
      key: 'screening_result', header: t('depositOrder.col.screeningResult'), width: '150px',
      hidden: hiddenCols.has('screening_result'),
      render: (_, row) => row.screening_result ? (
        <CdsBadge tone={SCREENING_TONE[row.screening_result] ?? 'neutral'}>{t(`depositOrder.screening.${row.screening_result}`)}</CdsBadge>
      ) : <span className="text-(--subtle)">—</span>,
    },
    {
      key: 'value_date', header: t('depositOrder.col.valueDate'), width: '120px',
      hidden: hiddenCols.has('value_date'),
      render: (_, row) => <span className="type-body-sm tabular-nums">{row.value_date ?? '—'}</span>,
    },
    {
      key: 'ops_handler', header: t('depositOrder.col.opsHandler'), width: '140px',
      hidden: hiddenCols.has('ops_handler'),
      render: (_, row) => row.ops_handler ?? <span className="text-(--subtle)">—</span>,
    },
    {
      key: 'remarks', header: t('depositOrder.col.remarks'), width: '220px',
      hidden: hiddenCols.has('remarks'),
      render: (_, row) => <span className="type-body-sm text-(--muted) line-clamp-2">{row.remarks ?? '—'}</span>,
    },
    {
      key: 'created_at', header: t('depositOrder.col.createdAt'), width: '160px',
      hidden: hiddenCols.has('created_at'),
      render: (_, row) => <span className="type-body-sm text-(--subtle) tabular-nums">{fmtDate(row.created_at)}</span>,
    },
    // ── Frozen right: row actions ─────────────────────────────────────────
    {
      key: '_actions',
      header: '',
      width: '1%',
      frozen: 'right',
      render: (_, row) => (
        <RowActions row={row} onAddNote={setNoteOrder} onMarkRefunded={setRefundOrder} t={t} />
      ),
    },
  ], [hiddenCols, t])

  const toggleableColumns = useMemo(
    () => ALL_COLUMNS.filter(c => !c.frozen && c.key !== 'ageing' && c.key !== 'anomalous_reason').map(c => ({ key: c.key, header: c.header })),
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

  const reasonOptionsList = REASON_OPTIONS.map(r => ({ value: r, label: t(`depositOrder.anomalousReason.${r}`) }))
  const statusOptionsList = STATUS_OPTIONS.map(s => ({ value: s, label: t(`depositOrder.status.${s.replaceAll('.', '_')}`) }))

  return (
    <div className="flex flex-col gap-4">
      {!embedded && (
        <CdsPageHeader
          breadcrumb={BREADCRUMBS}
          title={t('depositOrder.pageTitle.abnormal')}
          subtitle={t('depositOrder.pageSubtitle.abnormal')}
        />
      )}

      {escalatingCount > 0 && (
        <CdsNotificationBar tone="danger">
          <span className="inline-flex items-center gap-2">
            <AlertTriangle size={15} />
            {escalatingCount} record{escalatingCount > 1 ? 's' : ''} approaching or past the 90-day mandatory review deadline — action required.
          </span>
        </CdsNotificationBar>
      )}

      <CdsFilterPanel
        active={!!hasFilters}
        count={total}
        onClear={handleReset}
        trailing={
          <ColumnManageButton
            columns={toggleableColumns}
            hiddenKeys={hiddenKeys}
            onToggle={toggleColumn}
            onReorder={setColumnOrder}
            columnOrder={columnOrder}
          />
        }
      >
        <CdsFilterPill
          title="Reason"
          value={reasonFilter.length ? `${reasonFilter.length} selected` : null}
          onClear={() => { setReasonFilter([]); setDraftReason([]); setPage(1) }}
        >
          {({ close }) => (
            <MultiCheckList label="Anomaly Reason" options={reasonOptionsList} draft={draftReason} setDraft={setDraftReason} close={close} onApply={() => { setReasonFilter(draftReason); setPage(1) }} />
          )}
        </CdsFilterPill>

        <CdsFilterPill
          title="Channel"
          value={channelFilter.length ? channelFilter.join(', ') : null}
          onClear={() => { setChannelFilter([]); setDraftChannel([]); setPage(1) }}
        >
          {({ close }) => (
            <MultiCheckList label="Payment Channel" options={CHANNEL_OPTIONS.map(c => ({ value: c, label: c }))} draft={draftChannel} setDraft={setDraftChannel} close={close} onApply={() => { setChannelFilter(draftChannel); setPage(1) }} />
          )}
        </CdsFilterPill>

        <CdsFilterPill
          title="Status"
          value={statusFilter.length ? `${statusFilter.length} selected` : null}
          onClear={() => { setStatusFilter([]); setDraftStatus([]); setPage(1) }}
        >
          {({ close }) => (
            <MultiCheckList label="Status" options={statusOptionsList} draft={draftStatus} setDraft={setDraftStatus} close={close} onApply={() => { setStatusFilter(draftStatus); setPage(1) }} />
          )}
        </CdsFilterPill>
      </CdsFilterPanel>

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

      <AddNoteModal      order={noteOrder}   open={!!noteOrder}   onClose={() => setNoteOrder(null)}   t={t} />
      <MarkRefundedModal order={refundOrder} open={!!refundOrder} onClose={() => setRefundOrder(null)} t={t} />
    </div>
  )
}
