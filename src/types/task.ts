/**
 * Task Center — domain model for cadmin.
 * Task types are driven by the Fiat Deposit Automation STP PRD §7.7.3.
 */

/** All deposit-related task types per PRD §7.7.3 */
export type DepositTaskType =
  | 'DEPOSIT_RECIPIENT_MATCHING'    // §7.7.3 — Ops identifies correct recipient for unidentified deposit
  | 'DEPOSIT_STATUS_EXCEPTION'      // §7.7.3 — account suspended/frozen/closed at credit time
  | 'DEPOSIT_CLASSIFICATION'        // §7.7.3 — ambiguous 1st/3rd party fuzzy-match result
  | 'DEPOSIT_MISSING_FIELDS_FYI'    // §7.7.3 — FYI only; client/partner providing missing fields
  | 'DEPOSIT_SCREENING_REVIEW'      // §7.7.3 — VisionX returned pending_review; compliance action
  | 'DEPOSIT_WEBHOOK_PARSE_FAILURE' // §7.7.3 — webhook parse failure; dev team investigation

export type TaskStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'ABNORMAL'

export interface TaskHistoryEntry {
  action:     string
  actorId:    string
  actorName:  string
  timestamp:  string
  comment?:   string
}

/** Potential Match Discovery candidate (PRD §7.1.4) — for DEPOSIT_RECIPIENT_MATCHING */
export interface MatchCandidate {
  participant_code: string
  client_name:      string
  account_number:   string
  /** How this candidate was surfaced */
  match_basis:      'reference_similar' | 'va_parent' | 'name_fuzzy' | 'saved_payer'
  /** Name-match score [0,1] when match_basis is name_fuzzy */
  name_match_score?: number
}

/** A mandatory field that's missing — for DEPOSIT_MISSING_FIELDS_FYI */
export interface MissingField {
  key:      string   // maps to a DepositOrder field, e.g. 'sender_bank_swift'
  label:    string
  required: boolean
}

/** Account-status detail — for DEPOSIT_STATUS_EXCEPTION */
export type AccountStatus = 'initial' | 'suspended' | 'closed'

export interface DepositTask {
  id:               string
  taskType:         DepositTaskType
  status:           TaskStatus
  /** Linked deposit order id */
  depositOrderId:   string
  /** Linked deposit transaction_id (display) */
  transactionId:    string
  /** Amount display string, e.g. "33,000.00 SGD" */
  amountDisplay:    string
  /** Ops user currently holding the task; null = unassigned */
  assignedTo:       string | null
  assignedToName:   string | null
  /**
   * Ageing escalation — only applies to DEPOSIT_RECIPIENT_MATCHING (unclaimed funds).
   * Per PRD §7.7.2: 0=normal, 1=flagged (30d+), 2=mandatory review (90d+), 3=mandatory escalation (180d+)
   * Absent / 0 for all other task types.
   */
  escalationLevel?: 0 | 1 | 2 | 3

  /* ── Type-specific payloads ─────────────────────────────────────── */
  /** DEPOSIT_RECIPIENT_MATCHING — Potential Match Discovery candidate list */
  candidates?:      MatchCandidate[]
  /** DEPOSIT_STATUS_EXCEPTION — the blocking account status */
  accountStatus?:   AccountStatus
  /** DEPOSIT_CLASSIFICATION — fuzzy name-match score that fell in the ambiguous range */
  nameMatchScore?:  number
  /** DEPOSIT_MISSING_FIELDS_FYI — fields the deposit is missing */
  missingFields?:   MissingField[]
  /** DEPOSIT_WEBHOOK_PARSE_FAILURE — raw webhook payload + channel/receipt */
  rawPayload?:      string
  paymentChannel?:  string
  receivedAt?:      string

  history:          TaskHistoryEntry[]
  created_at:       string
  updated_at:       string
}

export interface DepositTaskListResponse {
  tasks:      DepositTask[]
  total:      number
  page:       number
  per_page:   number
  /** Active task badge count (PENDING + IN_PROGRESS) */
  badgeCount: number
}
