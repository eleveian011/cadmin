/**
 * Channel Account — Fiat Account Mapping Reference Table (PRD §7.4, v0.2).
 *
 * A unified reference table mapping a payment-channel account number to a CAMP
 * client account, with client identity + account status for the deposit STP rule
 * engine. This is the domain model behind the "Fiat Account Mapping Reference
 * Table" admin page.
 *
 * v0.2 schema: the single MCA field was split into two distinct numbers —
 * `channel_account_number` (Channel Account Number, Internal) and
 * `user_channel_account_number` (User Channel Account Number, user-facing). Client
 * identity is keyed on Participant Code; the legacy Member ID column was removed.
 */

/** Supported payment channels (§7.4 — bulk upload is GLDB-only). */
export type ChannelAccountChannel = 'GLDB' | 'SGB' | 'TransferMate' | 'Tazapay'

/** Account type — determines destination ledger after recipient identification. */
export type AccountType = 'fiat' | 'investment_fiat'

/** Mapping status toggle — whether the rule engine uses this mapping. */
export type MappingStatus = 'active' | 'inactive'

/**
 * Client identity status (Participant / Member). Allowlist approach: only `active`
 * permits auto-crediting (§7.4). All other values block and route to Task Center.
 */
export type ClientStatus = 'active' | 'initial' | 'suspended' | 'closed'

/** Receiving bank details. */
export interface BankDetails {
  bank_name:      string
  account_number: string
  swift_code:     string
  country_code:   string
  bank_address:   string
}

/** Optional intermediary/correspondent bank (may be absent). */
export interface IntermediaryBank {
  bank_name:    string
  swift_code:   string
  country_code: string
  bank_address: string
}

/** Audit-trail entry — every change with timestamp, actor, and summary (§7.4). */
export interface ChannelAccountHistoryEntry {
  action:    string
  actorId:   string
  actorName: string
  timestamp: string
  comment?:  string
}

export interface ChannelAccount {
  id: string

  /* ── Mapping keys (uniqueness: channel + user_channel_account_number + account_type) ── */
  payment_channel:        ChannelAccountChannel
  /** Channel Account Number (Internal) — GLDB-only internal identifier; optional. */
  channel_account_number: string
  /** Channel Account Number — user-facing external channel account number. */
  user_channel_account_number: string
  account_type:           AccountType

  /** System-generated; not editable via Admin UI or bulk upload. Null for Named VAs. */
  reference_code:         string | null
  /** Account currencies — one mapping may carry several (multi-select). */
  currency:               string[]

  /* ── Client identity — auto-populated via CAMP lookup on Participant Code, read-only after creation ── */
  client_name:            string
  participant_code:       string | null
  participant_status:     ClientStatus

  /** Channel Account Status — Active / Inactive toggle, always editable. */
  mapping_status:         MappingStatus

  /* ── Bank information (receiving bank + optional intermediary) ── */
  bank_details:           BankDetails
  intermediary_bank:      IntermediaryBank | null

  /* ── Lifecycle ── */
  /** Soft-delete flag — archived rows are excluded from the rule engine + list view. */
  archived:               boolean
  history:                ChannelAccountHistoryEntry[]
  created_at:             string
  updated_at:             string
}

/** A row parsed from a bulk-upload Excel file, before validation/commit. */
export interface BulkUploadRow {
  payment_channel:             string
  channel_account_number:      string
  user_channel_account_number: string
  currency:                    string
  account_type:                string
  participant_code:            string
}

/** Per-row outcome after a bulk upload run. */
export type BulkRowOutcome = 'added' | 'updated' | 'ignored' | 'rejected'

export interface BulkRowResult {
  rowNumber: number
  outcome:   BulkRowOutcome
  /** Channel account number for display in the result report. */
  channel_account_number: string
  /** Reason — present for `rejected`, optional otherwise. */
  reason?:   string
}

/** Duplicate-handling mode chosen before upload (§7.4). */
export type DuplicateMode = 'ignore' | 'overwrite'

export interface BulkUploadResult {
  added:    number
  updated:  number
  ignored:  number
  rejected: number
  rows:     BulkRowResult[]
}
