// @ts-nocheck
// Shared formatting + tone maps for the Orders tables (All + Abnormal).
import type { BadgeTone } from '../../../components/cds'

export const STATUS_TONE: Record<string, BadgeTone> = {
  'processing.auto':            'info',
  'processing.manual_review':   'warning',
  'processing.deferred':        'neutral',
  'pending.rfi_missing_fields': 'warning',
  'pending.rfi_screening':      'warning',
  'successful':                 'success',
  'failed':                     'danger',
  'refunding':                  'neutral',
  'refunded':                   'neutral',
}

export const SCREENING_TONE: Record<string, BadgeTone> = {
  pass: 'success', pending_review: 'warning', rejected: 'danger', rfi: 'warning',
}

export const CHANNEL_OPTIONS = ['GLDB', 'SGB', 'TransferMate', 'Tazapay']
export const ORDER_TYPE_OPTIONS = ['deposit']
export const CURRENCY_OPTIONS = ['SGD', 'USD', 'EUR']
export const STATUS_OPTIONS  = [
  'processing.auto', 'processing.manual_review', 'processing.deferred',
  'pending.rfi_missing_fields', 'pending.rfi_screening',
  'successful', 'failed', 'refunding', 'refunded',
]
export const PARTY_OPTIONS = ['1st_party', '3rd_party', 'unclassified']
export const REASON_OPTIONS = ['unidentified', 'status_exception', 'classification', 'missing_fields', 'screening_review']

export function fmtAmount(minor: number): string {
  return new Intl.NumberFormat('en-SG', { minimumFractionDigits: 2 }).format(minor / 100)
}

/** Single-line date+time (e.g. for credit date when compact). */
export function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-SG', {
    timeZone: 'Asia/Singapore',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

/** Split a timestamp into { date, time } for two-line display. */
export function fmtDateParts(iso: string | null): { date: string; time: string } | null {
  if (!iso) return null
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}

export function fmtDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Map a filter-board object → DepositOrdersFilter query params (undefined = unset). */
export function toOrderQuery(f: any) {
  const num = (v: string) => (v != null && v !== '' && !Number.isNaN(Number(v)) ? Number(v) : undefined)
  return {
    order_type:       f.order_type || undefined,
    status:           f.status || undefined,
    channel:          f.channel || undefined,
    currency:         f.currency || undefined,
    party:            f.party || undefined,
    reason:           f.reason || undefined,
    txid:             f.txid?.trim() || undefined,
    channel_txid:     f.channel_txid?.trim() || undefined,
    sender:           f.sender?.trim() || undefined,
    sender_bank:      f.sender_bank?.trim() || undefined,
    beneficiary:      f.beneficiary?.trim() || undefined,
    beneficiary_bank: f.beneficiary_bank?.trim() || undefined,
    client:           f.client?.trim() || undefined,
    amount_min:       num(f.amount_min),
    amount_max:       num(f.amount_max),
    date_from:        f.date_from || undefined,
    date_to:          f.date_to || undefined,
  }
}

/** True when any board filter is set. */
export function hasOrderFilters(f: any): boolean {
  return Object.values(f).some(v => v != null && v !== '')
}
