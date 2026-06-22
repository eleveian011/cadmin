// @ts-nocheck
import { useState, useMemo } from 'react'
import { ChevronRight, ChevronDown, Download } from 'lucide-react'
import {
  CdsButton, CdsBadge, CdsSpinner, CdsStatusState, useToast,
} from '../../../components/cds'
import { useReconCycles, useReconResults } from '../../../services/hooks'
import { SEVERITY_TONE, CHANNEL_TONE, fmtDate, fmtDay, shortValue } from './helpers'

/* ─── Expandable outcome group within a cycle ───────────────────── */
function OutcomeGroup({ outcome, rows, t }) {
  const [open, setOpen] = useState(false)
  const sev = rows[0]?.severity ?? 'low'
  return (
    <div className="rounded-md border border-(--border)">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-(--item-hover) cursor-pointer">
        <span className="flex items-center gap-2 min-w-0">
          {open ? <ChevronDown size={15} className="text-(--muted) shrink-0" /> : <ChevronRight size={15} className="text-(--muted) shrink-0" />}
          <CdsBadge tone={SEVERITY_TONE[sev]}>{t(`recon.outcome.${outcome}`)}</CdsBadge>
        </span>
        <span className="type-body-sm text-(--muted) tabular-nums">{t('recon.cycle.count', { n: rows.length })}</span>
      </button>
      {open && (
        <div className="border-t border-(--border) divide-y divide-(--border)">
          {rows.map(r => (
            <div key={r.id} className="flex items-center justify-between gap-2 px-3 py-2">
              <span className="type-body text-(--text) tabular-nums truncate">{r.transaction_id ?? r.channel_transaction_id ?? '—'}</span>
              <span className="type-body-sm text-(--muted) truncate max-w-[50%]">{r.discrepancy_detail}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Cycle Results tab (§7.13.7) ───────────────────────────────── */
export function CycleResultsTab({ t }) {
  const toast = useToast()
  const { data: cycles, isLoading } = useReconCycles()
  const [selected, setSelected] = useState<string | null>(null)

  // Discrepancies for the selected cycle (all outcomes within that cycle).
  const { data: resultData, isFetching } = useReconResults(
    selected ? { resolved: 'all', cycle_id: selected, per_page: 200 } : { per_page: 0 },
  )
  const rows = selected ? (resultData?.items ?? []) : []

  const grouped = useMemo(() => {
    const m = new Map<string, any[]>()
    rows.forEach(r => { m.set(r.outcome, [...(m.get(r.outcome) ?? []), r]) })
    return [...m.entries()]
  }, [rows])

  const cycle = cycles?.find(c => c.cycle_id === selected)

  if (isLoading) return <div className="flex justify-center py-16"><CdsSpinner /></div>
  if (!cycles?.length) return <CdsStatusState type="empty" title={t('recon.empty.cycles')} />

  return (
    <div className="flex flex-col gap-4">
      {/* Cycle list */}
      <div className="rounded-lg border border-(--border) divide-y divide-(--border)">
        {cycles.map(c => {
          const isSel = c.cycle_id === selected
          return (
            <div key={c.cycle_id}>
              <button type="button" onClick={() => setSelected(isSel ? null : c.cycle_id)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-(--item-hover) cursor-pointer ${isSel ? 'bg-(--accent-subtle)' : ''}`}>
                <span className="flex items-center gap-2 min-w-0">
                  {isSel ? <ChevronDown size={16} className="text-(--muted) shrink-0" /> : <ChevronRight size={16} className="text-(--muted) shrink-0" />}
                  <span className="type-body font-semibold text-(--text) tabular-nums truncate">{c.cycle_id}</span>
                  <span className="type-caption text-(--subtle)">{fmtDate(c.ran_at)}</span>
                </span>
                {/* Summary line (§7.13.7) */}
                <span className="type-body-sm text-(--muted) tabular-nums shrink-0">
                  {t('recon.cycle.summary', { total: c.total, matched: c.matched, unmatched: c.unmatched, discrepancy: c.discrepancy })}
                </span>
              </button>

              {isSel && (
                <div className="px-4 pb-4 pt-1 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="type-body-sm font-semibold text-(--text)">{t('recon.cycle.byOutcome')}</span>
                    <CdsButton variant="ghost" size="sm" icon={<Download size={14} />} onClick={() => toast.show(t('recon.export.done'))}>
                      {t('recon.export.button')}
                    </CdsButton>
                  </div>
                  {isFetching
                    ? <div className="flex justify-center py-6"><CdsSpinner size="sm" /></div>
                    : grouped.length === 0
                      ? <span className="type-body-sm text-(--muted) py-2">{t('recon.cycle.noDiscrepancies')}</span>
                      : grouped.map(([outcome, rs]) => <OutcomeGroup key={outcome} outcome={outcome} rows={rs} t={t} />)
                  }
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
