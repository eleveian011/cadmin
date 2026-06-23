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
export function buildOrderColumns({ variant, hiddenCols, onViewTask, t }) {
  const h = (k) => hiddenCols.has(k)
  // Plain text cell helper.
  const txt = (key, label, width, accessor, opts = {}) => ({
    key, header: t(label), width, hidden: h(key),
    render: (_, row) => {
      const v = accessor(row)
      return (v == null || v === '')
        ? <span className="text-(--subtle)">—</span>
        : <span className={`type-body text-(--text) ${opts.mono ? 'tabular-nums' : ''} ${opts.muted ? 'text-(--muted)' : ''}`}>{v}</span>
    },
  })
  const money = (minor, ccy) => minor == null ? null : `${fmtAmount(minor)} ${ccy ?? ''}`.trim()

  const txid = {
    key: 'transaction_id', header: t('depositOrder.col.transactionId'), width: '200px',
    render: (_, row) => (
      <span className="flex items-center gap-1.5">
        <span className="type-body text-(--text) tabular-nums">{row.transaction_id}</span>
        <CdsCopyButton text={row.transaction_id} />
      </span>
    ),
  }
  const channelTxid = {
    key: 'channel_transaction_id', header: t('depositOrder.col.channelTransactionId'), width: '180px',
    hidden: h('channel_transaction_id'),
    render: (_, row) => row.channel_transaction_id
      ? <span className="flex items-center gap-1.5">
          <span className="type-body text-(--text) tabular-nums">{row.channel_transaction_id}</span>
          <CdsCopyButton text={row.channel_transaction_id} />
        </span>
      : <span className="text-(--subtle)">—</span>,
  }
  const status = {
    key: 'status', header: t('depositOrder.col.status'), width: '180px',
    hidden: h('status'),
    render: (_, row) => {
      const key = row.status.replaceAll('.', '_')
      return <CdsStatusTag tone={STATUS_TONE[row.status] ?? 'neutral'}>{t(`depositOrder.status.${key}`)}</CdsStatusTag>
    },
  }
  const subStatus = txt('sub_status', 'depositOrder.col.subStatus', '160px', r => r.sub_status, { muted: true })
  const internalReason = {
    key: 'internal_reason', header: t('depositOrder.col.internalReason'), width: '180px',
    hidden: h('internal_reason'),
    render: (_, row) => row.internal_reason
      ? <span className="type-body text-(--text)">{t(`depositOrder.anomalousReason.${row.internal_reason}`)}</span>
      : <span className="text-(--subtle)">—</span>,
  }
  const amount = {
    key: 'amount', header: t('depositOrder.col.amount'), width: '150px',
    hidden: h('amount'),
    render: (_, row) => <span className="type-body tabular-nums">{fmtAmount(row.amount_minor)}&nbsp;{row.currency}</span>,
  }
  const currency = txt('currency', 'depositOrder.col.currency', '90px', r => r.currency)
  const creditedAmount = {
    key: 'credited_amount', header: t('depositOrder.col.creditedAmount'), width: '150px',
    hidden: h('credited_amount'),
    render: (_, row) => {
      const v = money(row.credited_amount_minor, row.credited_currency)
      return v ? <span className="type-body tabular-nums">{v}</span> : <span className="text-(--subtle)">—</span>
    },
  }
  const channelFee = {
    key: 'channel_fee_amount', header: t('depositOrder.col.channelFee'), width: '140px',
    hidden: h('channel_fee_amount'),
    render: (_, row) => {
      const v = money(row.channel_fee_amount_minor, row.channel_fee_currency)
      return v ? <span className="type-body tabular-nums text-(--muted)">{v}</span> : <span className="text-(--subtle)">—</span>
    },
  }
  const serviceFee = {
    key: 'service_fee_amount', header: t('depositOrder.col.serviceFee'), width: '140px',
    hidden: h('service_fee_amount'),
    render: (_, row) => {
      const v = money(row.service_fee_amount_minor, row.service_fee_currency)
      return v ? <span className="type-body tabular-nums text-(--muted)">{v}</span> : <span className="text-(--subtle)">—</span>
    },
  }
  const ageing = {
    key: 'ageing', header: t('depositOrder.col.ageing'), width: '90px',
    render: (_, row) => <AgeingBadge createdAt={row.created_at} />,
  }
  const channel = txt('payment_channel', 'depositOrder.col.paymentChannel', '130px', r => r.payment_channel)
  const transactionType = txt('transaction_type', 'depositOrder.col.transactionType', '130px', r => r.transaction_type)
  const orderCategory = txt('order_category', 'depositOrder.col.orderCategory', '120px', r => r.order_category)
  const bankTransferType = txt('bank_transfer_type', 'depositOrder.col.bankTransferType', '130px', r => r.bank_transfer_type)
  const channelAccountNo = txt('channel_account_no', 'depositOrder.col.channelAccountNo', '160px', r => r.channel_account_no, { mono: true, muted: true })
  const accountType = {
    key: 'account_type', header: t('depositOrder.col.accountType'), width: '140px',
    hidden: h('account_type'),
    render: (_, row) => <span className="type-body text-(--text)">{t(`channelAccount.accountType.${row.account_type}`)}</span>,
  }
  const valueDate = txt('value_date', 'depositOrder.col.valueDate', '120px', r => r.value_date, { mono: true })
  const creditDate = {
    key: 'credit_date', header: t('depositOrder.col.creditDate'), width: '140px',
    hidden: h('credit_date'),
    render: (_, row) => {
      const p = fmtDateParts(row.credit_date)
      return p ? <div className="flex flex-col"><span className="type-body text-(--text) tabular-nums">{p.date}</span><span className="type-caption text-(--muted) tabular-nums">{p.time}</span></div> : <span className="text-(--subtle)">—</span>
    },
  }
  // Counterparty
  const cpName = txt('counterparty_name', 'depositOrder.col.counterpartyName', '180px', r => r.counterparty_name)
  const cpAccount = txt('counterparty_account_no', 'depositOrder.col.counterpartyAccountNo', '180px', r => r.counterparty_account_no, { mono: true, muted: true })
  const cpBankName = txt('counterparty_bank_name', 'depositOrder.col.counterpartyBankName', '180px', r => r.counterparty_bank_name)
  const cpSwift = txt('counterparty_bank_swift_bic', 'depositOrder.col.counterpartySwift', '140px', r => r.counterparty_bank_swift_bic, { mono: true, muted: true })
  const cpBankCountry = txt('counterparty_bank_country', 'depositOrder.col.counterpartyBankCountry', '120px', r => r.counterparty_bank_country)
  const cpCountry = txt('counterparty_country', 'depositOrder.col.counterpartyCountry', '120px', r => r.counterparty_country)
  const paymentRef = txt('payment_reference', 'depositOrder.col.paymentReference', '160px', r => r.payment_reference, { mono: true, muted: true })
  // Beneficiary
  const beneName = {
    key: 'beneficiary_name', header: t('depositOrder.col.beneficiaryName'), width: '180px',
    hidden: h('beneficiary_name'),
    render: (_, row) => row.beneficiary_name ?? <span className="text-(--danger-text) italic">{t('depositOrder.unidentified')}</span>,
  }
  const beneAccount = txt('beneficiary_account_no', 'depositOrder.col.beneficiaryAccountNo', '160px', r => r.beneficiary_account_no, { mono: true, muted: true })
  const beneBankName = txt('beneficiary_bank_name', 'depositOrder.col.beneficiaryBank', '170px', r => r.beneficiary_bank_name)
  const beneSwift = txt('beneficiary_bank_swift_bic', 'depositOrder.col.beneficiarySwift', '140px', r => r.beneficiary_bank_swift_bic, { mono: true, muted: true })
  const participantCode = txt('participant_code', 'depositOrder.col.participantCode', '150px', r => r.participant_code, { muted: true })
  const referenceCode = txt('reference_code', 'depositOrder.col.referenceCode', '150px', r => r.reference_code, { mono: true, muted: true })
  const classification = {
    key: 'classification', header: t('depositOrder.col.classification'), width: '120px',
    hidden: h('classification'),
    render: (_, row) => row.classification === 'unclassified'
      ? <span className="type-body text-(--danger-text) italic">{t('depositOrder.party.unclassified')}</span>
      : <span className="type-body text-(--muted)">{t(`depositOrder.party.${row.classification}`)}</span>,
  }
  const ruleStep = {
    key: 'matched_rule_step', header: t('depositOrder.col.matchedRuleStep'), width: '120px',
    hidden: h('matched_rule_step'),
    render: (_, row) => row.matched_rule_step != null
      ? <span className="type-body text-(--muted)">Step {row.matched_rule_step}</span>
      : <span className="text-(--subtle)">—</span>,
  }
  const screening = {
    key: 'screening_result', header: t('depositOrder.col.screeningResult'), width: '150px',
    hidden: h('screening_result'),
    render: (_, row) => row.screening_result
      ? <CdsBadge tone={SCREENING_TONE[row.screening_result] ?? 'neutral'}>{t(`depositOrder.screening.${row.screening_result}`)}</CdsBadge>
      : <span className="text-(--subtle)">—</span>,
  }
  const opsHandler = txt('ops_handler', 'depositOrder.col.opsHandler', '140px', r => r.ops_handler)
  const remarks = {
    key: 'remarks', header: t('depositOrder.col.remarks'), width: '220px',
    hidden: h('remarks'),
    render: (_, row) => <span className="type-body text-(--muted) line-clamp-2">{row.remarks ?? '—'}</span>,
  }
  const dateCell = (key, label) => ({
    key, header: t(label), width: '150px', hidden: h(key),
    render: (_, row) => {
      const p = fmtDateParts(row[key])
      return p ? <div className="flex flex-col"><span className="type-body text-(--text) tabular-nums">{p.date}</span><span className="type-caption text-(--muted) tabular-nums">{p.time}</span></div> : <span className="text-(--subtle)">—</span>
    },
  })
  const createdAt = dateCell('created_at', 'depositOrder.col.createdAt')
  const updatedAt = dateCell('updated_at', 'depositOrder.col.updatedAt')
  const actions = {
    key: '_actions', header: '', width: '1%', frozen: 'right',
    render: (_, row) => (
      <RowActions row={row} onViewTask={onViewTask} t={t} />
    ),
  }

  const head = [txid, channelTxid, status]
  const mid  = variant === 'abnormal' ? [ageing, internalReason] : []
  // Full field set (§7.12 orders schema) — toggle/reorder via Manage Columns.
  const rest = [
    subStatus,
    transactionType, orderCategory, bankTransferType,
    channel, channelAccountNo, accountType,
    amount, currency, creditedAmount, channelFee, serviceFee,
    cpName, cpAccount, cpBankName, cpSwift, cpBankCountry, cpCountry, paymentRef,
    beneName, beneAccount, beneBankName, beneSwift, participantCode,
    referenceCode, classification, ruleStep, screening,
    valueDate, creditDate,
    opsHandler, remarks, createdAt, updatedAt,
  ]
  const tail = variant === 'abnormal' ? [actions] : []
  return [...head, ...mid, ...rest, ...tail]
}

