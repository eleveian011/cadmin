// @ts-nocheck
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, ArrowRight } from 'lucide-react'
import {
  CdsModal, CdsBadge, CdsButton, CdsInput, CdsTextarea, useToast,
} from '../../../components/cds'
import { useResolveReconResult } from '../../../services/hooks'
import {
  SEVERITY_TONE, CHANNEL_TONE, COMPARE_FIELDS, fmtDate, ageInDays,
} from './helpers'

/* ─── Side-by-side comparison cards (mismatched fields in red) ──── */

const FIELD_LABELS = {
  amount: 'Amount', currency: 'Currency', fee_amount: 'Fee', status: 'Status',
  counterparty_name: 'Counterparty Name', counterparty_account_no: 'Counterparty Account No',
  payment_reference: 'Payment Reference', value_date: 'Value Date',
}

function CompareCard({ title, snapshot, mismatch }) {
  // Only show fields present on either side; handled by the parent passing the union.
  return (
    <div className="flex-1 rounded-lg border border-(--border) bg-(--surface) p-3 min-w-0">
      <div className="type-caption font-semibold text-(--muted) uppercase tracking-wide mb-2">{title}</div>
      <div className="flex flex-col">
        {COMPARE_FIELDS.filter(f => snapshot?.[f] != null).map(f => {
          const bad = mismatch.includes(f)
          return (
            <div key={f} className="flex flex-col gap-0.5 py-1.5 border-b border-(--border) last:border-b-0">
              <span className="type-caption text-(--muted)">{FIELD_LABELS[f] ?? f}</span>
              <span className={`type-body tabular-nums wrap-break-word ${bad ? 'text-(--danger-text) font-bold' : 'text-(--text)'}`}>
                {snapshot[f]}
              </span>
            </div>
          )
        })}
        {!snapshot && <span className="type-body-sm text-(--subtle) py-1.5">—</span>}
      </div>
    </div>
  )
}

/* ─── Discrepancy timeline (first_seen → cycle updates → resolved) ── */
function Timeline({ result, t }) {
  const dot = (active) => `absolute rounded-full border-2 border-(--surface) ${active ? 'bg-(--success)' : 'bg-(--border-strong)'}`
  const steps = [
    { label: t('recon.detail.firstSeen'), time: result.first_seen_at, on: true },
    { label: t('recon.detail.lastSeen', { n: result.cycle_count }), time: result.last_seen_at, on: true },
    ...(result.resolved_at ? [{ label: t('recon.detail.resolved'), time: result.resolved_at, on: true }] : []),
  ]
  return (
    <div className="relative" style={{ paddingLeft: '24px' }}>
      {steps.map((s, i) => (
        <div key={i} className="relative flex flex-col gap-0.5 pb-4 last:pb-0">
          {i < steps.length - 1 && <div className="absolute border-l border-(--border-strong)" style={{ left: '-19px', top: '15px', bottom: '0' }} />}
          <div className={dot(s.on)} style={{ width: '11px', height: '11px', left: '-24px', top: '4px' }} />
          <span className="type-body font-semibold text-(--text)">{s.label}</span>
          <span className="type-caption text-(--subtle)">{fmtDate(s.time)}</span>
        </div>
      ))}
    </div>
  )
}

/* ─── Detail modal ──────────────────────────────────────────────── */
export function ReconDetailModal({ result, open, onClose, onResolve, t }) {
  if (!result) return null
  const isResolved = !!result.resolved_at
  const age = ageInDays(result.first_seen_at)

  return (
    <CdsModal open={open} onClose={onClose} size="2xl" headerMode="close" title={t('recon.detail.title')} dismissOnBackdrop>
      <div className="flex flex-col gap-5">
        {/* Header summary */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <span className="type-h4 font-semibold text-(--text) tabular-nums">{result.transaction_id ?? '—'}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <CdsBadge tone={CHANNEL_TONE[result.payment_channel] ?? 'neutral'} soft>{result.payment_channel}</CdsBadge>
            <CdsBadge tone={SEVERITY_TONE[result.severity]} soft>{t(`recon.outcome.${result.outcome}`)}</CdsBadge>
            <CdsBadge tone={SEVERITY_TONE[result.severity]} soft>{t(`recon.severity.${result.severity}`)}</CdsBadge>
          </div>
        </div>

        {/* Discrepancy detail line */}
        <div className="rounded-md bg-(--fill) px-3 py-2.5 type-body-sm text-(--text)">{result.discrepancy_detail}</div>

        {/* Side-by-side comparison */}
        <div>
          <div className="type-body-sm font-semibold text-(--text) mb-2.5">{t('recon.detail.comparison')}</div>
          <div className="flex items-stretch gap-3">
            <CompareCard title={t('recon.detail.channelSide')} snapshot={result.channel_value} mismatch={result.mismatch_fields} />
            <CompareCard title={t('recon.detail.orderSide')} snapshot={result.order_value} mismatch={result.mismatch_fields} />
          </div>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-2">
          <div className="flex justify-between border-b border-(--border) py-1.5">
            <span className="type-caption text-(--muted)">{t('recon.col.reconType')}</span>
            <span className="type-body text-(--text)">{t(`recon.reconType.${result.recon_type}`)}</span>
          </div>
          <div className="flex justify-between border-b border-(--border) py-1.5">
            <span className="type-caption text-(--muted)">{t('recon.col.cycleId')}</span>
            <span className="type-body text-(--text) tabular-nums">{result.cycle_id}</span>
          </div>
          <div className="flex justify-between border-b border-(--border) py-1.5">
            <span className="type-caption text-(--muted)">{t('recon.detail.channelTxId')}</span>
            <span className="type-body text-(--text) tabular-nums">{result.channel_transaction_id ?? '—'}</span>
          </div>
          <div className="flex justify-between border-b border-(--border) py-1.5">
            <span className="type-caption text-(--muted)">{t('recon.col.age')}</span>
            <span className="type-body text-(--text) tabular-nums">{t('recon.daysShort', { n: age })}</span>
          </div>
          <div className="flex justify-between border-b border-(--border) py-1.5">
            <span className="type-caption text-(--muted)">{t('recon.col.cycleCount')}</span>
            <span className="type-body text-(--text) tabular-nums">{result.cycle_count}</span>
          </div>
        </div>

        {/* Timeline */}
        <div>
          <div className="type-body-sm font-semibold text-(--text) mb-2.5">{t('recon.detail.timeline')}</div>
          <Timeline result={result} t={t} />
        </div>

        {/* Cross-links */}
        <div className="flex items-center gap-4 flex-wrap">
          {result.transaction_id && (
            <Link to={`/orders?txid=${encodeURIComponent(result.transaction_id)}`}
              className="inline-flex items-center gap-1.5 type-body-sm font-semibold text-(--accent) hover:text-(--accent-hover)">
              <ExternalLink size={14} /> {t('recon.detail.viewInOrders')}
            </Link>
          )}
          <span className="inline-flex items-center gap-1.5 type-body-sm text-(--muted)">
            <ExternalLink size={14} /> {t('recon.detail.viewChannelTxn')}
          </span>
        </div>

        {/* Resolution */}
        {isResolved ? (
          <div className="rounded-lg border border-(--success-border) bg-(--success-bg) p-4 flex flex-col gap-1.5">
            <span className="type-body-sm font-semibold text-(--success-text)">{t('recon.detail.resolvedTitle')}</span>
            <span className="type-body text-(--text)">{result.resolution_note}</span>
            {result.resolved_by && (
              <span className="type-caption text-(--muted)">{t('recon.col.resolvedBy')}: {result.resolved_by}</span>
            )}
            {result.correction_order && (
              <span className="type-caption text-(--muted)">{t('recon.resolve.correctionOrder')}: {result.correction_order}</span>
            )}
          </div>
        ) : (
          <div className="flex justify-end">
            <CdsButton variant="primary" size="md" icon={<ArrowRight size={15} />} iconPosition="right" onClick={() => onResolve(result)}>
              {t('recon.actions.resolve')}
            </CdsButton>
          </div>
        )}
      </div>
    </CdsModal>
  )
}

/* ─── Resolve modal (required note + optional correction order) ──── */
export function ResolveModal({ result, open, onClose, t }) {
  const toast = useToast()
  const resolve = useResolveReconResult()
  const [note, setNote] = useState('')
  const [order, setOrder] = useState('')

  useEffect(() => { if (open) { setNote(''); setOrder('') } }, [open, result?.id])

  const valid = note.trim().length > 0

  const handleConfirm = () => {
    if (!valid || !result) return
    resolve.mutateAsync({ id: result.id, resolution_note: note.trim(), correction_order: order.trim() || null })
      .then(() => { toast.show(t('recon.resolve.done')); onClose() })
      .catch(e => toast.show(e?.message || 'Failed to resolve'))
  }

  return (
    <CdsModal
      open={open}
      onClose={onClose}
      size="md"
      headerMode="close"
      title={t('recon.resolve.title')}
      footer={[
        { label: t('recon.resolve.confirm'), variant: 'primary', onClick: handleConfirm, loading: resolve.isPending, disabled: !valid || resolve.isPending },
        { label: t('common.cancel'), onClick: onClose },
      ]}
      dismissOnBackdrop
    >
      <div className="flex flex-col gap-4">
        <div className="type-body-sm text-(--muted)">
          {t('recon.col.transactionId')}: <span className="text-(--text) font-medium tabular-nums">{result?.transaction_id ?? '—'}</span>
          <span className="mx-2">·</span>
          {result && t(`recon.outcome.${result.outcome}`)}
        </div>
        <div>
          <label className="type-caption font-semibold text-(--text) mb-1 block">
            {t('recon.resolve.note')} <span className="text-(--danger)">*</span>
          </label>
          <CdsTextarea value={note} onChange={setNote} rows={3} placeholder={t('recon.resolve.notePlaceholder')} />
        </div>
        <div>
          <label className="type-caption font-semibold text-(--text) mb-1 block">{t('recon.resolve.correctionOrder')}</label>
          <CdsInput size="md" value={order} onChange={e => setOrder(e.target.value)} onClear={() => setOrder('')} placeholder="ADJ-…" />
        </div>
      </div>
    </CdsModal>
  )
}
