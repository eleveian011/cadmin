// @ts-nocheck
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Users, FileSearch, FileX, CheckCircle2, ShieldAlert, Ban, RotateCcw, ExternalLink } from 'lucide-react'
import {
  CdsPageHeader, CdsPillTabs, CdsFilterPanel, CdsFilterPill,
  CdsCard, CdsStatusTag, CdsButton, CdsRadio,
  CdsInput, CdsStatusState,
  CdsTable, CdsTableState, CdsPagination,
  CdsDrawer, CdsDetailList, CdsDetailRow,
  CdsDialog, CdsTextarea, CdsCopyButton, CdsBadge, useToast,
} from '../../components/cds'
import type { BreadcrumbItem, CdsTableColumn } from '../../components/cds'
import {
  useTasks, useTaskBadgeCount, useClaimTask, useUnclaimTask,
  useCompleteTask, useAddTaskNote,
  useConfirmRecipient, useRetryTask, useClassifyTask, useFillFields,
  useRejectRefund, useApproveScreening, useCloseNoAction,
} from '../../services/hooks'
import type { DepositTask, DepositTaskType, TaskStatus } from '../../types/task'

const BREADCRUMBS: BreadcrumbItem[] = [{ label: 'Task Center' }]

/* ─── Task type metadata ────────────────────────────────────── */

const TASK_TYPE_ICON: Record<DepositTaskType, React.ReactNode> = {
  DEPOSIT_RECIPIENT_MATCHING:    <Users size={18} />,
  DEPOSIT_STATUS_EXCEPTION:      <AlertTriangle size={18} />,
  DEPOSIT_CLASSIFICATION:        <FileSearch size={18} />,
  DEPOSIT_MISSING_FIELDS_FYI:    <FileX size={18} />,
  DEPOSIT_SCREENING_REVIEW:      <ShieldAlert size={18} />,
  DEPOSIT_WEBHOOK_PARSE_FAILURE: <AlertTriangle size={18} />,
}

const STATUS_TONE: Record<TaskStatus, 'warning' | 'primary' | 'success' | 'danger'> = {
  PENDING:     'warning',
  IN_PROGRESS: 'primary',
  COMPLETED:   'success',
  ABNORMAL:    'danger',
}

// PRD §7.7.2 — escalation only applies to DEPOSIT_RECIPIENT_MATCHING (unclaimed funds)
const ESCALATION_TONE: Record<1 | 2 | 3, 'warning' | 'danger' | 'primary'> = {
  1: 'warning',
  2: 'danger',
  3: 'primary',
}

/* ─── Helpers ───────────────────────────────────────────────── */

function formatWait(createdAt: string): string {
  const ms   = Date.now() - new Date(createdAt).getTime()
  const mins = Math.floor(ms / 60_000)
  const d    = Math.floor(mins / 1440)
  const h    = Math.floor((mins % 1440) / 60)
  const m    = mins % 60
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function fmtDateTime(iso: string): string {
  const d   = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/* ─── Urgency tab ────────────────────────────────────────────── */

function AgeingTab({ createdAt, taskType, escalationLevel, status }) {
  if (status === 'COMPLETED') return null
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000)
  if (days < 7) return null

  // DEPOSIT_RECIPIENT_MATCHING uses PRD §7.7.2 escalation copy; others use generic ageing copy
  let label: string
  let cls: string
  if (taskType === 'DEPOSIT_RECIPIENT_MATCHING' && escalationLevel >= 3) {
    label = 'Mandatory Escalation'
    cls   = 'bg-(--primary-border) text-(--primary-text)'
  } else if (taskType === 'DEPOSIT_RECIPIENT_MATCHING' && escalationLevel >= 2) {
    label = 'Mandatory Review'
    cls   = 'bg-(--danger-border) text-(--danger-text)'
  } else if (days >= 30) {
    label = `${days}d — Overdue`
    cls   = 'bg-(--danger-border) text-(--danger-text)'
  } else {
    label = `${days}d`
    cls   = 'bg-(--warning-border) text-(--warning-text)'
  }

  return (
    <span className={`absolute top-0 left-1/2 -translate-x-1/2 type-caption font-bold rounded-b-md px-2.5 py-0.5 ${cls}`}>
      {label}
    </span>
  )
}

/* ─── Task Card ──────────────────────────────────────────────── */

function TaskCard({ task, onSelect, onClaim, onUnclaim, claiming, unclaiming, t }) {
  const typeLabel   = t(`taskCenter.taskType.${task.taskType}`)
  const statusLabel = t(`taskCenter.status.${task.status}`)
  const icon        = TASK_TYPE_ICON[task.taskType]
  const isTerminal  = task.status === 'COMPLETED'
  const isMine      = task.assignedTo === 'ops_002'
  const canClaim    = !isTerminal && !task.assignedTo
  const canUnclaim  = !isTerminal && isMine
  const stop        = (e, fn) => { e.stopPropagation(); fn(task) }
  const linkClass   = 'type-body font-bold text-(--accent) hover:underline cursor-pointer'

  return (
    <CdsCard onClick={() => onSelect(task)} className="relative overflow-hidden cursor-pointer">
      <AgeingTab createdAt={task.created_at} taskType={task.taskType} escalationLevel={task.escalationLevel ?? 0} status={task.status} />

      {/* Title row */}
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 text-(--text)">
          {icon}
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
          <span className="text-(--text)">{task.amountDisplay}</span>
        </div>
        <p className="type-body-sm text-(--subtle) line-clamp-2 mt-0.5">{t(`taskCenter.taskTypeDesc.${task.taskType}`)}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 w-full mt-auto">
        <span className="type-body text-(--muted) min-w-0 truncate">
          {task.assignedToName
            ? <>{t('taskCenter.card.assignedTo')} <span className="font-medium text-(--text)">{task.assignedToName}</span></>
            : <span className="text-(--subtle)">{t('taskCenter.card.unassigned')}</span>}
        </span>
        <div className="flex shrink-0 items-center gap-3">
          {canClaim   && <button type="button" className={linkClass} disabled={claiming}   onClick={(e) => stop(e, onClaim)}>{t('taskCenter.actions.claim')}</button>}
          {canUnclaim && <button type="button" className={linkClass} disabled={unclaiming} onClick={(e) => stop(e, onUnclaim)}>{t('taskCenter.actions.unclaim')}</button>}
        </div>
      </div>
    </CdsCard>
  )
}

/* ─── Task Drawer ────────────────────────────────────────────── */

const AUDIT_LABEL: Record<string, string> = {
  TASK_CREATED:            'created',
  TASK_CLAIMED:            'claimed',
  TASK_UNCLAIMED:          'unclaimed',
  TASK_COMPLETED:          'completed',
  TASK_NOTE:               'note',
  TASK_ABNORMAL:           'abnormal',
  TASK_RECIPIENT_CONFIRMED:'recipientConfirmed',
  TASK_RETRIED:            'retried',
  TASK_CLASSIFIED:         'classified',
  TASK_FIELDS_FILLED:      'fieldsFilled',
  TASK_REJECTED_REFUND:    'rejectedRefund',
  TASK_SCREENING_APPROVED: 'screeningApproved',
  TASK_CLOSED_NO_ACTION:   'closedNoAction',
}

function titleCase(s: string) {
  return s.toLowerCase().split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

const MATCH_BASIS_LABEL: Record<string, string> = {
  reference_similar: 'Similar reference',
  va_parent:         'VA parent',
  name_fuzzy:        'Name match',
  saved_payer:       'Saved payer',
}

/* ── Recipient matching panel (DEPOSIT_RECIPIENT_MATCHING) ─────── */

function RecipientMatchPanel({ task, selected, onSelect, t }) {
  const candidates = task.candidates ?? []
  return (
    <div>
      <div className="type-body-lg font-semibold text-(--text) mb-2">{t('taskCenter.panel.candidates')}</div>
      {candidates.length === 0 ? (
        <div className="rounded-md bg-(--fill) px-3 py-3 type-body-sm text-(--muted)">
          {t('taskCenter.panel.noCandidates')}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {candidates.map(c => {
            const active = selected?.participant_code === c.participant_code
            return (
              <button
                type="button"
                key={c.participant_code}
                onClick={() => onSelect(c)}
                className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors cursor-pointer ${active ? 'border-(--accent) bg-(--accent-subtle)' : 'border-(--border) hover:bg-(--item-hover)'}`}
              >
                <CdsRadio checked={active} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="type-body font-semibold text-(--text)">{c.client_name}</span>
                    <CdsBadge tone="neutral">{MATCH_BASIS_LABEL[c.match_basis] ?? c.match_basis}</CdsBadge>
                    {c.name_match_score != null && (
                      <span className="type-caption text-(--muted)">score {c.name_match_score.toFixed(2)}</span>
                    )}
                  </div>
                  <div className="type-caption text-(--muted) tabular-nums">{c.participant_code} · {c.account_number}</div>
                </div>
              </button>
            )
          })}
        </div>
      )}
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
      <div className="type-body-lg font-semibold text-(--text) mb-1">{t('taskCenter.panel.missingFields')}</div>
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

function TaskDetailDrawer({ task, onClose, t }) {
  const [tab,         setTab]         = useState('details')
  const [noteMode,    setNoteMode]    = useState(false)
  const [noteText,    setNoteText]    = useState('')

  // type-specific working state
  const [candidate,   setCandidate]   = useState(null)              // recipient matching
  const [classify,    setClassify]    = useState('')               // classification
  const [fieldValues, setFieldValues] = useState({})               // missing fields
  const [dialog,      setDialog]      = useState<null | 'confirmRecipient' | 'retry' | 'classify' | 'fillFields' | 'approveScreening' | 'rejectRefund' | 'closeNoAction' | 'complete'>(null)
  const [dialogInput, setDialogInput] = useState('')

  const toast    = useToast()
  const addNote          = useAddTaskNote()
  const complete         = useCompleteTask()
  const confirmRecipient = useConfirmRecipient()
  const retryTask        = useRetryTask()
  const classifyTask     = useClassifyTask()
  const fillFields       = useFillFields()
  const rejectRefund     = useRejectRefund()
  const approveScreening = useApproveScreening()
  const closeNoAction    = useCloseNoAction()

  const isMine     = task.assignedTo === 'ops_002'
  const isTerminal = task.status === 'COMPLETED'
  const isAbnormal = task.status === 'ABNORMAL'
  const canAct     = isMine && !isTerminal
  const type       = task.taskType

  const done = (msg) => { toast.show(msg); setDialog(''); onClose() }
  const fail = (e, fallback) => toast.show(e?.message || fallback)

  const handleNote = () => {
    if (!noteText.trim()) return
    addNote.mutateAsync({ id: task.id, comment: noteText.trim() })
      .then(() => { toast.show(t('taskCenter.toast.noteSaved')); setNoteMode(false); setNoteText('') })
      .catch(e => fail(e, 'Failed to save note'))
  }

  const runDialog = () => {
    const input = dialogInput.trim()
    switch (dialog) {
      case 'confirmRecipient':
        confirmRecipient.mutateAsync({ id: task.id, participant_code: candidate.participant_code, client_name: candidate.client_name, account_number: candidate.account_number })
          .then(() => done(t('taskCenter.toast.recipientConfirmed'))).catch(e => fail(e, 'Failed'))
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
      case 'complete':
        complete.mutateAsync({ id: task.id, comment: input || undefined })
          .then(() => done(t('taskCenter.toast.completed'))).catch(e => fail(e, t('taskCenter.toast.completeFailed')))
        break
    }
  }

  // missing-fields completeness check
  const requiredFieldsFilled = (task.missingFields ?? [])
    .filter(f => f.required)
    .every(f => (fieldValues[f.key] ?? '').trim())

  /* ── Footer: per-type primary/secondary actions ───────────────── */
  let footer = null
  if (canAct && !isAbnormal) {
    const secondary = (
      <CdsButton variant="ghost" className="flex-1" onClick={() => setNoteMode(v => !v)}>
        {t('taskCenter.actions.addNote')}
      </CdsButton>
    )

    if (type === 'DEPOSIT_RECIPIENT_MATCHING') {
      footer = (
        <div className="flex gap-2 w-full">
          <CdsButton variant="primary" className="flex-1" disabled={!candidate} onClick={() => setDialog('confirmRecipient')}>
            {t('taskCenter.actions.confirmRecipient')}
          </CdsButton>
          <CdsButton variant="ghost" className="flex-1" onClick={() => { setDialogInput(''); setDialog('rejectRefund') }}>
            {t('taskCenter.actions.rejectRefund')}
          </CdsButton>
        </div>
      )
    } else if (type === 'DEPOSIT_STATUS_EXCEPTION') {
      footer = (
        <div className="flex gap-2 w-full">
          <CdsButton variant="primary" className="flex-1" onClick={() => { setDialogInput(''); setDialog('retry') }}>
            {t('taskCenter.actions.retry')}
          </CdsButton>
          {secondary}
        </div>
      )
    } else if (type === 'DEPOSIT_CLASSIFICATION') {
      footer = (
        <div className="flex gap-2 w-full">
          <CdsButton variant="primary" className="flex-1" disabled={!classify} onClick={() => setDialog('classify')}>
            {t('taskCenter.actions.confirmClassification')}
          </CdsButton>
          {secondary}
        </div>
      )
    } else if (type === 'DEPOSIT_MISSING_FIELDS_FYI') {
      footer = (
        <div className="flex gap-2 w-full">
          <CdsButton variant="primary" className="flex-1" disabled={!requiredFieldsFilled} onClick={() => setDialog('fillFields')}>
            {t('taskCenter.actions.saveFields')}
          </CdsButton>
          {secondary}
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
    } else if (type === 'DEPOSIT_WEBHOOK_PARSE_FAILURE') {
      footer = (
        <CdsButton variant="primary" className="w-full" onClick={() => { setDialogInput(''); setDialog('closeNoAction') }}>
          {t('taskCenter.actions.closeNoAction')}
        </CdsButton>
      )
    }
  }

  const hasLinkedOrder = !!task.depositOrderId

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
              <span className="type-h4 font-semibold text-(--text)">{t(`taskCenter.taskType.${task.taskType}`)}</span>
              <CdsStatusTag tone={STATUS_TONE[task.status]}>{t(`taskCenter.status.${task.status}`)}</CdsStatusTag>
            </div>

            {isAbnormal && (
              <div className="flex items-start gap-3 rounded-lg border border-(--danger-border) bg-(--danger-bg) p-4">
                <AlertTriangle size={18} className="text-(--danger) shrink-0 mt-0.5" />
                <div>
                  <div className="type-body font-semibold text-(--danger)">Abnormal Task</div>
                  <div className="type-body-sm text-(--muted) mt-1">{t('taskCenter.abnormalWarning')}</div>
                </div>
              </div>
            )}

            <div>
              <div className="type-body-lg font-semibold text-(--text) mb-2">Description</div>
              <p className="type-body text-(--muted)">{t(`taskCenter.taskTypeDesc.${task.taskType}`)}</p>
            </div>

            {/* Deposit info — hidden for parse-failure (no deposit record) */}
            {type !== 'DEPOSIT_WEBHOOK_PARSE_FAILURE' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="type-body-lg font-semibold text-(--text)">{t('taskCenter.drawer.depositInfo')}</span>
                  {hasLinkedOrder && (
                    <CdsButton variant="text" size="xs" icon={<ExternalLink size={13} />}
                      onClick={() => window.alert(`Open in Order Center: ${task.transactionId}`)}>
                      {t('taskCenter.actions.viewInOrderCenter')}
                    </CdsButton>
                  )}
                </div>
                <CdsDetailList>
                  <CdsDetailRow label="Transaction ID" value={task.transactionId} copyText={task.transactionId} />
                  <CdsDetailRow label="Amount"         value={task.amountDisplay} />
                  <CdsDetailRow label="Task ID"        value={task.id} copyText={task.id} />
                  <CdsDetailRow label="Created"        value={fmtDateTime(task.created_at)} />
                  <CdsDetailRow label="Assigned To"    value={task.assignedToName ?? '—'} />
                </CdsDetailList>
              </div>
            )}

            {/* Type-specific action panels (interactive only when actionable) */}
            {type === 'DEPOSIT_RECIPIENT_MATCHING' && !isTerminal && (
              <RecipientMatchPanel task={task} selected={candidate} onSelect={setCandidate} t={t} />
            )}
            {type === 'DEPOSIT_CLASSIFICATION' && !isTerminal && !isAbnormal && (
              <ClassifyPanel task={task} value={classify} onChange={setClassify} t={t} />
            )}
            {type === 'DEPOSIT_MISSING_FIELDS_FYI' && !isTerminal && (
              <MissingFieldsPanel task={task} values={fieldValues} onChange={(k, v) => setFieldValues(p => ({ ...p, [k]: v }))} t={t} />
            )}
            {type === 'DEPOSIT_WEBHOOK_PARSE_FAILURE' && (
              <ParseFailurePanel task={task} t={t} />
            )}

            {noteMode && (
              <div className="flex flex-col gap-2">
                <CdsTextarea value={noteText} onChange={setNoteText} placeholder={t('taskCenter.drawer.completePlaceholder')} />
                <div className="flex gap-2">
                  <CdsButton variant="primary" size="sm" loading={addNote.isPending} onClick={handleNote}>Save Note</CdsButton>
                  <CdsButton variant="ghost"   size="sm" onClick={() => { setNoteMode(false); setNoteText('') }}>Cancel</CdsButton>
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

      {/* Confirm recipient */}
      <CdsDialog
        open={dialog === 'confirmRecipient'} onClose={() => setDialog('')}
        icon={<CheckCircle2 />} tone="success"
        title={t('taskCenter.dialog.confirmRecipientTitle')}
        description={candidate ? t('taskCenter.dialog.confirmRecipientDesc', { name: candidate.client_name }) : ''}
        confirmLabel={t('taskCenter.actions.confirmRecipient')}
        onConfirm={runDialog} confirmLoading={confirmRecipient.isPending}
        cancelLabel="Cancel" onCancel={() => setDialog('')}
      />

      {/* Retry */}
      <CdsDialog
        open={dialog === 'retry'} onClose={() => setDialog('')}
        icon={<RotateCcw />} tone="primary"
        title={t('taskCenter.dialog.retryTitle')}
        description={t('taskCenter.dialog.retryDesc')}
        confirmLabel={t('taskCenter.actions.retry')}
        onConfirm={runDialog} confirmLoading={retryTask.isPending}
        cancelLabel="Cancel" onCancel={() => setDialog('')}
      >
        <CdsTextarea value={dialogInput} onChange={setDialogInput} placeholder={t('taskCenter.dialog.noteOptional')} />
      </CdsDialog>

      {/* Classify */}
      <CdsDialog
        open={dialog === 'classify'} onClose={() => setDialog('')}
        icon={<FileSearch />} tone="primary"
        title={t('taskCenter.dialog.classifyTitle')}
        description={classify ? t('taskCenter.dialog.classifyDesc', { label: t(`depositOrder.party.${classify}`) }) : ''}
        confirmLabel={t('taskCenter.actions.confirmClassification')}
        onConfirm={runDialog} confirmLoading={classifyTask.isPending}
        cancelLabel="Cancel" onCancel={() => setDialog('')}
      />

      {/* Fill fields */}
      <CdsDialog
        open={dialog === 'fillFields'} onClose={() => setDialog('')}
        icon={<FileX />} tone="primary"
        title={t('taskCenter.dialog.fillFieldsTitle')}
        description={t('taskCenter.dialog.fillFieldsDesc')}
        confirmLabel={t('taskCenter.actions.saveFields')}
        onConfirm={runDialog} confirmLoading={fillFields.isPending}
        cancelLabel="Cancel" onCancel={() => setDialog('')}
      />

      {/* Approve screening */}
      <CdsDialog
        open={dialog === 'approveScreening'} onClose={() => setDialog('')}
        icon={<CheckCircle2 />} tone="success"
        title={t('taskCenter.dialog.approveScreeningTitle')}
        description={t('taskCenter.dialog.approveScreeningDesc')}
        confirmLabel={t('taskCenter.actions.approveScreening')}
        onConfirm={runDialog} confirmLoading={approveScreening.isPending}
        cancelLabel="Cancel" onCancel={() => setDialog('')}
      >
        <CdsTextarea value={dialogInput} onChange={setDialogInput} placeholder={t('taskCenter.dialog.noteOptional')} />
      </CdsDialog>

      {/* Reject → refund */}
      <CdsDialog
        open={dialog === 'rejectRefund'} onClose={() => setDialog('')}
        icon={<Ban />} tone="danger"
        title={t('taskCenter.dialog.rejectRefundTitle')}
        description={t('taskCenter.dialog.rejectRefundDesc')}
        confirmLabel={t('taskCenter.actions.rejectRefund')} confirmVariant="primary"
        onConfirm={runDialog} confirmLoading={rejectRefund.isPending}
        confirmDisabled={!dialogInput.trim()}
        cancelLabel="Cancel" onCancel={() => setDialog('')}
      >
        <CdsTextarea value={dialogInput} onChange={setDialogInput} placeholder={t('taskCenter.dialog.reasonRequired')} />
      </CdsDialog>

      {/* Close — no action (parse failure) */}
      <CdsDialog
        open={dialog === 'closeNoAction'} onClose={() => setDialog('')}
        icon={<Ban />} tone="neutral"
        title={t('taskCenter.dialog.closeNoActionTitle')}
        description={t('taskCenter.dialog.closeNoActionDesc')}
        confirmLabel={t('taskCenter.actions.closeNoAction')}
        onConfirm={runDialog} confirmLoading={closeNoAction.isPending}
        confirmDisabled={!dialogInput.trim()}
        cancelLabel="Cancel" onCancel={() => setDialog('')}
      >
        <CdsTextarea value={dialogInput} onChange={setDialogInput} placeholder={t('taskCenter.dialog.reasonRequired')} />
      </CdsDialog>
    </CdsDrawer>
  )
}

/* ─── History Table ──────────────────────────────────────────── */

function HistoryTable({ tasks, onSelect, isLoading, isFetching, isError, onRetry, hasFilters, page, totalPages, pageSize, onPageChange, onPageSizeChange, t }) {
  const columns: CdsTableColumn<DepositTask>[] = useMemo(() => [
    {
      key: 'taskType',
      header: 'Type',
      width: '220px',
      render: (_, row) => (
        <div className="flex items-center gap-2 text-(--text)">
          {TASK_TYPE_ICON[row.taskType]}
          <span className="type-body font-semibold">{t(`taskCenter.taskType.${row.taskType}`)}</span>
        </div>
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
      render: (_, row) => <span className="type-body font-mono text-(--accent)">{row.transactionId}</span>,
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
      header: 'Completed',
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

/* ─── Task type filter options ───────────────────────────────── */

const TASK_TYPES: DepositTaskType[] = [
  'DEPOSIT_RECIPIENT_MATCHING',
  'DEPOSIT_STATUS_EXCEPTION',
  'DEPOSIT_CLASSIFICATION',
  'DEPOSIT_MISSING_FIELDS_FYI',
  'DEPOSIT_SCREENING_REVIEW',
  'DEPOSIT_WEBHOOK_PARSE_FAILURE',
]

/* ─── Page ──────────────────────────────────────────────────── */

const PER_PAGE = 20

export default function TaskCenter() {
  const { t }  = useTranslation()
  const toast  = useToast()
  const claim   = useClaimTask()
  const unclaim = useUnclaimTask()

  const [viewTab,    setViewTab]    = useState('active')
  const [typeFilter, setTypeFilter] = useState('')
  const [draftType,  setDraftType]  = useState('')
  const [txIdFilter, setTxIdFilter] = useState('')
  const [draftTxId,  setDraftTxId]  = useState('')
  const [page,       setPage]       = useState(1)
  const [pageSize,   setPageSize]   = useState(PER_PAGE)
  const [selected,   setSelected]   = useState<DepositTask | null>(null)

  const { data: badgeData } = useTaskBadgeCount()
  const badgeCount = badgeData?.badgeCount ?? 0

  const hasFilters = !!typeFilter || !!txIdFilter

  const queryParams = useMemo(() => ({
    view:  viewTab as 'active' | 'completed' | 'mine',
    type:  typeFilter || undefined,
    q:     txIdFilter || undefined,
    page,
    limit: pageSize,
  }), [viewTab, typeFilter, txIdFilter, page, pageSize])

  const { data, isLoading, isFetching, isError, refetch } = useTasks(queryParams)

  const tasks      = data?.tasks      ?? []
  const total      = data?.total      ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const handleReset = () => {
    setTypeFilter(''); setDraftType('')
    setTxIdFilter(''); setDraftTxId('')
    setPage(1)
  }

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
    { value: 'mine',      label: t('taskCenter.tabs.mine') },
    { value: 'completed', label: t('taskCenter.tabs.completed') },
  ]

  const typePillLabel = typeFilter ? t(`taskCenter.taskType.${typeFilter}`) : null

  return (
    <div className="flex flex-col gap-4">
      <CdsPageHeader breadcrumb={BREADCRUMBS} title={t('taskCenter.title')} />

      <CdsPillTabs value={viewTab} onChange={handleTabChange} items={pillTabs} />

      <CdsFilterPanel active={!!hasFilters} count={total} onClear={handleReset}>
        <CdsFilterPill
          title={t('taskCenter.filters.type')}
          value={typePillLabel}
          onClear={() => { setTypeFilter(''); setDraftType(''); setPage(1) }}
        >
          {({ close }) => (
            <div className="flex flex-col gap-3">
              <span className="type-body font-bold text-(--text)">{t('taskCenter.filters.type')}</span>
              <div className="flex flex-col gap-0.5">
                <label className="flex items-center gap-2 rounded-md px-2 py-1.5 type-body-sm text-(--text) hover:bg-(--item-hover) cursor-pointer" onClick={() => setDraftType('')}>
                  <CdsRadio checked={draftType === ''} />
                  All Types
                </label>
                {TASK_TYPES.map(tt => (
                  <label key={tt} className="flex items-center gap-2 rounded-md px-2 py-1.5 type-body-sm text-(--text) hover:bg-(--item-hover) cursor-pointer" onClick={() => setDraftType(tt)}>
                    <CdsRadio checked={draftType === tt} />
                    {t(`taskCenter.taskType.${tt}`)}
                  </label>
                ))}
              </div>
              <CdsButton variant="primary" size="sm" className="w-full" onClick={() => { setTypeFilter(draftType); setPage(1); close() }}>Apply</CdsButton>
            </div>
          )}
        </CdsFilterPill>

        <CdsFilterPill
          title={t('taskCenter.filters.transactionId')}
          value={txIdFilter || null}
          onClear={() => { setTxIdFilter(''); setDraftTxId(''); setPage(1) }}
        >
          {({ close }) => (
            <div className="flex flex-col gap-3">
              <span className="type-body font-bold text-(--text)">{t('taskCenter.filters.transactionId')}</span>
              <CdsInput
                value={draftTxId}
                onChange={e => setDraftTxId(e.target.value)}
                onClear={() => setDraftTxId('')}
                placeholder={t('taskCenter.filters.transactionIdPlaceholder')}
                size="md"
                autoFocus
              />
              <CdsButton variant="primary" size="sm" className="w-full" onClick={() => { setTxIdFilter(draftTxId.trim()); setPage(1); close() }}>Apply</CdsButton>
            </div>
          )}
        </CdsFilterPill>
      </CdsFilterPanel>

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
        <TaskDetailDrawer task={selected} onClose={() => setSelected(null)} t={t} />
      )}
    </div>
  )
}
