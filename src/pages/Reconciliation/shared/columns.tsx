// @ts-nocheck
import { CdsBadge, CdsCopyButton, CdsTooltip, CdsButton } from '../../../components/cds'
import {
  SEVERITY_TONE, CHANNEL_TONE, ageInDays, ageTone, fmtDay, shortValue,
} from './helpers'

/**
 * Build the column array for the reconciliation discrepancy table (§7.13.7).
 * `variant` tweaks columns per tab: 'open' shows Age/Cycle Count + Resolve action;
 * 'resolved' shows Resolved At + Resolution Note instead.
 */
export function buildReconColumns({ variant, onResolve, t }) {
  const txid = {
    key: 'transaction_id', header: t('recon.col.transactionId'), width: '180px', frozen: 'left',
    render: (_, row) => (
      <span className="flex items-center gap-1.5 min-w-0">
        <span className="type-body font-semibold text-(--accent) tabular-nums truncate">
          {row.transaction_id ?? '—'}
        </span>
        {row.transaction_id && <CdsCopyButton text={row.transaction_id} />}
      </span>
    ),
  }
  const channel = {
    key: 'payment_channel', header: t('recon.col.channel'), width: '130px',
    render: (_, row) => <CdsBadge tone={CHANNEL_TONE[row.payment_channel] ?? 'neutral'}>{row.payment_channel}</CdsBadge>,
  }
  const outcome = {
    key: 'outcome', header: t('recon.col.outcome'), width: '200px',
    render: (_, row) => (
      <CdsBadge tone={SEVERITY_TONE[row.severity]}>{t(`recon.outcome.${row.outcome}`)}</CdsBadge>
    ),
  }
  const channelValue = {
    key: 'channel_value', header: t('recon.col.channelValue'), width: '140px',
    render: (_, row) => {
      const s = shortValue(row.channel_value)
      return s ? <span className="type-body text-(--text) tabular-nums">{s}</span> : <span className="text-(--subtle)">—</span>
    },
  }
  const orderValue = {
    key: 'order_value', header: t('recon.col.orderValue'), width: '140px',
    render: (_, row) => {
      const s = shortValue(row.order_value)
      return s ? <span className="type-body text-(--text) tabular-nums">{s}</span> : <span className="text-(--subtle)">—</span>
    },
  }
  const detail = {
    key: 'discrepancy_detail', header: t('recon.col.detail'), width: '260px',
    render: (_, row) => (
      <CdsTooltip content={row.discrepancy_detail}>
        <span className="type-body text-(--muted) truncate block max-w-[260px]">{row.discrepancy_detail}</span>
      </CdsTooltip>
    ),
  }
  const firstSeen = {
    key: 'first_seen_at', header: t('recon.col.firstSeen'), width: '120px',
    render: (_, row) => <span className="type-body text-(--muted) tabular-nums">{fmtDay(row.first_seen_at)}</span>,
  }
  const age = {
    key: 'age', header: t('recon.col.age'), width: '90px',
    render: (_, row) => {
      const d = ageInDays(row.first_seen_at)
      return <span className={`type-body font-semibold tabular-nums ${ageTone(d)}`}>{t('recon.daysShort', { n: d })}</span>
    },
  }
  const cycleCount = {
    key: 'cycle_count', header: t('recon.col.cycleCount'), width: '100px', align: 'center',
    render: (_, row) => <span className="type-body text-(--muted) tabular-nums">{row.cycle_count}</span>,
  }
  const severity = {
    key: 'severity', header: t('recon.col.severity'), width: '110px',
    render: (_, row) => <CdsBadge tone={SEVERITY_TONE[row.severity]}>{t(`recon.severity.${row.severity}`)}</CdsBadge>,
  }
  const resolvedAt = {
    key: 'resolved_at', header: t('recon.col.resolvedAt'), width: '120px',
    render: (_, row) => <span className="type-body text-(--muted) tabular-nums">{fmtDay(row.resolved_at)}</span>,
  }
  const resolutionNote = {
    key: 'resolution_note', header: t('recon.col.resolutionNote'), width: '260px',
    render: (_, row) => row.resolution_note
      ? <CdsTooltip content={row.resolution_note}><span className="type-body text-(--muted) truncate block max-w-[260px]">{row.resolution_note}</span></CdsTooltip>
      : <span className="text-(--subtle)">—</span>,
  }
  const actions = {
    key: '_actions', header: '', width: '1%', frozen: 'right',
    render: (_, row) => (
      <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
        <CdsButton variant="text" size="xs" onClick={() => onResolve(row)}>{t('recon.actions.resolve')}</CdsButton>
      </div>
    ),
  }

  if (variant === 'resolved') {
    return [txid, channel, outcome, channelValue, orderValue, severity, firstSeen, resolvedAt, resolutionNote]
  }
  // open / cycle
  return [txid, channel, outcome, channelValue, orderValue, detail, firstSeen, age, cycleCount, severity, actions]
}
