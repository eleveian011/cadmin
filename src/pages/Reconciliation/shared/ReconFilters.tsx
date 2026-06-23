// @ts-nocheck
import { useState, useMemo, useEffect } from 'react'
import { ChevronDown, ChevronUp, Check } from 'lucide-react'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import {
  CdsButton, CdsInput, CdsStackedListbox, CdsDateRangePicker, CdsDropdownPanel,
} from '../../../components/cds'
import {
  CHANNEL_OPTIONS, SEVERITY_OPTIONS, OUTCOME_OPTIONS, RECON_TYPE_OPTIONS, EMPTY_RECON_FILTERS,
} from './helpers'

const LABEL = 'type-caption font-semibold text-(--text) mb-1 block'
const CELL = 'flex flex-col min-w-0'

/* ─── Multi-select dropdown for Discrepancy Type (§7.13.7) ──────── */
function OutcomeMultiSelect({ value, onChange, t }) {
  const label = value.length === 0
    ? t('recon.filter.allOutcomes')
    : t('recon.filter.outcomesSelected', { n: value.length })

  const toggle = (o) => {
    onChange(value.includes(o) ? value.filter(v => v !== o) : [...value, o])
  }

  return (
    <Popover className="relative">
      <PopoverButton className="w-full flex items-center justify-between gap-2 rounded-md border border-(--border) bg-(--surface) px-3 py-2 type-body text-(--text) hover:bg-(--item-hover) outline-none focus:border-(--accent) cursor-pointer">
        <span className={value.length ? 'text-(--text)' : 'text-(--subtle)'}>{label}</span>
        <ChevronDown size={15} className="text-(--muted) shrink-0" />
      </PopoverButton>
      <PopoverPanel anchor="bottom start" className="z-1200 mt-1">
        <CdsDropdownPanel className="w-72 p-1.5 max-h-72 overflow-y-auto">
          {OUTCOME_OPTIONS.map(o => {
            const on = value.includes(o)
            return (
              <button key={o} type="button" onClick={() => toggle(o)}
                className="w-full flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left type-body text-(--text) hover:bg-(--item-hover) cursor-pointer">
                <span>{t(`recon.outcome.${o}`)}</span>
                {on && <Check size={15} className="text-(--accent) shrink-0" />}
              </button>
            )
          })}
        </CdsDropdownPanel>
      </PopoverPanel>
    </Popover>
  )
}

/* ─── Filter board (mirrors Orders/Channel filter board) ────────── */
export function ReconFilters({ tab, applied, onApply, onReset, t }) {
  const [draft, setDraft] = useState(applied)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => { setDraft(applied) }, [applied])

  const set = (patch) => setDraft(d => ({ ...d, ...patch }))

  const withAll = (label, opts, render) => [
    { value: '', label },
    ...opts.map(o => ({ value: o, label: render ? render(o) : o })),
  ]

  const channelOpts  = useMemo(() => withAll(t('recon.filter.allChannels'), CHANNEL_OPTIONS), [t])
  const severityOpts = useMemo(() => withAll(t('recon.filter.allSeverities'), SEVERITY_OPTIONS, o => t(`recon.severity.${o}`)), [t])
  const reconTypeOpts = useMemo(() => withAll(t('recon.filter.allTypes'), RECON_TYPE_OPTIONS, o => t(`recon.reconType.${o}`)), [t])

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
        {textCell('transaction_id', t('recon.col.transactionId'), t('recon.filter.txidPlaceholder'))}
        {selectCell('channel', t('recon.col.channel'), channelOpts)}
        <div className={CELL}>
          <label className={LABEL}>{t('recon.col.outcome')}</label>
          <OutcomeMultiSelect value={draft.outcome} onChange={(v) => set({ outcome: v })} t={t} />
        </div>
        {selectCell('severity', t('recon.col.severity'), severityOpts)}
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {selectCell('recon_type', t('recon.col.reconType'), reconTypeOpts)}
          {textCell('cycle_id', t('recon.filter.cycleId'), t('recon.filter.cycleIdPlaceholder'))}
          {/* Age range (days) */}
          <div className={CELL}>
            <label className={LABEL}>{t('recon.filter.ageRange')}</label>
            <div className="flex items-center gap-2">
              <CdsInput size="md" type="number" value={draft.age_min} onChange={e => set({ age_min: e.target.value })} placeholder={t('recon.filter.min')} className="flex-1" />
              <span className="text-(--subtle)">–</span>
              <CdsInput size="md" type="number" value={draft.age_max} onChange={e => set({ age_max: e.target.value })} placeholder={t('recon.filter.max')} className="flex-1" />
            </div>
          </div>
          {/* Resolved-at range — only meaningful on the Resolved History tab */}
          {tab === 'resolved' && (
            <div className={CELL}>
              <label className={LABEL}>{t('recon.filter.resolvedRange')}</label>
              <CdsDateRangePicker size="md" value={{ from: draft.resolved_from, to: draft.resolved_to }}
                onChange={(v) => set({ resolved_from: v.from, resolved_to: v.to })} />
            </div>
          )}
        </div>
      )}

      {/* Control row */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <button type="button"
          className="inline-flex items-center gap-1 type-body font-semibold text-(--accent) hover:text-(--accent-hover) cursor-pointer transition-colors"
          onClick={() => setExpanded(v => !v)}>
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          {expanded ? t('recon.filter.collapse') : t('recon.filter.expand')}
        </button>
        <div className="flex items-center gap-2">
          <CdsButton variant="ghost" size="sm" onClick={() => { setDraft(EMPTY_RECON_FILTERS); onReset() }}>
            {t('recon.filter.reset')}
          </CdsButton>
          <CdsButton variant="primary" size="sm" onClick={() => onApply(draft)}>
            {t('common.apply')}
          </CdsButton>
        </div>
      </div>
    </div>
  )
}
