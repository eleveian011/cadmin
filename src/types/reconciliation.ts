/**
 * Channel–Order Reconciliation types (PRD §7.13.4 / §7.13.7).
 *
 * Models the `reconciliation_results` table behind the new "Reconciliation Report"
 * admin page: hourly channel↔order auto-reconciliation outcomes, their severity,
 * the channel-vs-order value snapshots, and the discrepancy lifecycle (open →
 * resolved). Demo fixture — in production this is written by the recon cronjob.
 */

/** Outcome enum (§7.13.2). `Match` is logged but never shown as a discrepancy. */
export type ReconOutcome =
  | 'Match'
  | 'UnmatchedChannelTransaction'
  | 'MissingChannelTransaction'
  | 'AmountMismatch'
  | 'FeeMismatch'
  | 'CurrencyMismatch'
  | 'CounterpartyNameMismatch'
  | 'CounterpartyAccountNoMismatch'
  | 'PaymentReferenceMismatch'
  | 'ValueDateMismatch'
  | 'StatusAnomaly'
  | 'StatusContradiction'
  | 'OrphanDuplicate'

/** Severity tier (§7.13.2 / §7.13.5). */
export type ReconSeverity = 'critical' | 'high' | 'medium' | 'low'

/** Reconciliation cadence: hourly auto-recon (§7.13) vs T+1 end-of-day (separate PRD). */
export type ReconType = 'hourly' | 'daily'

export type ReconChannel = 'GLDB' | 'SGB' | 'TransferMate' | 'Tazapay'

/** Snapshot of the fields compared on each side (channel_value / order_value JSONB). */
export interface ReconValueSnapshot {
  amount?:           string | null
  currency?:         string | null
  fee_amount?:       string | null
  status?:           string | null
  counterparty_name?: string | null
  counterparty_account_no?: string | null
  payment_reference?: string | null
  value_date?:       string | null
}

/** One row of the `reconciliation_results` table (§7.13.4). */
export interface ReconResult {
  id:                     string
  cycle_id:               string
  transaction_id:         string | null
  channel_transaction_id: string | null
  payment_channel:        ReconChannel
  outcome:                ReconOutcome
  severity:               ReconSeverity
  /** Reconciliation cadence (hourly auto-recon vs T+1 end-of-day). */
  recon_type:             ReconType
  channel_value:          ReconValueSnapshot | null
  order_value:            ReconValueSnapshot | null
  /** Human-readable description of the discrepancy. */
  discrepancy_detail:     string
  /** List of field keys that mismatch (drives red highlight in the comparison cards). */
  mismatch_fields:        string[]
  first_seen_at:          string
  last_seen_at:           string
  resolved_at:            string | null
  resolution_note:        string | null
  /** Ops identity who resolved the discrepancy (null while open). */
  resolved_by:            string | null
  /** Optional correction-order reference captured at resolution time. */
  correction_order:       string | null
  /** Consecutive cycles this discrepancy has been observed. */
  cycle_count:            number
}

/** Per-cycle batch summary (§7.13.3 audit trail / Cycle Results tab). */
export interface ReconCycle {
  cycle_id:    string
  ran_at:      string
  total:       number
  matched:     number
  unmatched:   number
  discrepancy: number
}
