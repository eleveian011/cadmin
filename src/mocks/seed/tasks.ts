import type { DepositTask, MatchCandidate, MissingField } from '../../types/task'
import { depositOrders } from './deposit-orders'

function daysAgo(n: number, offsetHours = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(d.getHours() - offsetHours)
  return d.toISOString()
}

function fmtAmt(minor: number, currency: string): string {
  return `${new Intl.NumberFormat('en-SG', { minimumFractionDigits: 2 }).format(minor / 100)} ${currency}`
}

function orderById(id: string) {
  return depositOrders.find(d => d.id === id)!
}

const h = (
  action: string, actorId: string, actorName: string,
  daysAgoN = 0, hoursOffset = 0, comment?: string,
): DepositTask['history'][number] => ({
  action, actorId, actorName,
  timestamp: daysAgo(daysAgoN, hoursOffset),
  ...(comment ? { comment } : {}),
})

// Shared candidate pools for Potential Match Discovery (PRD §7.1.4)
const CANDIDATES_A: MatchCandidate[] = [
  { participant_code: 'PART-ALI-001', client_name: 'Alibaba SG Master',   account_number: 'MCA-ALI-001', match_basis: 'reference_similar' },
  { participant_code: 'PART-TAO-001', client_name: 'Taobao Sub',          account_number: 'MCA-TAO-001', match_basis: 'va_parent' },
  { participant_code: 'PART-TMT-001', client_name: 'Tmall Tech Sub',      account_number: 'MCA-TMT-001', match_basis: 'name_fuzzy', name_match_score: 0.61 },
]

const CANDIDATES_B: MatchCandidate[] = [
  { participant_code: 'PART-FLG-001', client_name: 'Fliggy Travel Sub',   account_number: 'MCA-FLG-001', match_basis: 'saved_payer' },
  { participant_code: 'PART-AEO-001', client_name: 'AE Outlet Sub',       account_number: 'MCA-AEO-001', match_basis: 'name_fuzzy', name_match_score: 0.55 },
]

const MISSING_FIELDS_SWIFT_BANK: MissingField[] = [
  { key: 'sender_bank_swift', label: 'Sender Bank SWIFT BIC', required: true },
  { key: 'sender_bank_name',  label: 'Sender Bank Name',      required: true },
]

// PRD §7.7.2 unclaimed funds ageing thresholds (DEPOSIT_RECIPIENT_MATCHING only)
function recipientMatchingEscalation(ageDays: number): 0 | 1 | 2 | 3 {
  if (ageDays >= 180) return 3  // mandatory escalation
  if (ageDays >= 90)  return 2  // mandatory review
  if (ageDays >= 30)  return 1  // flagged
  return 0
}

export const depositTasks: DepositTask[] = [
  // ── DEPOSIT_RECIPIENT_MATCHING (3d — level 0) ──────────────────────────
  (() => {
    const o = orderById('dep_anom_001')
    return {
      id: 'TASK-DEP-0091',
      taskType: 'DEPOSIT_RECIPIENT_MATCHING',
      status: 'PENDING',
      depositOrderId: o.id,
      transactionId: o.transaction_id,
      amountDisplay: fmtAmt(o.amount_minor, o.currency),
      assignedTo: null,
      assignedToName: null,
      escalationLevel: recipientMatchingEscalation(3),
      candidates: CANDIDATES_A,
      created_at: daysAgo(3, 4),
      updated_at: daysAgo(3, 4),
      history: [
        h('TASK_CREATED', 'system', 'STP Engine', 3, 4, 'Unidentified deposit — no reference code or VA match.'),
      ],
    }
  })(),

  // ── DEPOSIT_RECIPIENT_MATCHING (12d — level 0, not yet flagged) ────────
  (() => {
    const o = orderById('dep_anom_002')
    return {
      id: 'TASK-DEP-0087',
      taskType: 'DEPOSIT_RECIPIENT_MATCHING',
      status: 'IN_PROGRESS',
      depositOrderId: o.id,
      transactionId: o.transaction_id,
      amountDisplay: fmtAmt(o.amount_minor, o.currency),
      assignedTo: 'ops_001',
      assignedToName: 'Ling Zhao',
      escalationLevel: recipientMatchingEscalation(12),
      candidates: CANDIDATES_B,
      created_at: daysAgo(12, 2),
      updated_at: daysAgo(10, 1),
      history: [
        h('TASK_CREATED', 'system', 'STP Engine', 12, 2, 'No sender details in webhook payload.'),
        h('TASK_CLAIMED', 'ops_001', 'Ling Zhao', 10, 1),
      ],
    }
  })(),

  // ── DEPOSIT_RECIPIENT_MATCHING (35d — level 1 Flagged) ─────────────────
  {
    id: 'TASK-DEP-0066',
    taskType: 'DEPOSIT_RECIPIENT_MATCHING',
    status: 'PENDING',
    depositOrderId: 'synthetic_35d',
    transactionId: 'DP20260430900066',
    amountDisplay: fmtAmt(4850000, 'SGD'),
    assignedTo: null,
    assignedToName: null,
    escalationLevel: recipientMatchingEscalation(35),
    candidates: CANDIDATES_A,
    created_at: daysAgo(35, 1),
    updated_at: daysAgo(35, 1),
    history: [
      h('TASK_CREATED', 'system', 'STP Engine', 35, 1, 'Unidentified deposit — no VA or reference code match.'),
    ],
  },

  // ── DEPOSIT_RECIPIENT_MATCHING (95d — level 2 Mandatory Review) ────────
  {
    id: 'TASK-DEP-0021',
    taskType: 'DEPOSIT_RECIPIENT_MATCHING',
    status: 'IN_PROGRESS',
    depositOrderId: 'synthetic_95d',
    transactionId: 'DP20260301900021',
    amountDisplay: fmtAmt(12300000, 'USD'),
    assignedTo: 'ops_002',
    assignedToName: 'Alex Chen',
    escalationLevel: recipientMatchingEscalation(95),
    candidates: [],
    created_at: daysAgo(95, 3),
    updated_at: daysAgo(5, 2),
    history: [
      h('TASK_CREATED', 'system', 'STP Engine', 95, 3, 'Unidentified deposit — placed in unclaimed funds ledger.'),
      h('TASK_CLAIMED', 'ops_002', 'Alex Chen', 80, 1),
      h('TASK_NOTE', 'ops_002', 'Alex Chen', 40, 4, 'Contacted GLDB for additional sender details. Awaiting response.'),
      h('TASK_NOTE', 'ops_002', 'Alex Chen', 5, 2, '90-day threshold reached — mandatory review triggered. Escalating to compliance team.'),
    ],
  },

  // ── DEPOSIT_RECIPIENT_MATCHING (185d — level 3 Mandatory Escalation) ───
  {
    id: 'TASK-DEP-0008',
    taskType: 'DEPOSIT_RECIPIENT_MATCHING',
    status: 'IN_PROGRESS',
    depositOrderId: 'synthetic_185d',
    transactionId: 'DP20251202900008',
    amountDisplay: fmtAmt(78900000, 'SGD'),
    assignedTo: 'ops_001',
    assignedToName: 'Ling Zhao',
    escalationLevel: recipientMatchingEscalation(185),
    candidates: [],
    created_at: daysAgo(185, 6),
    updated_at: daysAgo(2, 1),
    history: [
      h('TASK_CREATED', 'system', 'STP Engine', 185, 6, 'Unidentified deposit — placed in unclaimed funds ledger.'),
      h('TASK_CLAIMED', 'ops_001', 'Ling Zhao', 170, 2),
      h('TASK_NOTE', 'ops_001', 'Ling Zhao', 150, 3, 'Multiple client lookups performed — no match found. Possible misrouted wire.'),
      h('TASK_NOTE', 'ops_001', 'Ling Zhao', 90, 1, '90-day threshold: mandatory review initiated. Compliance notified.'),
      h('TASK_NOTE', 'ops_001', 'Ling Zhao', 30, 4, '150-day mark: no resolution. Preparing for 180-day mandatory escalation.'),
      h('TASK_NOTE', 'system', 'Escalation Engine', 5, 0, '180-day threshold exceeded. Mandatory escalation triggered per §7.7.2.'),
      h('TASK_NOTE', 'ops_001', 'Ling Zhao', 2, 1, 'Escalation filed with Compliance reviewer. Awaiting sign-off.'),
    ],
  },

  // ── DEPOSIT_STATUS_EXCEPTION (35d) — no escalation logic for this type ─
  (() => {
    const o = orderById('dep_anom_003')
    return {
      id: 'TASK-DEP-0071',
      taskType: 'DEPOSIT_STATUS_EXCEPTION',
      status: 'IN_PROGRESS',
      depositOrderId: o.id,
      transactionId: o.transaction_id,
      amountDisplay: fmtAmt(o.amount_minor, o.currency),
      assignedTo: 'ops_002',
      assignedToName: 'Alex Chen',
      accountStatus: 'suspended',
      created_at: daysAgo(35, 5),
      updated_at: daysAgo(20, 3),
      history: [
        h('TASK_CREATED', 'system', 'STP Engine', 35, 5, 'Account status: Suspended — credit blocked.'),
        h('TASK_CLAIMED', 'ops_002', 'Alex Chen', 34, 2),
        h('TASK_NOTE', 'ops_002', 'Alex Chen', 20, 3, 'Waiting on client to reactivate account. Escalated to account management team.'),
      ],
    }
  })(),

  // ── DEPOSIT_CLASSIFICATION (95d) — ABNORMAL, no escalation ────────────
  (() => {
    const o = orderById('dep_anom_004')
    return {
      id: 'TASK-DEP-0044',
      taskType: 'DEPOSIT_CLASSIFICATION',
      status: 'ABNORMAL',
      depositOrderId: o.id,
      transactionId: o.transaction_id,
      amountDisplay: fmtAmt(o.amount_minor, o.currency),
      assignedTo: 'ops_001',
      assignedToName: 'Ling Zhao',
      nameMatchScore: 0.72,
      created_at: daysAgo(95, 6),
      updated_at: daysAgo(60, 2),
      history: [
        h('TASK_CREATED', 'system', 'STP Engine', 95, 6, 'Name match score 0.72 — ambiguous range, classification deferred.'),
        h('TASK_CLAIMED', 'ops_001', 'Ling Zhao', 90, 3),
        h('TASK_ABNORMAL', 'system', 'Escalation Engine', 60, 2, 'Task exceeded 90-day threshold without resolution. Mandatory escalation triggered.'),
      ],
    }
  })(),

  // ── DEPOSIT_MISSING_FIELDS_FYI (2d) — no escalation ───────────────────
  (() => {
    const o = orderById('dep_anom_005')
    return {
      id: 'TASK-DEP-0093',
      taskType: 'DEPOSIT_MISSING_FIELDS_FYI',
      status: 'PENDING',
      depositOrderId: o.id,
      transactionId: o.transaction_id,
      amountDisplay: fmtAmt(o.amount_minor, o.currency),
      assignedTo: null,
      assignedToName: null,
      missingFields: MISSING_FIELDS_SWIFT_BANK,
      created_at: daysAgo(2, 1),
      updated_at: daysAgo(2, 1),
      history: [
        h('TASK_CREATED', 'system', 'STP Engine', 2, 1, 'Missing fields: SWIFT BIC, Sender Bank Name. RFI dispatched via AgentX Portal.'),
      ],
    }
  })(),

  // ── DEPOSIT_SCREENING_REVIEW (1d) — no escalation ─────────────────────
  (() => {
    const o = orderById('dep_anom_006')
    return {
      id: 'TASK-DEP-0094',
      taskType: 'DEPOSIT_SCREENING_REVIEW',
      status: 'IN_PROGRESS',
      depositOrderId: o.id,
      transactionId: o.transaction_id,
      amountDisplay: fmtAmt(o.amount_minor, o.currency),
      assignedTo: 'ops_002',
      assignedToName: 'Alex Chen',
      created_at: daysAgo(1, 8),
      updated_at: daysAgo(1, 3),
      history: [
        h('TASK_CREATED', 'system', 'VisionX Integration', 1, 8, 'Screening result: Pending Review — manual compliance review required.'),
        h('TASK_CLAIMED', 'ops_002', 'Alex Chen', 1, 3),
      ],
    }
  })(),

  // ── DEPOSIT_WEBHOOK_PARSE_FAILURE (4h) — dev team investigation ────────
  {
    id: 'TASK-DEP-0095',
    taskType: 'DEPOSIT_WEBHOOK_PARSE_FAILURE',
    status: 'PENDING',
    depositOrderId: '',
    transactionId: 'N/A',
    amountDisplay: 'Unknown',
    assignedTo: null,
    assignedToName: null,
    paymentChannel: 'GLDB',
    receivedAt: daysAgo(0, 4),
    rawPayload: JSON.stringify({
      eventType: 'CREDIT',
      payload: { amt: '15000.00', ccy: 'SGD', senderRef: null, valueDt: '' },
      _error: 'Missing mandatory field: receiverAcctNo',
    }, null, 2),
    created_at: daysAgo(0, 4),
    updated_at: daysAgo(0, 4),
    history: [
      h('TASK_CREATED', 'system', 'STP Engine', 0, 4, 'GLDB webhook payload unparseable — mandatory fields missing. Raw payload preserved. No deposit record created.'),
    ],
  },

  // ── Completed tasks (History view) ─────────────────────────────────────
  {
    id: 'TASK-DEP-0050',
    taskType: 'DEPOSIT_RECIPIENT_MATCHING',
    status: 'COMPLETED',
    depositOrderId: 'dep_001',
    transactionId: 'DP20260601100001',
    amountDisplay: fmtAmt(5000000, 'SGD'),
    assignedTo: 'ops_002',
    assignedToName: 'Alex Chen',
    created_at: daysAgo(8, 3),
    updated_at: daysAgo(8, 1),
    history: [
      h('TASK_CREATED', 'system', 'STP Engine', 8, 3),
      h('TASK_CLAIMED', 'ops_002', 'Alex Chen', 8, 2),
      h('TASK_COMPLETED', 'ops_002', 'Alex Chen', 8, 1, 'Matched to Alibaba SG Master via reference code lookup.'),
    ],
  },
  {
    id: 'TASK-DEP-0048',
    taskType: 'DEPOSIT_CLASSIFICATION',
    status: 'COMPLETED',
    depositOrderId: 'dep_002',
    transactionId: 'DP20260601100002',
    amountDisplay: fmtAmt(1250000, 'USD'),
    assignedTo: 'ops_001',
    assignedToName: 'Ling Zhao',
    created_at: daysAgo(7, 4),
    updated_at: daysAgo(7, 2),
    history: [
      h('TASK_CREATED', 'system', 'STP Engine', 7, 4),
      h('TASK_CLAIMED', 'ops_001', 'Ling Zhao', 7, 3),
      h('TASK_COMPLETED', 'ops_001', 'Ling Zhao', 7, 2, 'Confirmed 3rd party — COBO documentation on file.'),
    ],
  },
  {
    id: 'TASK-DEP-0040',
    taskType: 'DEPOSIT_SCREENING_REVIEW',
    status: 'COMPLETED',
    depositOrderId: 'dep_ref_001',
    transactionId: 'DP20260531100008',
    amountDisplay: fmtAmt(660000, 'USD'),
    assignedTo: 'ops_001',
    assignedToName: 'Ling Zhao',
    created_at: daysAgo(14, 6),
    updated_at: daysAgo(14, 4),
    history: [
      h('TASK_CREATED', 'system', 'VisionX Integration', 14, 6, 'Screening result: Rejected — sanctioned entity detected.'),
      h('TASK_CLAIMED', 'ops_001', 'Ling Zhao', 14, 5),
      h('TASK_COMPLETED', 'ops_001', 'Ling Zhao', 14, 4, 'Refund flow initiated. Deposit rejected per compliance policy.'),
    ],
  },
]
