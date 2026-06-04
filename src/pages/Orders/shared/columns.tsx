// @ts-nocheck
import { useState, useMemo, useRef } from 'react'
import { SlidersHorizontal, GripVertical } from 'lucide-react'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import {
  CdsBadge, CdsStatusTag, CdsButton, CdsCheckbox, CdsCopyButton, CdsDropdownPanel,
} from '../../../components/cds'
import { STATUS_TONE, SCREENING_TONE, fmtAmount, fmtDate, fmtDateParts } from './helpers'
import { RowActions } from './RowActions'

/* ─── Column manager ────────────────────────────────────────── */

export function ColumnManageButton({ columns, hiddenKeys, onToggle, onReorder, columnOrder, t }) {
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
        <CdsButton variant="text" size="xs" icon={<SlidersHorizontal size={14} />}>{t('depositOrder.manageColumns')}</CdsButton>
      </PopoverButton>
      <PopoverPanel anchor="bottom end" className="z-1200 mt-1">
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
// COLUMNS_FACTORY

/* ─── Ageing badge (Abnormal tab) ───────────────────────────── */

// Urgency model (hours since created): >48h danger, >24h warning, else normal.
const URGENT_HOURS  = 48
const WARNING_HOURS = 24
type AgeingTier = 'green' | 'amber' | 'red'
const AGEING_TONE: Record<AgeingTier, any> = { green: 'success', amber: 'warning', red: 'danger' }
function ageHours(createdAt: string): number {
  return (Date.now() - new Date(createdAt).getTime()) / 3_600_000
}
function ageTier(hours: number): AgeingTier {
  if (hours >= URGENT_HOURS)  return 'red'
  if (hours >= WARNING_HOURS) return 'amber'
  return 'green'
}
/** Compact elapsed label: "2d 3h", "5h", "47m". */
function shortWait(createdAt: string): string {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60_000))
  const d = Math.floor(mins / 1440)
  const h = Math.floor((mins % 1440) / 60)
  const m = mins % 60
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h`
  return `${m}m`
}
function AgeingBadge({ createdAt }) {
  return <CdsBadge tone={AGEING_TONE[ageTier(ageHours(createdAt))]}>{shortWait(createdAt)}</CdsBadge>
}

/**
 * Build the ordered column array for an Orders table.
 * variant 'abnormal' inserts Ageing + Anomaly columns and frozen-right actions.
 * `hiddenCols` controls which optional columns are hidden; handlers wire row actions.
 */
export function buildOrderColumns({ variant, hiddenCols, onViewTask, onMarkRefunded, t }) {
  const txid = {
    key: 'transaction_id',
    header: t('depositOrder.col.transactionId'),
    width: '210px',
    render: (_, row) => (
      <span className="flex items-center gap-1.5">
        <span className="type-body text-(--text) tabular-nums">{row.transaction_id}</span>
        <CdsCopyButton text={row.transaction_id} />
      </span>
    ),
  }
  const status = {
    key: 'status', header: t('depositOrder.col.status'), width: '180px',
    hidden: hiddenCols.has('status'),
    render: (_, row) => {
      const key = row.status.replaceAll('.', '_')
      return <CdsStatusTag tone={STATUS_TONE[row.status] ?? 'neutral'}>{t(`depositOrder.status.${key}`)}</CdsStatusTag>
    },
  }
  const amount = {
    key: 'amount', header: t('depositOrder.col.amount'), width: '160px',
    hidden: hiddenCols.has('amount'),
    render: (_, row) => <span className="type-body tabular-nums">{fmtAmount(row.amount_minor)}&nbsp;{row.currency}</span>,
  }
  const ageing = {
    key: 'ageing', header: t('depositOrder.col.ageing'), width: '90px',
    render: (_, row) => <AgeingBadge createdAt={row.created_at} />,
  }
  const anomaly = {
    key: 'anomalous_reason', header: t('depositOrder.col.anomalousReason'), width: '200px',
    render: (_, row) => row.anomalous_reason
      ? <span className="type-body text-(--text)">{t(`depositOrder.anomalousReason.${row.anomalous_reason}`)}</span>
      : <span className="text-(--subtle)">—</span>,
  }
  const channel = {
    key: 'payment_channel', header: t('depositOrder.col.paymentChannel'), width: '130px',
    hidden: hiddenCols.has('payment_channel'),
    render: (_, row) => <span className="type-body text-(--text)">{row.payment_channel}</span>,
  }
  const valueDate = {
    key: 'value_date', header: t('depositOrder.col.valueDate'), width: '120px',
    hidden: hiddenCols.has('value_date'),
    render: (_, row) => <span className="type-body tabular-nums">{row.value_date ?? '—'}</span>,
  }
  const creditDate = {
    key: 'credit_date', header: t('depositOrder.col.creditDate'), width: '140px',
    hidden: hiddenCols.has('credit_date'),
    render: (_, row) => {
      const p = fmtDateParts(row.credit_date)
      return p ? (
        <div className="flex flex-col">
          <span className="type-body text-(--text) tabular-nums">{p.date}</span>
          <span className="type-caption text-(--muted) tabular-nums">{p.time}</span>
        </div>
      ) : <span className="text-(--subtle)">—</span>
    },
  }
  const senderName = {
    key: 'sender_name', header: t('depositOrder.col.senderName'), width: '180px',
    hidden: hiddenCols.has('sender_name'),
    render: (_, row) => row.sender_name ?? <span className="text-(--subtle)">—</span>,
  }
  const senderAccount = {
    key: 'sender_account', header: t('depositOrder.col.senderAccount'), width: '180px',
    hidden: hiddenCols.has('sender_account'),
    render: (_, row) => <span className="type-body text-(--muted) tabular-nums">{row.sender_account ?? '—'}</span>,
  }
  const senderSwift = {
    key: 'sender_bank_swift', header: t('depositOrder.col.senderSwift'), width: '130px',
    hidden: hiddenCols.has('sender_bank_swift'),
    render: (_, row) => <span className="type-body text-(--muted) tabular-nums">{row.sender_bank_swift ?? '—'}</span>,
  }
  const senderBankName = {
    key: 'sender_bank_name', header: t('depositOrder.col.senderBankName'), width: '180px',
    hidden: hiddenCols.has('sender_bank_name'),
    render: (_, row) => row.sender_bank_name ?? <span className="text-(--subtle)">—</span>,
  }
  const beneName = {
    key: 'beneficiary_name', header: t('depositOrder.col.beneficiaryName'), width: '180px',
    hidden: hiddenCols.has('beneficiary_name'),
    render: (_, row) => row.beneficiary_name ?? <span className="text-(--danger-text) italic">{t('depositOrder.unidentified')}</span>,
  }
  const beneAccount = {
    key: 'beneficiary_account', header: t('depositOrder.col.beneficiaryAccount'), width: '160px',
    hidden: hiddenCols.has('beneficiary_account'),
    render: (_, row) => <span className="type-body text-(--muted) tabular-nums">{row.beneficiary_account ?? '—'}</span>,
  }
  const beneCode = {
    key: 'beneficiary_code', header: t('depositOrder.col.beneficiaryCode'), width: '150px',
    hidden: hiddenCols.has('beneficiary_code'),
    render: (_, row) => <span className="type-body text-(--muted)">{row.beneficiary_code ?? '—'}</span>,
  }
  const beneBank = {
    key: 'beneficiary_bank_name', header: t('depositOrder.col.beneficiaryBank'), width: '170px',
    hidden: hiddenCols.has('beneficiary_bank_name'),
    render: (_, row) => row.beneficiary_bank_name ?? <span className="text-(--subtle)">—</span>,
  }
  const referenceCode = {
    key: 'reference_code', header: t('depositOrder.col.referenceCode'), width: '150px',
    hidden: hiddenCols.has('reference_code'),
    render: (_, row) => <span className="type-body tabular-nums text-(--muted)">{row.reference_code ?? '—'}</span>,
  }
  const party = {
    key: 'party_classification', header: t('depositOrder.col.partyClassification'), width: '120px',
    hidden: hiddenCols.has('party_classification'),
    render: (_, row) => row.party_classification === 'unclassified'
      ? <span className="type-body text-(--danger-text) italic">{t('depositOrder.party.unclassified')}</span>
      : <span className="type-body text-(--muted)">{t(`depositOrder.party.${row.party_classification}`)}</span>,
  }
  const ruleStep = {
    key: 'matched_rule_step', header: t('depositOrder.col.matchedRuleStep'), width: '120px',
    hidden: hiddenCols.has('matched_rule_step'),
    render: (_, row) => row.matched_rule_step != null
      ? <span className="type-body text-(--muted)">Step {row.matched_rule_step}</span>
      : <span className="text-(--subtle)">—</span>,
  }
  const screening = {
    key: 'screening_result', header: t('depositOrder.col.screeningResult'), width: '150px',
    hidden: hiddenCols.has('screening_result'),
    render: (_, row) => row.screening_result
      ? <CdsBadge tone={SCREENING_TONE[row.screening_result] ?? 'neutral'}>{t(`depositOrder.screening.${row.screening_result}`)}</CdsBadge>
      : <span className="text-(--subtle)">—</span>,
  }
  const opsHandler = {
    key: 'ops_handler', header: t('depositOrder.col.opsHandler'), width: '140px',
    hidden: hiddenCols.has('ops_handler'),
    render: (_, row) => row.ops_handler ?? <span className="text-(--subtle)">—</span>,
  }
  const remarks = {
    key: 'remarks', header: t('depositOrder.col.remarks'), width: '220px',
    hidden: hiddenCols.has('remarks'),
    render: (_, row) => <span className="type-body text-(--muted) line-clamp-2">{row.remarks ?? '—'}</span>,
  }
  const createdAt = {
    key: 'created_at', header: t('depositOrder.col.createdAt'), width: '150px',
    hidden: hiddenCols.has('created_at'),
    render: (_, row) => {
      const p = fmtDateParts(row.created_at)
      return p ? (
        <div className="flex flex-col">
          <span className="type-body text-(--text) tabular-nums">{p.date}</span>
          <span className="type-caption text-(--muted) tabular-nums">{p.time}</span>
        </div>
      ) : <span className="text-(--subtle)">—</span>
    },
  }
  const actions = {
    key: '_actions', header: '', width: '1%', frozen: 'right',
    render: (_, row) => (
      <RowActions row={row} onViewTask={onViewTask} onMarkRefunded={onMarkRefunded} t={t} />
    ),
  }

  const head = [txid, status, amount]
  const mid  = variant === 'abnormal' ? [ageing, anomaly] : []
  const rest = [
    channel, valueDate, creditDate,
    senderName, senderAccount, senderSwift, senderBankName,
    beneName, beneAccount, beneCode, beneBank,
    referenceCode, party, ruleStep, screening,
    opsHandler, remarks, createdAt,
  ]
  // All Orders is read-only — no frozen action column. Abnormal keeps Task / Mark Refunded.
  const tail = variant === 'abnormal' ? [actions] : []
  return [...head, ...mid, ...rest, ...tail]
}

