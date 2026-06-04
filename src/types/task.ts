/**
 * Task Center — domain model for cadmin.
 * Task types are driven by the Fiat Deposit Automation STP PRD §7.7.3.
 */

/** All deposit-related task types per PRD §7.7.3 */
export type DepositTaskType =
  | 'DEPOSIT_RECIPIENT_MATCHING'    // §7.7.3 — Ops identifies correct recipient for unidentified deposit
  | 'DEPOSIT_STATUS_EXCEPTION'      // §7.7.3 — account initial/suspended/closed at credit time
  | 'DEPOSIT_CLASSIFICATION'        // §7.7.3 — ambiguous 1st/3rd party fuzzy-match result
  | 'DEPOSIT_MISSING_FIELDS_FYI'    // §7.7.3 — FYI only; client/partner providing missing fields
  | 'DEPOSIT_SCREENING_REVIEW'      // §7.8  — VisionX returned pending_review; compliance action
  | 'DEPOSIT_WEBHOOK_PARSE_FAILURE' // §7.7.3 — webhook parse failure; dev team investigation

/** PRD §7.7.3 task lifecycle: PENDING → IN_PROGRESS → COMPLETED / CANCELLED */
export type TaskStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'

export interface TaskHistoryEntry {
  action:     string
  actorId:    string
  actorName:  string
  timestamp:  string
  comment?:   string
}

/**
 * Potential Match Discovery candidate (PRD §7.1.4) — for DEPOSIT_RECIPIENT_MATCHING.
 * One row per client; a client matched by multiple discovery strategies lists all of
 * them in `strategies`. `priority` is the overall tier (highest-priority strategy wins).
 */
export type MatchStrategy =
  | 'reference_similar'  // Strategy 1 — similar reference code (edit distance)
  | 'va_parent'          // Strategy 2 — VA parent context
  | 'name_fuzzy'         // Strategy 3 — sender name fuzzy match
  | 'saved_payer'        // Strategy 4 — saved sender details
  | 'payment_reference'  // Strategy 5 — payment reference context

/** Per-strategy hit with its similarity score (0–1) — §7.1.4 Output */
export interface MatchStrategyHit {
  strategy: MatchStrategy
  score:    number
}

/** Candidate priority tier — §7.1.4 Candidate Ranking */
export type MatchPriority = 'highest' | 'high' | 'medium' | 'low'

export interface MatchCandidate {
  participant_code: string
  client_name:      string
  /** Parent node for disambiguation (§7.1.4 — highlighted when names collide) */
  parent_node:      string
  account_number:   string
  /** All discovery strategies that surfaced this client, with scores */
  strategies:       MatchStrategyHit[]
  /** Overall priority tier (derived from the highest-priority strategy) */
  priority:         MatchPriority
}

/** A mandatory field that's missing — for DEPOSIT_MISSING_FIELDS_FYI */
export interface MissingField {
  key:      string   // maps to a DepositOrder field, e.g. 'sender_bank_swift'
  label:    string
  required: boolean
}

/** Account-status detail — for DEPOSIT_STATUS_EXCEPTION (§7.4 allowlist: only Active passes) */
export type AccountStatus = 'initial' | 'suspended' | 'closed'

export interface DepositTask {
  id:               string
  taskType:         DepositTaskType
  status:           TaskStatus
  /** Linked deposit order id (empty for webhook parse failures — no deposit record) */
  depositOrderId:   string
  /** Linked deposit transaction_id (display) */
  transactionId:    string
  /** Amount display string, e.g. "33,000.00 SGD" */
  amountDisplay:    string
  /** Ops user currently holding the task; null = unassigned */
  assignedTo:       string | null
  assignedToName:   string | null

  /* ── Type-specific payloads ─────────────────────────────────────── */
  /** DEPOSIT_RECIPIENT_MATCHING — Potential Match Discovery candidate list */
  candidates?:      MatchCandidate[]
  /** DEPOSIT_STATUS_EXCEPTION — the blocking account status(es) (§7.4: both may block) */
  blockingStatuses?: AccountStatus[]
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

/** A CAMP client returned by the manual recipient search (§7.7.3 item 3) */
export interface ClientSearchResult {
  participant_code: string
  client_name:      string
  parent_node:      string
  account_number:   string
}
