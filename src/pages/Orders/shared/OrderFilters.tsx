// @ts-nocheck
import { useState, useMemo, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import {
  CdsButton, CdsInput, CdsStackedListbox, CdsDateRangePicker,
} from '../../../components/cds'
import {
  CHANNEL_OPTIONS, STATUS_OPTIONS, PARTY_OPTIONS, REASON_OPTIONS,
  ORDER_TYPE_OPTIONS, CURRENCY_OPTIONS,
} from './helpers'

/* ─── Filter board ───────────────────────────────────────────── */
// Mirrors the Task Center filter board: a bordered board, 4-per-row responsive
// grid, draft/Apply model, expand/collapse. Single-select dropdowns + text inputs.

export const EMPTY_ORDER_FILTERS = {
  order_type: '', txid: '', channel_txid: '', status: '', channel: '', currency: '',
  amount_min: '', amount_max: '',
  date_from: null, date_to: null,
  party: '', reason: '',
  sender: '', sender_bank: '', beneficiary: '', beneficiary_bank: '', client: '',
}

const LABEL = 'type-caption font-semibold text-(--text) mb-1 block'
const CELL = 'flex flex-col min-w-0'

export function OrderFilters({ applied, onApply, onReset, count, t }) {
  const [draft, setDraft] = useState(applied)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => { setDraft(applied) }, [applied])

  const set = (patch) => setDraft(d => ({ ...d, ...patch }))

  const withAll = (label, opts, render) => [
    { value: '', label },
    ...opts.map(o => ({ value: o, label: render ? render(o) : o })),
  ]

  const orderTypeOpts = useMemo(() => withAll(t('depositOrder.filter.allOrderTypes'), ORDER_TYPE_OPTIONS, o => t(`depositOrder.orderType.${o}`)), [t])
  const statusOpts    = useMemo(() => withAll(t('depositOrder.filter.allStatuses'), STATUS_OPTIONS, o => t(`depositOrder.status.${o.replaceAll('.', '_')}`)), [t])
  const channelOpts   = useMemo(() => withAll(t('depositOrder.filter.allChannels'), CHANNEL_OPTIONS), [t])
  const currencyOpts  = useMemo(() => withAll(t('depositOrder.filter.allCurrencies'), CURRENCY_OPTIONS), [t])
  const partyOpts     = useMemo(() => withAll(t('depositOrder.filter.allParties'), PARTY_OPTIONS, o => t(`depositOrder.party.${o}`)), [t])
  const reasonOpts    = useMemo(() => withAll(t('depositOrder.filter.allReasons'), REASON_OPTIONS, o => t(`depositOrder.anomalousReason.${o}`)), [t])

  const textCell = (key, label, placeholder) => (
    <div className={CELL}>
      <label className={LABEL}>{label}</label>
      <CdsInput size="md" value={draft[key]} onChange={e => set({ [key]: e.target.value })}
        onClear={() => set({ [key]: '' })} placeholder={placeholder} />
    </div>
  )

  const selectCell = (key, label, options) => (
    <div className={CELL}>
      <label className={LABEL}>{label}</label>
      <CdsStackedListbox size="md" value={draft[key]} onChange={v => set({ [key]: v })}
        options={options} buttonWidthClass="w-full" anchor="bottom start" />
    </div>
  )

  return (
    <div className="rounded-lg border border-(--border) bg-(--surface) p-4 flex flex-col gap-3">
      {/* Default — 4 filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {textCell('txid', t('depositOrder.filter.transactionId'), t('depositOrder.filter.transactionIdPlaceholder'))}
        {textCell('channel_txid', t('depositOrder.col.channelTransactionId'), t('depositOrder.filter.channelTxidPlaceholder'))}
        {selectCell('status', t('depositOrder.filter.status'), statusOpts)}
        {selectCell('channel', t('depositOrder.filter.channel'), channelOpts)}
      </div>

      {/* Expanded — remaining filters */}
      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {selectCell('order_type', t('depositOrder.filter.orderType'), orderTypeOpts)}
          {selectCell('currency', t('depositOrder.filter.currency'), currencyOpts)}
          {/* Amount range */}
          <div className={CELL}>
            <label className={LABEL}>{t('depositOrder.filter.amount')}</label>
            <div className="flex items-center gap-2">
              <CdsInput size="md" type="number" value={draft.amount_min} onChange={e => set({ amount_min: e.target.value })} placeholder={t('depositOrder.filter.min')} className="flex-1" />
              <span className="text-(--subtle)">–</span>
              <CdsInput size="md" type="number" value={draft.amount_max} onChange={e => set({ amount_max: e.target.value })} placeholder={t('depositOrder.filter.max')} className="flex-1" />
            </div>
          </div>
          {/* Date range */}
          <div className={CELL}>
            <label className={LABEL}>{t('depositOrder.filter.dateRange')}</label>
            <CdsDateRangePicker size="md" value={{ from: draft.date_from, to: draft.date_to }}
              onChange={(v) => set({ date_from: v.from, date_to: v.to })} />
          </div>
          {selectCell('party', t('depositOrder.col.classification'), partyOpts)}
          {selectCell('reason', t('depositOrder.col.internalReason'), reasonOpts)}
          {textCell('sender', t('depositOrder.filter.sender'), t('depositOrder.filter.senderPlaceholder'))}
          {textCell('sender_bank', t('depositOrder.filter.senderBank'), t('depositOrder.filter.senderBankPlaceholder'))}
          {textCell('beneficiary', t('depositOrder.filter.beneficiary'), t('depositOrder.filter.beneficiaryPlaceholder'))}
          {textCell('beneficiary_bank', t('depositOrder.filter.beneficiaryBank'), t('depositOrder.filter.beneficiaryBankPlaceholder'))}
          {textCell('client', t('depositOrder.filter.client'), t('depositOrder.filter.clientPlaceholder'))}
        </div>
      )}

      {/* Control row */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <button type="button"
          className="inline-flex items-center gap-1 type-body font-semibold text-(--accent) hover:text-(--accent-hover) cursor-pointer transition-colors"
          onClick={() => setExpanded(v => !v)}>
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          {expanded ? t('depositOrder.filter.collapse') : t('depositOrder.filter.expand')}
        </button>
        <div className="flex items-center gap-2">
          <CdsButton variant="ghost" size="sm" onClick={() => { setDraft(EMPTY_ORDER_FILTERS); onReset() }}>
            {t('depositOrder.filter.reset')}
          </CdsButton>
          <CdsButton variant="primary" size="sm" onClick={() => onApply(draft)}>
            {t('common.apply')}
          </CdsButton>
        </div>
      </div>
    </div>
  )
}
