// @ts-nocheck
import { useState, useMemo, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { CdsButton, CdsInput, CdsStackedListbox } from '../../../components/cds'
import {
  CHANNEL_OPTIONS, ACCOUNT_TYPE_OPTIONS, CLIENT_STATUS_OPTIONS, MAPPING_STATUS_OPTIONS, CURRENCY_OPTIONS, EMPTY_ACCOUNT_FILTERS,
} from './helpers'

/* ─── Filter board ───────────────────────────────────────────── */
// Mirrors the Orders / Task Center filter board: a bordered board, 4-per-row
// responsive grid, draft/Apply model, expand/collapse. Single-select dropdowns
// (each with an "All" option) + text inputs.

const LABEL = 'type-caption font-semibold text-(--text) mb-1 block'
const CELL = 'flex flex-col min-w-0'

export function AccountFilters({ applied, onApply, onReset, count, t }) {
  const [draft, setDraft] = useState(applied)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => { setDraft(applied) }, [applied])

  const set = (patch) => setDraft(d => ({ ...d, ...patch }))

  const withAll = (label, opts, render) => [
    { value: '', label },
    ...opts.map(o => ({ value: o, label: render ? render(o) : o })),
  ]

  const channelOpts = useMemo(() => withAll(t('channelAccount.filter.allChannels'), CHANNEL_OPTIONS), [t])
  const typeOpts    = useMemo(() => withAll(t('channelAccount.filter.allTypes'), ACCOUNT_TYPE_OPTIONS, o => t(`channelAccount.accountType.${o}`)), [t])
  const statusOpts  = useMemo(() => withAll(t('channelAccount.filter.allStatuses'), CLIENT_STATUS_OPTIONS, o => t(`channelAccount.clientStatus.${o}`)), [t])
  const mappingOpts = useMemo(() => withAll(t('channelAccount.filter.allStatuses'), MAPPING_STATUS_OPTIONS, o => t(`channelAccount.mappingStatus.${o}`)), [t])
  const currencyOpts = useMemo(() => withAll(t('channelAccount.filter.allCurrencies'), CURRENCY_OPTIONS), [t])

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
        {selectCell('channel', t('channelAccount.col.channel'), channelOpts)}
        {selectCell('account_type', t('channelAccount.col.accountType'), typeOpts)}
        {textCell('user_channel_account', t('channelAccount.col.userChannelAccountNumber'), t('channelAccount.filter.userChannelAccountPlaceholder'))}
        {textCell('channel_account', t('channelAccount.col.channelAccountNumber'), t('channelAccount.filter.accountNumberPlaceholder'))}
      </div>

      {/* Expanded — remaining filters */}
      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {textCell('client_q', t('channelAccount.filter.client'), t('channelAccount.filter.clientPlaceholder'))}
          {textCell('reference_code', t('channelAccount.col.referenceCode'), t('channelAccount.filter.referenceCodePlaceholder'))}
          {selectCell('currency', t('channelAccount.col.currency'), currencyOpts)}
          {selectCell('participant_status', t('channelAccount.col.clientStatusCol'), statusOpts)}
          {selectCell('mapping_status', t('channelAccount.col.channelAccountStatus'), mappingOpts)}
        </div>
      )}

      {/* Control row */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <button type="button"
          className="inline-flex items-center gap-1 type-body font-semibold text-(--accent) hover:text-(--accent-hover) cursor-pointer transition-colors"
          onClick={() => setExpanded(v => !v)}>
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          {expanded ? t('channelAccount.filter.collapse') : t('channelAccount.filter.expand')}
        </button>
        <div className="flex items-center gap-2">
          <CdsButton variant="ghost" size="sm" onClick={() => { setDraft(EMPTY_ACCOUNT_FILTERS); onReset() }}>
            {t('channelAccount.filter.reset')}
          </CdsButton>
          <CdsButton variant="primary" size="sm" onClick={() => onApply(draft)}>
            {t('common.apply')}
          </CdsButton>
        </div>
      </div>
    </div>
  )
}
