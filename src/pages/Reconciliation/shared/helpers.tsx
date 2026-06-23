// @ts-nocheck
// Shared tone maps + formatting for the Reconciliation Report page (§7.13.7).
import type { BadgeTone } from '../../../components/cds'
import type { ReconSeverity, ReconChannel, ReconValueSnapshot } from '../../../types/reconciliation'

/** Severity → badge tone (§7.13.7: red=Critical, amber=High, yellow=Medium, grey=Low). */
export const SEVERITY_TONE: Record<ReconSeverity, BadgeTone> = {
  critical: 'danger',
  high:     'warning',
  medium:   'warning',
  low:      'neutral',
}

/** Payment channel → badge tone (matches ChannelAccounts). */
export const CHANNEL_TONE: Record<ReconChannel, BadgeTone> = {
  GLDB:         'primary',
  SGB:          'info',
  TransferMate: 'success',
  Tazapay:      'warning',
}

export const CHANNEL_OPTIONS: ReconChannel[] = ['GLDB', 'SGB', 'TransferMate', 'Tazapay']
export const SEVERITY_OPTIONS: ReconSeverity[] = ['critical', 'high', 'medium', 'low']
export const RECON_TYPE_OPTIONS = ['hourly', 'daily']

/** All discrepancy outcome types shown on the page (Match is audit-only, excluded). */
export const OUTCOME_OPTIONS = [
  'UnmatchedChannelTransaction',
  'MissingChannelTransaction',
  'AmountMismatch',
  'FeeMismatch',
  'CurrencyMismatch',
  'CounterpartyNameMismatch',
  'CounterpartyAccountNoMismatch',
  'PaymentReferenceMismatch',
  'ValueDateMismatch',
  'StatusAnomaly',
  'StatusContradiction',
  'OrphanDuplicate',
]

/** Whole-days elapsed since an ISO timestamp. */
export function ageInDays(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

/** Age colour threshold (§7.13.7): >30d red, >7d amber, else muted. */
export function ageTone(days: number): string {
  if (days > 30) return 'text-(--danger-text)'
  if (days > 7)  return 'text-(--warning-text)'
  return 'text-(--muted)'
}

/** Single-line date+time in SGT. */
export function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-SG', {
    timeZone: 'Asia/Singapore',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

/** Date-only in SGT. */
export function fmtDay(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-SG', {
    timeZone: 'Asia/Singapore', year: 'numeric', month: '2-digit', day: '2-digit',
  })
}

/** Short "1000.00 SGD" summary from a value snapshot (Channel/Order Value columns). */
export function shortValue(v: ReconValueSnapshot | null): string | null {
  if (!v) return null
  if (v.amount != null && v.currency) return `${v.amount} ${v.currency}`
  if (v.status) return v.status
  return null
}

/** The ordered field keys shown in the side-by-side comparison cards. */
export const COMPARE_FIELDS = [
  'amount', 'currency', 'fee_amount', 'status',
  'counterparty_name', 'counterparty_account_no', 'payment_reference', 'value_date',
]

/** Map a filter-board object → ReconResultsFilter query params (undefined = unset). */
export function toReconQuery(f: any) {
  const num = (v: string) => (v != null && v !== '' && !Number.isNaN(Number(v)) ? Number(v) : undefined)
  return {
    cycle_id:       f.cycle_id?.trim() || undefined,
    transaction_id: f.transaction_id?.trim() || undefined,
    channel:        f.channel || undefined,
    recon_type:     f.recon_type || undefined,
    outcome:        f.outcome?.length ? f.outcome.join(',') : undefined,
    severity:       f.severity || undefined,
    age_min:        num(f.age_min),
    age_max:        num(f.age_max),
    resolved_from:  f.resolved_from || undefined,
    resolved_to:    f.resolved_to || undefined,
  }
}

export const EMPTY_RECON_FILTERS = {
  cycle_id: '', transaction_id: '', channel: '', recon_type: '', outcome: [], severity: '',
  age_min: '', age_max: '', resolved_from: null, resolved_to: null,
}

export function hasReconFilters(f: any): boolean {
  return Object.values(f).some(v => Array.isArray(v) ? v.length > 0 : (v != null && v !== ''))
}
