// @ts-nocheck
// Shared tone maps + formatting for the Channel Accounts (Fiat Account Mapping
// Reference Table) page. Mirrors the Orders `helpers.tsx` pattern.
import type { BadgeTone } from '../../../components/cds'
import type { ClientStatus, ChannelAccountChannel } from '../../../types/channel-account'

/** Client status → badge tone (§7.4 colour coding; only Active is non-blocking). */
export const STATUS_TONE: Record<ClientStatus, BadgeTone> = {
  active:    'success',
  initial:   'warning',
  suspended: 'warning',
  closed:    'danger',
}

/** Payment channel → badge tone (colour-coded channel chips). */
export const CHANNEL_TONE: Record<ChannelAccountChannel, BadgeTone> = {
  GLDB:         'primary',
  SGB:          'info',
  TransferMate: 'success',
  Tazapay:      'warning',
}

/** Account type → badge tone. */
export const ACCOUNT_TYPE_TONE: Record<string, BadgeTone> = {
  fiat:            'neutral',
  investment_fiat: 'info',
}

export const CHANNEL_OPTIONS: ChannelAccountChannel[] = ['GLDB', 'SGB', 'TransferMate', 'Tazapay']
export const ACCOUNT_TYPE_OPTIONS = ['fiat', 'investment_fiat']
export const CLIENT_STATUS_OPTIONS: ClientStatus[] = ['active', 'initial', 'suspended', 'closed']
export const MAPPING_STATUS_OPTIONS = ['active', 'inactive']

/** A status is an exception (blocks auto-credit) whenever it is not `active`. */
export function isExceptionStatus(s: ClientStatus): boolean {
  return s !== 'active'
}

/** Row has a status exception when either participant or member status is non-active. */
export function hasStatusException(participant: ClientStatus, member: ClientStatus): boolean {
  return isExceptionStatus(participant) || isExceptionStatus(member)
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

/** Split a timestamp into { date, time } for two-line table cells. */
export function fmtDateParts(iso: string | null): { date: string; time: string } | null {
  if (!iso) return null
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}

/* ─── Filter board state + query mapping (mirrors Orders helpers) ──────────── */

/** Initial / cleared state for the filter board. Single-select fields default to ''. */
export const EMPTY_ACCOUNT_FILTERS = {
  channel: '', account_type: '', channel_account: '', reference_code: '',
  mca_account: '', currency: '', client_q: '', member_id: '',
  participant_status: '', member_status: '',
}

/** Map a filter-board object → ChannelAccountsFilter query params (undefined = unset). */
export function toAccountQuery(f: any) {
  return {
    channel:            f.channel || undefined,
    account_type:       f.account_type || undefined,
    channel_account:    f.channel_account?.trim() || undefined,
    reference_code:     f.reference_code?.trim() || undefined,
    mca_account:        f.mca_account?.trim() || undefined,
    currency:           f.currency || undefined,
    client_q:           f.client_q?.trim() || undefined,
    member_id:          f.member_id?.trim() || undefined,
    participant_status: f.participant_status || undefined,
    member_status:      f.member_status || undefined,
  }
}

/** True when any board filter is set. */
export function hasAccountFilters(f: any): boolean {
  return Object.values(f).some(v => v != null && v !== '')
}
