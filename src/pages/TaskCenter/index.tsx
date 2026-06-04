// @ts-nocheck
import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  FileSearch, FileX, CheckCircle2,
  Ban, RotateCcw, ExternalLink, Undo2, Info,
  ChevronDown, ChevronUp,
} from 'lucide-react'
import {
  CdsPageHeader, CdsPillTabs,
  CdsCard, CdsStatusTag, CdsButton, CdsRadio,
  CdsInput, CdsStatusState, CdsStackedListbox, CdsDateRangePicker,
  CdsTable, CdsTableState, CdsPagination,
  CdsDrawer, CdsDetailList, CdsDetailRow,
  CdsDialog, CdsTextarea, CdsCopyButton, CdsBadge, CdsSpinner, CdsModal, CdsInlineStatus, useToast,
} from '../../components/cds'
import type { BreadcrumbItem, CdsTableColumn, CdsDateRangeValue } from '../../components/cds'
import {
  useTasks, useTaskBadgeCount, useTaskDetail, useClaimTask, useUnclaimTask,
  useAddTaskNote, useDepositOrder, useClientSearch,
  useConfirmRecipient, useRetryTask, useClassifyTask, useFillFields,
  useRejectRefund, useApproveScreening, useCloseNoAction,
  useMarkDepositRefunded, useEligibleAssignees, useReassignTask,
} from '../../services/hooks'
import { listAssignees } from '../../services/store'
import type { DepositTask, DepositTaskType, TaskStatus, AccountStatus, MatchPriority } from '../../types/task'

const BREADCRUMBS: BreadcrumbItem[] = [{ label: 'Task Center' }]

/* ─── Task type metadata ────────────────────────────────────── */

const STATUS_TONE: Record<TaskStatus, 'warning' | 'primary' | 'success' | 'neutral'> = {
  PENDING:     'warning',
  IN_PROGRESS: 'primary',
  COMPLETED:   'success',
  CANCELLED:   'neutral',
}

const ACCOUNT_STATUS_TONE: Record<AccountStatus, 'warning' | 'danger'> = {
  initial:   'warning',
  suspended: 'warning',
  closed:    'danger',
}

const MATCH_PRIORITY_TONE: Record<MatchPriority, 'danger' | 'warning' | 'primary' | 'neutral'> = {
  highest: 'danger',
  high:    'primary',
  medium:  'warning',
  low:     'neutral',
}

/* ─── Helpers ───────────────────────────────────────────────── */

// Urgency model (hours since created): >48h urgent (red), >24h warning (amber), else normal.
const URGENT_HOURS  = 48
const WARNING_HOURS = 24

function ageHours(createdAt: string): number {
  return (Date.now() - new Date(createdAt).getTime()) / 3_600_000
}

type Urgency = 'normal' | 'warning' | 'urgent'
function urgencyTier(createdAt: string): Urgency {
  const h = ageHours(createdAt)
  if (h >= URGENT_HOURS)  return 'urgent'
  if (h >= WARNING_HOURS) return 'warning'
  return 'normal'
}

/** Elapsed wait, precise to the minute, no zero-padding (e.g. "2d 4h 32m", "5h 2m", "47m"). */
function formatWait(createdAt: string): string {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60_000))
  const d    = Math.floor(mins / 1440)
  const h    = Math.floor((mins % 1440) / 60)
  const m    = mins % 60
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function fmtDateTime(iso: string): string {
  const d   = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fmtAmount(minor: number): string {
  return new Intl.NumberFormat('en-SG', { minimumFractionDigits: 2 }).format(minor / 100)
}

function fmtDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/* ─── Urgency ribbon (card) ──────────────────────────────────── */
// Informational only. Shows when a task has waited past the warning threshold.

function AgeingTab({ createdAt, status }) {
  if (status === 'COMPLETED' || status === 'CANCELLED') return null
  const tier = urgencyTier(createdAt)
  if (tier === 'normal') return null

  const urgent = tier === 'urgent'
  const label = urgent ? 'More than 48 hours' : 'More than 24 hours'
  const cls   = urgent
    ? 'bg-(--danger-border) text-(--danger-text)'
    : 'bg-(--warning-border) text-(--warning-text)'

  return (
    <span className={`absolute top-0 left-1/2 -translate-x-1/2 type-caption font-bold rounded-b-md px-2.5 py-0.5 ${cls}`}>
      {label}
    </span>
  )
}

/* ─── Task Card ──────────────────────────────────────────────── */

function TaskCard({ task, onSelect, onClaim, onUnclaim, onAssign, claiming, unclaiming, t }) {
  const typeLabel   = t(`taskCenter.taskType.${task.taskType}`)
  const statusLabel = t(`taskCenter.status.${task.status}`)
  const isTerminal  = task.status === 'COMPLETED' || task.status === 'CANCELLED'
  const isFyi       = task.taskType === 'DEPOSIT_MISSING_FIELDS_FYI' || task.taskType === 'DEPOSIT_WEBHOOK_PARSE_FAILURE'
  const isMine      = task.assignedTo === 'ops_002'
  const canClaim    = !isTerminal && !isFyi && !task.assignedTo
  const canUnclaim  = !isTerminal && !isFyi && isMine
  const showAssign  = !isTerminal && !isFyi
  const stop        = (e, fn) => { e.stopPropagation(); fn(task) }
  const linkClass   = 'type-body font-bold text-(--accent) hover:underline cursor-pointer'

  return (
    <CdsCard onClick={() => onSelect(task)} className="relative overflow-hidden cursor-pointer">
      <AgeingTab createdAt={task.created_at} status={task.status} />

      {/* Title row */}
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 text-(--text)">
          <span className="type-body-lg font-bold text-(--text) truncate">{typeLabel}</span>
        </div>
        <div className="flex shrink-0 flex-col items-center rounded-md border border-(--border) px-2 py-1">
          <span className="type-caption text-(--subtle)">{t('taskCenter.card.waitTime')}</span>
          <span className="type-caption font-bold text-(--text)">{formatWait(task.created_at)}</span>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 flex-wrap">
        <CdsStatusTag tone={STATUS_TONE[task.status]}>{statusLabel}</CdsStatusTag>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-1 min-h-12">
        <div className="flex gap-2 type-body">
          <span className="text-(--muted) w-24 shrink-0">Transaction</span>
          <span className="flex items-center gap-1 min-w-0">
            <span className="text-(--accent) font-medium truncate">{task.transactionId}</span>
            <CdsCopyButton text={task.transactionId} />
          </span>
        </div>
        <div className="flex gap-2 type-body">
          <span className="text-(--muted) w-24 shrink-0">Amount</span>
          <span className="text-(--text)">Deposit {task.amountDisplay}</span>
        </div>
        <p className="type-body text-(--muted) line-clamp-2 mt-2">{t(`taskCenter.taskTypeDesc.${task.taskType}`)}</p>
      </div>

      {/* Footer — assignment / claim / assign actions (not shown for FYI tasks) */}
      {!isFyi && (
        <div className="flex items-center justify-between gap-2 w-full mt-auto">
          <span className="type-body text-(--muted) min-w-0 truncate">
            {task.assignedToName
              ? <>{t('taskCenter.card.assignedTo')} <span className="font-medium text-(--text)">{task.assignedToName}</span></>
              : <span className="text-(--subtle)">{t('taskCenter.card.unassigned')}</span>}
          </span>
          <div className="flex shrink-0 items-center gap-3">
            {canClaim   && <button type="button" className={linkClass} disabled={claiming}   onClick={(e) => stop(e, onClaim)}>{t('taskCenter.actions.claim')}</button>}
            {canUnclaim && <button type="button" className={linkClass} disabled={unclaiming} onClick={(e) => stop(e, onUnclaim)}>{t('taskCenter.actions.unclaim')}</button>}
            {showAssign && <button type="button" className={linkClass} onClick={(e) => stop(e, onAssign)}>{task.assignedTo ? t('taskCenter.actions.reassign') : t('taskCenter.actions.assign')}</button>}
          </div>
        </div>
      )}
    </CdsCard>
  )
}

/* ─── Assign Task Modal ──────────────────────────────────────── */

function AssignTaskModal({ task, open, onClose, onAssigned }) {
  const [selectedId, setSelectedId] = useState('')
  const [reason, setReason] = useState('')
  const reassign = useReassignTask()
  const toast = useToast()
  const eligibleQuery = useEligibleAssignees(task?.id, open)
  const assignees = eligibleQuery.data?.assignees ?? []

  const isReassign = !!task?.assignedTo
  const reasonRequired = isReassign && !reason.trim()

  useEffect(() => {
    if (open) { setSelectedId(''); setReason('') }
  }, [open, task?.id])

  const handleConfirm = () => {
    if (!selectedId || reasonRequired) return
    const chosen = assignees.find(a => a.id === selectedId)
    reassign.mutateAsync({ id: task.id, targetUserId: selectedId, reason: reason.trim() || undefined })
      .then(() => {
        toast.show(isReassign ? 'Task reassigned' : 'Task assigned')
        if (chosen) onAssigned?.({ id: chosen.id, name: chosen.name })
        onClose()
      })
      .catch((e) => toast.show(e?.message || 'Assignment failed'))
  }

  return (
    <CdsModal
      open={open}
      onClose={onClose}
      size="md"
      title={isReassign ? 'Reassign Task' : 'Assign Task'}
      footer={[
        { label: isReassign ? 'Reassign' : 'Assign', variant: 'primary', onClick: handleConfirm, loading: reassign.isPending, disabled: !selectedId || reasonRequired || reassign.isPending },
        { label: 'Cancel', onClick: onClose },
      ]}
    >
      <div className="flex flex-col gap-4">
        <div className="type-body text-(--muted)">Select who should handle this task.</div>

        {eligibleQuery.isLoading ? (
          <CdsInlineStatus status="loading" />
        ) : assignees.length === 0 ? (
          <div className="type-body-sm text-(--subtle)">No eligible assignees found.</div>
        ) : (
          <div className="flex flex-col gap-0.5 max-h-72 overflow-y-auto">
            {assignees.map(a => (
              <label
                key={a.id}
                className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-(--item-hover) cursor-pointer"
                onClick={() => setSelectedId(a.id)}
              >
                <CdsRadio checked={selectedId === a.id} />
                <span className="flex flex-col min-w-0">
                  <span className="type-body text-(--text)">{a.name}</span>
                  {a.role && <span className="type-caption text-(--subtle)">{a.role}</span>}
                </span>
              </label>
            ))}
          </div>
        )}

        {isReassign && (
          <CdsTextarea
            value={reason}
            onChange={setReason}
            placeholder="Reason for reassignment (required)"
          />
        )}
      </div>
    </CdsModal>
  )
}

/* ─── Audit + match-strategy labels ──────────────────────────── */

const AUDIT_LABEL: Record<string, string> = {
  TASK_CREATED:            'created',
  TASK_CLAIMED:            'claimed',
  TASK_UNCLAIMED:          'unclaimed',
  TASK_COMPLETED:          'completed',
  TASK_NOTE:               'note',
  TASK_CANCELLED:          'cancelled',
  TASK_RECIPIENT_CONFIRMED:'recipientConfirmed',
  TASK_RETRIED:            'retried',
  TASK_CLASSIFIED:         'classified',
  TASK_FIELDS_FILLED:      'fieldsFilled',
  TASK_REJECTED_REFUND:    'rejectedRefund',
  TASK_SCREENING_APPROVED: 'screeningApproved',
  TASK_CLOSED_NO_ACTION:   'closedNoAction',
  ORDER_NOTE:              'orderNote',
  ORDER_REFUNDED:          'orderRefunded',
}

function titleCase(s: string) {
  return s.toLowerCase().split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

const MATCH_STRATEGY_LABEL: Record<string, string> = {
  reference_similar: 'Similar reference',
  va_parent:         'VA parent',
  name_fuzzy:        'Name match',
  saved_payer:       'Saved payer',
  payment_reference: 'Payment reference',
}

/* ── Transaction details (PRD §7.7.3 item 1 — read-only, fetched from order) ── */

function DepositDetailsPanel({ order, loading, t }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-(--fill) px-3 py-3 type-body-sm text-(--muted)">
        <CdsSpinner /> {t('taskCenter.panel.loadingDeposit')}
      </div>
    )
  }
  if (!order) {
    return (
      <div className="rounded-md bg-(--fill) px-3 py-3 type-body-sm text-(--muted)">
        {t('taskCenter.panel.depositUnavailable')}
      </div>
    )
  }
  const dash = (v) => (v == null || v === '' ? '—' : v)
  return (
    <CdsDetailList>
      <CdsDetailRow label={t('taskCenter.deposit.transactionId')} value={order.transaction_id} copyText={order.transaction_id} />
      <CdsDetailRow label={t('taskCenter.deposit.channel')}       value={order.payment_channel} />
      <CdsDetailRow label={t('taskCenter.deposit.amount')}        value={`${fmtAmount(order.amount_minor)} ${order.currency}`} />
      <CdsDetailRow label={t('taskCenter.deposit.senderName')}    value={dash(order.sender_name)} />
      <CdsDetailRow label={t('taskCenter.deposit.senderAccount')} value={dash(order.sender_account)} />
      <CdsDetailRow label={t('taskCenter.deposit.senderBank')}    value={dash(order.sender_bank_name)} />
      <CdsDetailRow label={t('taskCenter.deposit.referenceCode')} value={dash(order.reference_code)} />
      <CdsDetailRow label={t('taskCenter.deposit.valueDate')}     value={dash(order.value_date)} />
    </CdsDetailList>
  )
}

/* ── Recipient matching: candidate list + manual search (DEPOSIT_RECIPIENT_MATCHING) ── */

function RecipientMatchPanel({ task, selected, onSelect, t }) {
  const candidates = task.candidates ?? []
  const hasCandidates = candidates.length > 0
  const [manualQuery, setManualQuery] = useState('')
  const [tab, setTab] = useState('candidates')
  const { data: searchData, isFetching } = useClientSearch(manualQuery)
  const results = searchData?.items ?? []

  const pickManual = (value) => {
    const c = results.find(r => r.participant_code === value)
    if (c) onSelect({ ...c, via_manual_search: true })
  }

  const candidateList = (
    <div className="flex flex-col gap-2">
      {candidates.map(c => {
        const active = selected?.participant_code === c.participant_code && !selected?.via_manual_search
        return (
          <button
            type="button"
            key={c.participant_code}
            onClick={() => onSelect(c)}
            className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors cursor-pointer ${active ? 'border-(--accent) bg-(--accent-subtle)' : 'border-(--border) hover:bg-(--item-hover)'}`}
          >
            <CdsRadio checked={active} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="type-body font-semibold text-(--text)">{c.client_name}</span>
                <CdsBadge tone={MATCH_PRIORITY_TONE[c.priority]}>{t(`taskCenter.priority.${c.priority}`)}</CdsBadge>
              </div>
              <div className="type-caption text-(--muted) tabular-nums">{c.participant_code} · {c.parent_node} · {c.account_number}</div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {c.strategies.map((s, i) => (
                  <span key={i} className="type-caption text-(--muted) rounded bg-(--fill) px-1.5 py-0.5">
                    {MATCH_STRATEGY_LABEL[s.strategy] ?? s.strategy} {s.score.toFixed(2)}
                  </span>
                ))}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )

  const manualSearch = (
    <div>
      <CdsInput
        value={manualQuery}
        onChange={e => setManualQuery(e.target.value)}
        onClear={() => setManualQuery('')}
        placeholder={t('taskCenter.panel.manualSearchPlaceholder')}
        size="md"
      />
      {manualQuery.trim() && (
        <div className="mt-2 flex flex-col gap-1.5">
          {isFetching && (
            <div className="flex items-center gap-2 type-caption text-(--muted) px-1 py-1"><CdsSpinner /> {t('taskCenter.panel.searching')}</div>
          )}
          {!isFetching && results.length === 0 && (
            <div className="type-body-sm text-(--muted) px-1 py-2">{t('taskCenter.panel.noSearchResults')}</div>
          )}
          {results.map(r => {
            const active = selected?.participant_code === r.participant_code && selected?.via_manual_search
            return (
              <button
                type="button"
                key={r.participant_code}
                onClick={() => pickManual(r.participant_code)}
                className={`flex items-center gap-3 rounded-md border p-2.5 text-left transition-colors cursor-pointer ${active ? 'border-(--accent) bg-(--accent-subtle)' : 'border-(--border) hover:bg-(--item-hover)'}`}
              >
                <CdsRadio checked={active} />
                <div className="flex-1 min-w-0">
                  <div className="type-body-sm font-medium text-(--text) truncate">{r.client_name}</div>
                  <div className="type-caption text-(--muted) tabular-nums truncate">{r.participant_code} · {r.parent_node} · {r.account_number}</div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Caution prompt — §7.7.3 item 2 (plain text, no banner) */}
      <p className="type-body text-(--muted)">{t('taskCenter.panel.recipientCaution')}</p>

      {/* With candidates: tabs carry both lists. Without: manual search only. */}
      {hasCandidates ? (
        <>
          <CdsPillTabs
            value={tab}
            onChange={setTab}
            items={[
              { value: 'candidates', label: t('taskCenter.panel.candidates') },
              { value: 'manual',     label: t('taskCenter.panel.manualSearch') },
            ]}
          />
          {tab === 'candidates' ? candidateList : manualSearch}
        </>
      ) : (
        <div>
          <div className="type-body-sm font-semibold text-(--text) mb-1.5">{t('taskCenter.panel.manualSearch')}</div>
          {manualSearch}
        </div>
      )}
    </div>
  )
}

/* ── Status exception banner (DEPOSIT_STATUS_EXCEPTION) ───────── */

function StatusExceptionPanel({ task, t }) {
  const statuses = task.blockingStatuses ?? []
  return (
    <div className="rounded-lg border border-(--danger-border) bg-(--danger-bg) p-4">
      <div className="flex items-center gap-2 mb-2">
        <Ban size={16} className="text-(--danger) shrink-0" />
        <span className="type-body font-semibold text-(--danger)">{t('taskCenter.panel.statusBlockedTitle')}</span>
      </div>
      <div className="flex flex-wrap gap-2 mb-2">
        {statuses.map(s => (
          <CdsBadge key={s} tone={ACCOUNT_STATUS_TONE[s]}>{t(`taskCenter.accountStatus.${s}`)}</CdsBadge>
        ))}
      </div>
      <p className="type-body-sm text-(--muted)">{t('taskCenter.panel.statusBlockedAction')}</p>
    </div>
  )
}

/* ── Classification panel (DEPOSIT_CLASSIFICATION) ────────────── */

function ClassifyPanel({ task, value, onChange, t }) {
  return (
    <div>
      <div className="type-body-lg font-semibold text-(--text) mb-1">{t('taskCenter.panel.classify')}</div>
      {task.nameMatchScore != null && (
        <p className="type-body-sm text-(--muted) mb-2">
          {t('taskCenter.panel.nameMatchScore')}: <span className="font-semibold text-(--text)">{task.nameMatchScore.toFixed(2)}</span> — {t('taskCenter.panel.ambiguousRange')}
        </p>
      )}
      <div className="flex flex-col gap-2">
        {[
          { v: '1st_party', label: t('depositOrder.party.1st_party'), hint: t('taskCenter.panel.firstPartyHint') },
          { v: '3rd_party', label: t('depositOrder.party.3rd_party'), hint: t('taskCenter.panel.thirdPartyHint') },
        ].map(opt => {
          const active = value === opt.v
          return (
            <button type="button" key={opt.v} onClick={() => onChange(opt.v)}
              className={`flex items-start gap-3 rounded-lg border p-3 text-left cursor-pointer transition-colors ${active ? 'border-(--accent) bg-(--accent-subtle)' : 'border-(--border) hover:bg-(--item-hover)'}`}>
              <CdsRadio checked={active} />
              <div>
                <div className="type-body font-semibold text-(--text)">{opt.label}</div>
                <div className="type-caption text-(--muted)">{opt.hint}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── Missing-fields panel (DEPOSIT_MISSING_FIELDS_FYI) ─────────── */

function MissingFieldsPanel({ task, values, onChange, t }) {
  const fields = task.missingFields ?? []
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <div className="type-body-lg font-semibold text-(--text)">{t('taskCenter.panel.missingFields')}</div>
        <CdsBadge tone="neutral" icon={<Info size={12} />}>{t('taskCenter.fyiBadge')}</CdsBadge>
      </div>
      <p className="type-body-sm text-(--muted) mb-3">{t('taskCenter.panel.missingFieldsHint')}</p>
      <div className="flex flex-col gap-3">
        {fields.map(f => (
          <div key={f.key}>
            <label className="type-caption font-semibold text-(--text) mb-1 block">
              {f.label}{f.required && <span className="text-(--danger)"> *</span>}
            </label>
            <CdsInput value={values[f.key] ?? ''} onChange={e => onChange(f.key, e.target.value)} size="md" />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Parse-failure panel (DEPOSIT_WEBHOOK_PARSE_FAILURE) ───────── */

function ParseFailurePanel({ task, t }) {
  return (
    <div className="flex flex-col gap-3">
      <CdsDetailList>
        <CdsDetailRow label={t('taskCenter.panel.channel')}    value={task.paymentChannel ?? '—'} />
        <CdsDetailRow label={t('taskCenter.panel.receivedAt')} value={task.receivedAt ? fmtDateTime(task.receivedAt) : '—'} />
      </CdsDetailList>
      <div>
        <div className="type-body-sm font-semibold text-(--text) mb-1">{t('taskCenter.panel.rawPayload')}</div>
        <pre className="rounded-md bg-(--fill) p-3 type-caption text-(--muted) overflow-x-auto whitespace-pre-wrap">{task.rawPayload ?? '—'}</pre>
      </div>
    </div>
  )
}
// CHUNK_BOUNDARY

/* ─── Mark Refunded dialog body (PRD §7.7.8) ─────────────────── */

function MarkRefundedFields({ orderNo, setOrderNo, date, setDate, notes, setNotes, t }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-md bg-(--fill) px-3 py-2 type-body-sm text-(--muted)">
        {t('depositOrder.refund.intro')}
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
  )
}

/* ─── Task Drawer ────────────────────────────────────────────── */

function TaskDetailDrawer({ task, onClose, t }) {
  const [tab,      setTab]      = useState('details')
  const [noteMode, setNoteMode] = useState(false)
  const [noteText, setNoteText] = useState('')

  // type-specific working state
  const [candidate,   setCandidate]   = useState(null)  // recipient matching (may carry via_manual_search)
  const [classify,    setClassify]    = useState('')    // classification
  const [fieldValues, setFieldValues] = useState({})    // missing fields
  const [dialog,      setDialog]      = useState<null | 'confirmRecipient' | 'retry' | 'classify' | 'fillFields' | 'approveScreening' | 'rejectRefund' | 'closeNoAction' | 'markRefunded'>(null)
  const [dialogInput, setDialogInput] = useState('')
  // Client Identification + Party Classification route their operations through a
  // modal opened by the drawer's "Proceed" CTA, rather than inlining them.
  const [proceedOpen, setProceedOpen] = useState(false)
  const [classifyOpen, setClassifyOpen] = useState(false)

  // mark-refunded form state
  const [refundNo,    setRefundNo]    = useState('')
  const [refundDate,  setRefundDate]  = useState(fmtDay(new Date()))
  const [refundNotes, setRefundNotes] = useState('')

  const toast = useToast()
  const addNote          = useAddTaskNote()
  const confirmRecipient = useConfirmRecipient()
  const retryTask        = useRetryTask()
  const classifyTask     = useClassifyTask()
  const fillFields       = useFillFields()
  const rejectRefund     = useRejectRefund()
  const approveScreening = useApproveScreening()
  const closeNoAction    = useCloseNoAction()
  const markRefunded     = useMarkDepositRefunded()

  const type       = task.taskType
  const hasOrder   = type !== 'DEPOSIT_WEBHOOK_PARSE_FAILURE' && !!task.depositOrderId
  const { data: order, isLoading: orderLoading } = useDepositOrder(hasOrder ? task.depositOrderId : null)

  const isMine     = task.assignedTo === 'ops_002'
  const isTerminal = task.status === 'COMPLETED' || task.status === 'CANCELLED'
  const canAct     = isMine && !isTerminal

  // Mark-as-Refunded eligibility (PRD §7.7.8): unidentified + still in manual_review
  const canMarkRefunded = type === 'DEPOSIT_RECIPIENT_MATCHING'
    && order?.anomalous_reason === 'unidentified'
    && order?.status === 'processing.manual_review'

  const done = (msg) => { toast.show(msg); setDialog(null); setProceedOpen(false); setClassifyOpen(false); onClose() }
  const fail = (e, fallback) => toast.show(e?.message || fallback)

  const resetRefund = () => { setRefundNo(''); setRefundDate(fmtDay(new Date())); setRefundNotes('') }

  const handleTaskNote = () => {
    if (!noteText.trim()) return
    addNote.mutateAsync({ id: task.id, comment: noteText.trim() })
      .then(() => { toast.show(t('taskCenter.toast.noteSaved')); setNoteMode(false); setNoteText('') })
      .catch(e => fail(e, 'Failed to save note'))
  }

  const runDialog = () => {
    const input = dialogInput.trim()
    switch (dialog) {
      case 'confirmRecipient':
        confirmRecipient.mutateAsync({
          id: task.id,
          participant_code: candidate.participant_code,
          client_name: candidate.client_name,
          account_number: candidate.account_number,
          via_manual_search: !!candidate.via_manual_search,
        }).then(() => done(t('taskCenter.toast.recipientConfirmed'))).catch(e => fail(e, 'Failed'))
        break
      case 'retry':
        retryTask.mutateAsync({ id: task.id, comment: input || undefined })
          .then(() => done(t('taskCenter.toast.retried'))).catch(e => fail(e, 'Failed'))
        break
      case 'classify':
        classifyTask.mutateAsync({ id: task.id, classification: classify })
          .then(() => done(t('taskCenter.toast.classified'))).catch(e => fail(e, 'Failed'))
        break
      case 'fillFields':
        fillFields.mutateAsync({ id: task.id, fields: fieldValues })
          .then(() => done(t('taskCenter.toast.fieldsFilled'))).catch(e => fail(e, 'Failed'))
        break
      case 'approveScreening':
        approveScreening.mutateAsync({ id: task.id, comment: input || undefined })
          .then(() => done(t('taskCenter.toast.screeningApproved'))).catch(e => fail(e, 'Failed'))
        break
      case 'rejectRefund':
        rejectRefund.mutateAsync({ id: task.id, reason: input })
          .then(() => done(t('taskCenter.toast.rejectedRefund'))).catch(e => fail(e, 'Failed'))
        break
      case 'closeNoAction':
        closeNoAction.mutateAsync({ id: task.id, reason: input })
          .then(() => done(t('taskCenter.toast.closed'))).catch(e => fail(e, 'Failed'))
        break
      case 'markRefunded':
        markRefunded.mutateAsync({
          id: task.depositOrderId,
          refund_order_number: refundNo.trim(),
          refund_date: refundDate,
          refund_notes: refundNotes.trim() || undefined,
        }).then(() => { resetRefund(); done(t('depositOrder.toast.refundMarked')) }).catch(e => fail(e, 'Failed to mark refunded'))
        break
    }
  }

  // missing-fields completeness check
  const requiredFieldsFilled = (task.missingFields ?? [])
    .filter(f => f.required)
    .every(f => (fieldValues[f.key] ?? '').trim())

  const refundValid = refundNo.trim() && refundDate

  /* ── Footer: per-type primary/secondary actions ───────────────── */
  let footer = null
  if (canAct) {
    const secondaryNote = (
      <CdsButton variant="ghost" className="flex-1" onClick={() => setNoteMode(v => !v)}>
        {t('taskCenter.actions.addNote')}
      </CdsButton>
    )

    if (type === 'DEPOSIT_RECIPIENT_MATCHING') {
      // Recipient matching + reject/refund live in the Proceed modal; the drawer
      // only opens it. Mark as Refunded stays in the drawer footer (when eligible).
      footer = (
        <div className="flex gap-2 w-full">
          <CdsButton variant="primary" className="flex-1" onClick={() => setProceedOpen(true)}>
            {t('taskCenter.actions.proceed')}
          </CdsButton>
          {canMarkRefunded && (
            <CdsButton variant="ghost" className="flex-1" icon={<Undo2 size={15} />} onClick={() => { resetRefund(); setDialog('markRefunded') }}>
              {t('depositOrder.actions.markRefunded')}
            </CdsButton>
          )}
        </div>
      )
    } else if (type === 'DEPOSIT_STATUS_EXCEPTION') {
      footer = (
        <CdsButton variant="primary" className="w-full" icon={<RotateCcw size={15} />} onClick={() => { setDialogInput(''); setDialog('retry') }}>
          {t('taskCenter.actions.retry')}
        </CdsButton>
      )
    } else if (type === 'DEPOSIT_CLASSIFICATION') {
      // Classification operation lives in the Proceed modal; drawer only opens it.
      footer = (
        <CdsButton variant="primary" className="w-full" onClick={() => setClassifyOpen(true)}>
          {t('taskCenter.actions.proceed')}
        </CdsButton>
      )
    } else if (type === 'DEPOSIT_MISSING_FIELDS_FYI') {
      footer = (
        <div className="flex gap-2 w-full">
          <CdsButton variant="primary" className="flex-1" disabled={!requiredFieldsFilled} onClick={() => setDialog('fillFields')}>
            {t('taskCenter.actions.saveFields')}
          </CdsButton>
          {secondaryNote}
        </div>
      )
    } else if (type === 'DEPOSIT_SCREENING_REVIEW') {
      footer = (
        <div className="flex gap-2 w-full">
          <CdsButton variant="primary" className="flex-1" onClick={() => { setDialogInput(''); setDialog('approveScreening') }}>
            {t('taskCenter.actions.approveScreening')}
          </CdsButton>
          <CdsButton variant="ghost" className="flex-1" onClick={() => { setDialogInput(''); setDialog('rejectRefund') }}>
            {t('taskCenter.actions.rejectRefund')}
          </CdsButton>
        </div>
      )
    }
  }

  // Webhook Parse Failure is an FYI task (never claimed), so it falls outside the
  // canAct gate above. Surface a Close button that drops it straight to terminal.
  if (type === 'DEPOSIT_WEBHOOK_PARSE_FAILURE' && !isTerminal) {
    footer = (
      <CdsButton variant="primary" className="w-full" icon={<Ban size={15} />} loading={closeNoAction.isPending}
        onClick={() => closeNoAction.mutateAsync({ id: task.id }).then(() => done(t('taskCenter.toast.closed'))).catch(e => fail(e, 'Failed to close task'))}>
        {t('taskCenter.actions.closeNoAction')}
      </CdsButton>
    )
  }

  const showOrderLink       = hasOrder

  // Ageing label above the title — mirrors the card's AgeingTab, text-only.
  const ageingText = (() => {
    if (isTerminal) return null
    const tier = urgencyTier(task.created_at)
    if (tier === 'normal') return null
    return tier === 'urgent'
      ? { label: 'More than 48 hours', cls: 'text-(--danger-text)' }
      : { label: 'More than 24 hours', cls: 'text-(--warning-text)' }
  })()

  return (
    <CdsDrawer
      open={!!task}
      onClose={onClose}
      title="Task Detail"
      tabs={[
        { value: 'details', label: t('taskCenter.drawer.details') },
        { value: 'audit',   label: t('taskCenter.drawer.auditTrail') },
      ]}
      activeTab={tab}
      onTabChange={setTab}
      footer={footer}
    >
      <div className="flex flex-col gap-5">
        {tab === 'details' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              {ageingText && (
                <span className={`type-body font-bold ${ageingText.cls}`}>{ageingText.label}</span>
              )}
              <span className="type-h4 font-semibold text-(--text)">{t(`taskCenter.taskType.${task.taskType}`)}</span>
              <div className="flex items-center gap-2 flex-wrap">
                <CdsStatusTag tone={STATUS_TONE[task.status]}>{t(`taskCenter.status.${task.status}`)}</CdsStatusTag>
                {type === 'DEPOSIT_MISSING_FIELDS_FYI' && (
                  <CdsBadge tone="neutral" icon={<Info size={12} />}>{t('taskCenter.fyiBadge')}</CdsBadge>
                )}
              </div>
            </div>

            <div>
              <div className="type-body-lg font-semibold text-(--text) mb-2">{t('taskCenter.drawer.description')}</div>
              <p className="type-body text-(--muted)">{t(`taskCenter.taskTypeDesc.${task.taskType}`)}</p>
            </div>

            {/* Status exception banner — shown above details */}
            {type === 'DEPOSIT_STATUS_EXCEPTION' && <StatusExceptionPanel task={task} t={t} />}

            {/* Transaction details (§7.7.3 item 1) — full order data, or parse-failure payload */}
            {type === 'DEPOSIT_WEBHOOK_PARSE_FAILURE' ? (
              <div>
                <div className="type-body-lg font-semibold text-(--text) mb-2">{t('taskCenter.drawer.payloadInfo')}</div>
                <ParseFailurePanel task={task} t={t} />
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="type-body-lg font-semibold text-(--text)">{t('taskCenter.drawer.depositInfo')}</span>
                  {showOrderLink && (
                    <CdsButton variant="text" size="xs" icon={<ExternalLink size={13} />}
                      onClick={() => window.alert(`Open in Order Center: ${task.transactionId}`)}>
                      {t('taskCenter.actions.viewInOrderCenter')}
                    </CdsButton>
                  )}
                </div>
                <DepositDetailsPanel order={order} loading={orderLoading} t={t} />
              </div>
            )}

            {/* Refund record (if already marked refunded) */}
            {order?.refund_info && (
              <div className="rounded-lg border border-(--border) bg-(--fill) p-3">
                <div className="type-body-sm font-semibold text-(--text) mb-1.5">{t('taskCenter.drawer.refundRecord')}</div>
                <CdsDetailList>
                  <CdsDetailRow label={t('depositOrder.refund.orderNumber')} value={order.refund_info.refund_order_number} />
                  <CdsDetailRow label={t('depositOrder.refund.date')}        value={order.refund_info.refund_date} />
                  <CdsDetailRow label={t('taskCenter.drawer.refundMarkedBy')} value={order.refund_info.marked_by} />
                </CdsDetailList>
              </div>
            )}

            {/* Type-specific action panels (interactive only when actionable).
                Client Identification + Party Classification operations live in their modals. */}
            {type === 'DEPOSIT_MISSING_FIELDS_FYI' && !isTerminal && (
              <MissingFieldsPanel task={task} values={fieldValues} onChange={(k, v) => setFieldValues(p => ({ ...p, [k]: v }))} t={t} />
            )}

            {/* Inline note editor */}
            {noteMode && (
              <div className="flex flex-col gap-2">
                <CdsTextarea value={noteText} onChange={setNoteText} placeholder={t('taskCenter.drawer.notePlaceholder')} />
                <div className="flex gap-2">
                  <CdsButton variant="primary" size="sm" loading={addNote.isPending} onClick={handleTaskNote}>{t('taskCenter.actions.saveNote')}</CdsButton>
                  <CdsButton variant="ghost"   size="sm" onClick={() => { setNoteMode(false); setNoteText('') }}>{t('common.cancel')}</CdsButton>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'audit' && (
          task.history?.length > 0 ? (
            <div className="relative" style={{ paddingLeft: '24px' }}>
              {[...task.history].reverse().map((entry, i, arr) => (
                <div key={i} className="relative flex flex-col gap-0.5 pb-4 last:pb-0">
                  {i < arr.length - 1 && (
                    <div className="absolute border-l border-(--border-strong)" style={{ left: '-19px', top: '15px', bottom: '0' }} />
                  )}
                  {i > 0 && (
                    <div className="absolute border-l border-(--border-strong)" style={{ left: '-19px', top: '0', height: '4px' }} />
                  )}
                  <div
                    className={`absolute rounded-full border-2 border-(--surface) ${i === 0 ? 'bg-(--success)' : 'bg-(--border-strong)'}`}
                    style={{ width: '11px', height: '11px', left: '-24px', top: '4px' }}
                  />
                  <div className="flex items-center justify-between">
                    <span className="type-body font-bold text-(--text)">{entry.actorName}</span>
                    <span className="type-caption text-(--subtle)">{fmtDateTime(entry.timestamp)}</span>
                  </div>
                  <span className="type-body text-(--muted)">
                    {AUDIT_LABEL[entry.action] ? t(`taskCenter.audit.${AUDIT_LABEL[entry.action]}`) : titleCase(entry.action)}
                  </span>
                  {entry.comment && <span className="type-body-sm text-(--subtle)">{entry.comment}</span>}
                </div>
              ))}
            </div>
          ) : (
            <p className="type-body-sm text-(--subtle)">{t('taskCenter.drawer.noAuditTrail')}</p>
          )
        )}
      </div>

      {/* Client Identification — Proceed modal holds recipient matching + reject/refund.
          Fixed container height so the modal doesn't resize when switching tabs / loading
          results; the body fills it and scrolls internally. */}
      <CdsModal
        open={proceedOpen}
        onClose={() => { setProceedOpen(false); setCandidate(null) }}
        size="md"
        className="h-[70vh]"
        title={t('taskCenter.taskType.DEPOSIT_RECIPIENT_MATCHING')}
        footer={[
          { label: t('taskCenter.actions.confirmRecipient'), variant: 'primary', disabled: !candidate, onClick: () => setDialog('confirmRecipient') },
          { label: t('taskCenter.actions.rejectRefund'), onClick: () => { setDialogInput(''); setDialog('rejectRefund') } },
        ]}
      >
        <RecipientMatchPanel task={task} selected={candidate} onSelect={setCandidate} t={t} />
      </CdsModal>

      {/* Party Classification — modal holds the 1st/3rd party operation */}
      <CdsModal
        open={classifyOpen}
        onClose={() => { setClassifyOpen(false); setClassify('') }}
        size="md"
        title={t('taskCenter.taskType.DEPOSIT_CLASSIFICATION')}
        footer={[
          { label: t('taskCenter.actions.confirmClassification'), variant: 'primary', disabled: !classify, onClick: () => setDialog('classify') },
        ]}
      >
        <ClassifyPanel task={task} value={classify} onChange={setClassify} t={t} />
      </CdsModal>

      {/* Confirm recipient */}
      <CdsDialog
        open={dialog === 'confirmRecipient'} onClose={() => setDialog(null)}
        icon={<CheckCircle2 />} tone="success"
        title={t('taskCenter.dialog.confirmRecipientTitle')}
        description={candidate ? t('taskCenter.dialog.confirmRecipientDesc', { name: candidate.client_name }) : ''}
        confirmLabel={t('taskCenter.actions.confirmRecipient')}
        onConfirm={runDialog} confirmLoading={confirmRecipient.isPending}
        cancelLabel={t('common.cancel')} onCancel={() => setDialog(null)}
      />

      {/* Retry */}
      <CdsDialog
        open={dialog === 'retry'} onClose={() => setDialog(null)}
        icon={<RotateCcw />} tone="primary"
        title={t('taskCenter.dialog.retryTitle')}
        description={t('taskCenter.dialog.retryDesc')}
        confirmLabel={t('taskCenter.actions.retry')}
        onConfirm={runDialog} confirmLoading={retryTask.isPending}
        cancelLabel={t('common.cancel')} onCancel={() => setDialog(null)}
      >
        <CdsTextarea value={dialogInput} onChange={setDialogInput} placeholder={t('taskCenter.dialog.noteOptional')} />
      </CdsDialog>

      {/* Classify */}
      <CdsDialog
        open={dialog === 'classify'} onClose={() => setDialog(null)}
        icon={<FileSearch />} tone="primary"
        title={t('taskCenter.dialog.classifyTitle')}
        description={classify ? t('taskCenter.dialog.classifyDesc', { label: t(`depositOrder.party.${classify}`) }) : ''}
        confirmLabel={t('taskCenter.actions.confirmClassification')}
        onConfirm={runDialog} confirmLoading={classifyTask.isPending}
        cancelLabel={t('common.cancel')} onCancel={() => setDialog(null)}
      />

      {/* Fill fields */}
      <CdsDialog
        open={dialog === 'fillFields'} onClose={() => setDialog(null)}
        icon={<FileX />} tone="primary"
        title={t('taskCenter.dialog.fillFieldsTitle')}
        description={t('taskCenter.dialog.fillFieldsDesc')}
        confirmLabel={t('taskCenter.actions.saveFields')}
        onConfirm={runDialog} confirmLoading={fillFields.isPending}
        cancelLabel={t('common.cancel')} onCancel={() => setDialog(null)}
      />

      {/* Approve screening */}
      <CdsDialog
        open={dialog === 'approveScreening'} onClose={() => setDialog(null)}
        icon={<CheckCircle2 />} tone="success"
        title={t('taskCenter.dialog.approveScreeningTitle')}
        description={t('taskCenter.dialog.approveScreeningDesc')}
        confirmLabel={t('taskCenter.actions.approveScreening')}
        onConfirm={runDialog} confirmLoading={approveScreening.isPending}
        cancelLabel={t('common.cancel')} onCancel={() => setDialog(null)}
      >
        <CdsTextarea value={dialogInput} onChange={setDialogInput} placeholder={t('taskCenter.dialog.noteOptional')} />
      </CdsDialog>

      {/* Reject → refund */}
      <CdsDialog
        open={dialog === 'rejectRefund'} onClose={() => setDialog(null)}
        icon={<Ban />} tone="danger"
        title={t('taskCenter.dialog.rejectRefundTitle')}
        description={t('taskCenter.dialog.rejectRefundDesc')}
        confirmLabel={t('taskCenter.actions.rejectRefund')} confirmVariant="primary"
        onConfirm={runDialog} confirmLoading={rejectRefund.isPending}
        confirmDisabled={!dialogInput.trim()}
        cancelLabel={t('common.cancel')} onCancel={() => setDialog(null)}
      >
        <CdsTextarea value={dialogInput} onChange={setDialogInput} placeholder={t('taskCenter.dialog.reasonRequired')} />
      </CdsDialog>

      {/* Close — no action (parse failure) */}
      <CdsDialog
        open={dialog === 'closeNoAction'} onClose={() => setDialog(null)}
        icon={<Ban />} tone="neutral"
        title={t('taskCenter.dialog.closeNoActionTitle')}
        description={t('taskCenter.dialog.closeNoActionDesc')}
        confirmLabel={t('taskCenter.actions.closeNoAction')}
        onConfirm={runDialog} confirmLoading={closeNoAction.isPending}
        confirmDisabled={!dialogInput.trim()}
        cancelLabel={t('common.cancel')} onCancel={() => setDialog(null)}
      >
        <CdsTextarea value={dialogInput} onChange={setDialogInput} placeholder={t('taskCenter.dialog.reasonRequired')} />
      </CdsDialog>

      {/* Mark as Refunded (§7.7.8) — order operation surfaced in the task drawer */}
      <CdsDialog
        open={dialog === 'markRefunded'} onClose={() => { resetRefund(); setDialog(null) }}
        icon={<Undo2 />} tone="neutral"
        title={t('depositOrder.actions.markRefunded')}
        confirmLabel={t('depositOrder.refund.confirm')}
        onConfirm={runDialog} confirmLoading={markRefunded.isPending}
        confirmDisabled={!refundValid}
        cancelLabel={t('common.cancel')} onCancel={() => { resetRefund(); setDialog(null) }}
      >
        <MarkRefundedFields
          orderNo={refundNo} setOrderNo={setRefundNo}
          date={refundDate} setDate={setRefundDate}
          notes={refundNotes} setNotes={setRefundNotes}
          t={t}
        />
      </CdsDialog>
    </CdsDrawer>
  )
}
// CHUNK_BOUNDARY_PAGE

/* ─── History Table ──────────────────────────────────────────── */

function HistoryTable({ tasks, onSelect, isLoading, isFetching, isError, onRetry, hasFilters, page, totalPages, pageSize, onPageChange, onPageSizeChange, t }) {
  const columns: CdsTableColumn<DepositTask>[] = useMemo(() => [
    {
      key: 'taskType',
      header: 'Type',
      width: '220px',
      render: (_, row) => (
        <span className="type-body font-semibold text-(--text)">{t(`taskCenter.taskType.${row.taskType}`)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '140px',
      render: (_, row) => (
        <CdsStatusTag tone={STATUS_TONE[row.status]}>{t(`taskCenter.status.${row.status}`)}</CdsStatusTag>
      ),
    },
    {
      key: 'transactionId',
      header: 'Transaction ID',
      width: '180px',
      render: (_, row) => <span className="type-body text-(--accent)">{row.transactionId}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      width: '160px',
      render: (_, row) => <span className="type-body text-(--text)">{row.amountDisplay}</span>,
    },
    {
      key: 'assignedTo',
      header: 'Handler',
      width: '140px',
      render: (_, row) => row.assignedToName
        ? <span className="type-body text-(--text)">{row.assignedToName}</span>
        : <span className="type-body-sm text-(--subtle)">—</span>,
    },
    {
      key: 'created_at',
      header: 'Created',
      width: '140px',
      render: (_, row) => {
        const [date, time] = fmtDateTime(row.created_at).split(' ')
        return (
          <div className="flex flex-col">
            <span className="type-body text-(--text)">{date}</span>
            <span className="type-caption text-(--muted)">{time}</span>
          </div>
        )
      },
    },
    {
      key: 'updated_at',
      header: 'Closed',
      width: '140px',
      render: (_, row) => {
        const [date, time] = fmtDateTime(row.updated_at).split(' ')
        return (
          <div className="flex flex-col">
            <span className="type-body text-(--text)">{date}</span>
            <span className="type-caption text-(--muted)">{time}</span>
          </div>
        )
      },
    },
  ], [t])

  return (
    <CdsTableState isLoading={isLoading} isFetching={isFetching} isError={isError} onRetry={onRetry}>
      {tasks.length === 0
        ? <CdsStatusState type={hasFilters ? 'no-results' : 'empty'} title={t('taskCenter.emptyCompleted')} description={t('taskCenter.emptyCompletedDesc')} />
        : <>
            <CdsTable columns={columns} data={tasks} rowKey="id" hover onRowClick={onSelect} />
            <CdsPagination page={page} totalPages={totalPages} onChange={onPageChange} pageSize={pageSize} onPageSizeChange={onPageSizeChange} />
          </>
      }
    </CdsTableState>
  )
}

/* ─── Task type filter options (action-required types; FYI types live in their own tab) ─── */

const TASK_TYPES: DepositTaskType[] = [
  'DEPOSIT_RECIPIENT_MATCHING',
  'DEPOSIT_STATUS_EXCEPTION',
  'DEPOSIT_CLASSIFICATION',
  'DEPOSIT_SCREENING_REVIEW',
]

/* ─── Filter board ───────────────────────────────────────────── */
// All tabs share one filter set. Row 1 (6 cells) is always visible; the rest
// live behind expand/collapse. Draft state is internal — committed via Apply.

const EMPTY_FILTERS = {
  type: '', txId: '', assignedTo: '', wait: '',
  senderQ: '', senderBank: '', recipientQ: '', recipientBank: '', clientQ: '',
  dateFrom: null as string | null, dateTo: null as string | null,
}

const FILTER_LABEL = 'type-caption font-semibold text-(--text) mb-1 block'
const FILTER_CELL = 'flex flex-col min-w-0'

function TaskFilterBoard({ applied, onApply, onReset }) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState(applied)
  const [expanded, setExpanded] = useState(false)

  // Keep the draft in sync when filters are cleared/changed externally (e.g. tab switch).
  useEffect(() => { setDraft(applied) }, [applied])

  const set = (patch) => setDraft(d => ({ ...d, ...patch }))

  const assigneeOptions = useMemo(() => [
    { value: '', label: t('taskCenter.filters.allAssignees') },
    { value: 'unassigned', label: t('taskCenter.filters.unassigned') },
    ...listAssignees().map(a => ({ value: a.id, label: a.name, subLabel: a.role })),
  ], [t])

  const typeOptions = useMemo(() => [
    { value: '', label: t('taskCenter.filters.allTypes') },
    ...TASK_TYPES.map(tt => ({ value: tt, label: t(`taskCenter.taskType.${tt}`) })),
    { value: 'DEPOSIT_MISSING_FIELDS_FYI', label: t('taskCenter.taskType.DEPOSIT_MISSING_FIELDS_FYI') },
    { value: 'DEPOSIT_WEBHOOK_PARSE_FAILURE', label: t('taskCenter.taskType.DEPOSIT_WEBHOOK_PARSE_FAILURE') },
  ], [t])

  const waitOptions = useMemo(() => [
    { value: '',    label: t('taskCenter.filters.anyWait') },
    { value: '24h', label: t('taskCenter.filters.over24h') },
    { value: '48h', label: t('taskCenter.filters.over48h') },
  ], [t])

  const textCell = (key, label, placeholder) => (
    <div className={FILTER_CELL}>
      <label className={FILTER_LABEL}>{label}</label>
      <CdsInput
        size="md"
        value={draft[key]}
        onChange={e => set({ [key]: e.target.value })}
        onClear={() => set({ [key]: '' })}
        placeholder={placeholder}
      />
    </div>
  )

  const selectCell = (key, label, options) => (
    <div className={FILTER_CELL}>
      <label className={FILTER_LABEL}>{label}</label>
      <CdsStackedListbox
        size="md"
        value={draft[key]}
        onChange={v => set({ [key]: v })}
        options={options}
        buttonWidthClass="w-full"
        anchor="bottom start"
      />
    </div>
  )

  return (
    <div className="rounded-lg border border-(--border) bg-(--surface) p-4 flex flex-col gap-3">
      {/* Default — 4 filters (one row at widest); the rest live behind expand */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {selectCell('type', t('taskCenter.filters.type'), typeOptions)}
        {textCell('txId', t('taskCenter.filters.transactionId'), t('taskCenter.filters.transactionIdPlaceholder'))}
        {selectCell('assignedTo', t('taskCenter.filters.assignedTo'), assigneeOptions)}
        {selectCell('wait', t('taskCenter.filters.waitTime'), waitOptions)}
      </div>

      {/* Expanded — remaining filters */}
      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {textCell('clientQ', t('taskCenter.filters.client'), t('taskCenter.filters.clientPlaceholder'))}
          <div className={FILTER_CELL}>
            <label className={FILTER_LABEL}>{t('taskCenter.filters.timeRange')}</label>
            <CdsDateRangePicker
              size="md"
              value={{ from: draft.dateFrom, to: draft.dateTo }}
              onChange={(v: CdsDateRangeValue) => set({ dateFrom: v.from, dateTo: v.to })}
            />
          </div>
          {textCell('senderQ', t('taskCenter.filters.senderNameAccount'), t('taskCenter.filters.senderPlaceholder'))}
          {textCell('senderBank', t('taskCenter.filters.senderBank'), t('taskCenter.filters.senderBankPlaceholder'))}
          {textCell('recipientQ', t('taskCenter.filters.recipientNameAccount'), t('taskCenter.filters.recipientPlaceholder'))}
          {textCell('recipientBank', t('taskCenter.filters.recipientBank'), t('taskCenter.filters.recipientBankPlaceholder'))}
        </div>
      )}

      {/* Control row — expand/collapse (left) · Reset + Apply (right) */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <button
          type="button"
          className="inline-flex items-center gap-1 type-body font-semibold text-(--accent) hover:text-(--accent-hover) cursor-pointer transition-colors"
          onClick={() => setExpanded(v => !v)}
        >
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          {expanded ? t('taskCenter.filters.collapse') : t('taskCenter.filters.expand')}
        </button>
        <div className="flex items-center gap-2">
          <CdsButton variant="ghost" size="sm" onClick={() => { setDraft(EMPTY_FILTERS); onReset() }}>
            {t('taskCenter.filters.reset')}
          </CdsButton>
          <CdsButton variant="primary" size="sm" onClick={() => onApply(draft)}>
            {t('common.apply')}
          </CdsButton>
        </div>
      </div>
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────────── */

const PER_PAGE = 20

export default function TaskCenter() {
  const { t }  = useTranslation()
  const toast  = useToast()
  const claim   = useClaimTask()
  const unclaim = useUnclaimTask()

  const [viewTab,    setViewTab]    = useState('active')
  const [filters,    setFilters]    = useState(EMPTY_FILTERS)
  const [page,       setPage]       = useState(1)
  const [pageSize,   setPageSize]   = useState(PER_PAGE)
  const [selected,   setSelected]   = useState<DepositTask | null>(null)
  const [assignTask, setAssignTask] = useState<DepositTask | null>(null)

  // Deep-link: /task-center?task=<id> opens that task's drawer (e.g. from Order "View in Task Center")
  const [searchParams, setSearchParams] = useSearchParams()
  const deepLinkId = searchParams.get('task')
  const { data: deepLinkTask } = useTaskDetail(deepLinkId && !selected ? deepLinkId : undefined)

  useEffect(() => {
    if (deepLinkTask && !selected) setSelected(deepLinkTask)
  }, [deepLinkTask]) // eslint-disable-line react-hooks/exhaustive-deps

  const clearDeepLink = () => {
    if (searchParams.has('task')) {
      searchParams.delete('task')
      setSearchParams(searchParams, { replace: true })
    }
  }

  const closeDrawer = () => { setSelected(null); clearDeepLink() }

  const { data: badgeData } = useTaskBadgeCount()
  const badgeCount = badgeData?.badgeCount ?? 0
  const mineCount  = badgeData?.mineCount ?? 0
  const fyiCount   = badgeData?.fyiCount ?? 0

  const hasFilters = useMemo(
    () => Object.entries(filters).some(([, v]) => v != null && v !== ''),
    [filters]
  )

  const queryParams = useMemo(() => ({
    view:  viewTab as 'active' | 'completed' | 'mine' | 'fyi',
    type:          filters.type || undefined,
    txId:          filters.txId || undefined,
    assignedTo:    filters.assignedTo || undefined,
    wait:          filters.wait || undefined,
    senderQ:       filters.senderQ || undefined,
    senderBank:    filters.senderBank || undefined,
    recipientQ:    filters.recipientQ || undefined,
    recipientBank: filters.recipientBank || undefined,
    clientQ:       filters.clientQ || undefined,
    dateFrom:      filters.dateFrom || undefined,
    dateTo:        filters.dateTo || undefined,
    page,
    limit: pageSize,
  }), [viewTab, filters, page, pageSize])

  const { data, isLoading, isFetching, isError, refetch } = useTasks(queryParams)

  const tasks      = data?.tasks      ?? []
  const total      = data?.total      ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const handleReset = () => { setFilters(EMPTY_FILTERS); setPage(1) }
  const handleApply = (next) => { setFilters(next); setPage(1) }

  const handleTabChange = (v: string) => { setViewTab(v); setPage(1); handleReset() }

  const handleClaim = (task: DepositTask) =>
    claim.mutateAsync(task.id)
      .then(() => {
        toast.show(t('taskCenter.toast.claimed'))
        setSelected({ ...task, assignedTo: 'ops_002', assignedToName: 'Alex Chen', status: 'IN_PROGRESS' })
      })
      .catch(e => toast.show(e?.message || t('taskCenter.toast.claimFailed')))

  const handleUnclaim = (task: DepositTask) =>
    unclaim.mutateAsync(task.id)
      .then(() => toast.show(t('taskCenter.toast.unclaimed')))
      .catch(e => toast.show(e?.message || t('taskCenter.toast.unclaimFailed')))

  const pillTabs = [
    { value: 'active',    label: `${t('taskCenter.tabs.active')}${badgeCount ? ` (${badgeCount})` : ''}` },
    { value: 'mine',      label: `${t('taskCenter.tabs.mine')}${mineCount ? ` (${mineCount})` : ''}` },
    { value: 'fyi',       label: `${t('taskCenter.tabs.fyi')}${fyiCount ? ` (${fyiCount})` : ''}` },
    { value: 'completed', label: t('taskCenter.tabs.completed') },
  ]

  return (
    <div className="flex flex-col gap-6">
      <CdsPageHeader breadcrumb={BREADCRUMBS} title={t('taskCenter.title')} />

      <CdsPillTabs value={viewTab} onChange={handleTabChange} items={pillTabs} />

      <TaskFilterBoard applied={filters} onApply={handleApply} onReset={handleReset} />

      {/* Results summary */}
      <div className="flex items-center gap-2 type-body text-(--muted) -mt-2">
        <span>{total} {t('taskCenter.filters.results')}</span>
        {hasFilters && (
          <>
            <span className="text-(--border-strong)">·</span>
            <button type="button" className="type-body font-semibold text-(--accent) hover:text-(--accent-hover) cursor-pointer transition-colors" onClick={handleReset}>
              {t('taskCenter.filters.clear')}
            </button>
          </>
        )}
      </div>

      {/* Active / Mine — card grid */}
      {viewTab !== 'completed' && (
        isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {[1, 2, 3].map(i => <CdsCard key={i} className="min-h-40" />)}
          </div>
        ) : isError ? (
          <CdsStatusState type="error" onRetry={refetch} />
        ) : tasks.length === 0 ? (
          <CdsStatusState type={hasFilters ? 'no-results' : 'empty'} title={t('taskCenter.emptyActive')} description={t('taskCenter.emptyActiveDesc')} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onSelect={setSelected}
                onClaim={handleClaim}
                onUnclaim={handleUnclaim}
                onAssign={setAssignTask}
                claiming={claim.isPending}
                unclaiming={unclaim.isPending}
                t={t}
              />
            ))}
          </div>
        )
      )}

      {/* Completed — table */}
      {viewTab === 'completed' && (
        <HistoryTable
          tasks={tasks}
          onSelect={setSelected}
          isLoading={isLoading}
          isFetching={isFetching}
          isError={isError}
          onRetry={refetch}
          hasFilters={hasFilters}
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
          t={t}
        />
      )}

      {selected && (
        <TaskDetailDrawer task={selected} onClose={closeDrawer} t={t} />
      )}

      {assignTask && (
        <AssignTaskModal
          task={assignTask}
          open={!!assignTask}
          onClose={() => setAssignTask(null)}
          onAssigned={() => {}}
        />
      )}
    </div>
  )
}





