import type { DepositTask, MatchCandidate, MissingField } from '../types/task'
import { depositOrders } from './deposit-orders'

/** Timestamp `n` hours ago (with optional extra minutes), ISO string. */
function hoursAgo(n: number, minutes = 0): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() - n * 60 - minutes)
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
  hoursAgoN = 0, minutesOffset = 0, comment?: string,
): DepositTask['history'][number] => ({
  action, actorId, actorName,
  timestamp: hoursAgo(hoursAgoN, minutesOffset),
  ...(comment ? { comment } : {}),
})

// Shared candidate pools for Potential Match Discovery (PRD §7.1.4).
// One row per client; a client matched by multiple strategies lists all of them.
// `priority`: highest = 2+ strategies, high = single ≥0.80, medium = 0.50–0.80, low = <0.50.
const CANDIDATES_A: MatchCandidate[] = [
  {
    participant_code: 'PART-ALI-001', client_name: 'Alibaba SG Master', parent_node: 'Alibaba Group',
    account_number: 'MCA-ALI-001', priority: 'highest',
    strategies: [{ strategy: 'reference_similar', score: 0.88 }, { strategy: 'name_fuzzy', score: 0.81 }],
  },
  {
    participant_code: 'PART-TAO-001', client_name: 'Taobao Sub', parent_node: 'Alibaba Group',
    account_number: 'MCA-TAO-001', priority: 'high',
    strategies: [{ strategy: 'va_parent', score: 0.90 }],
  },
  {
    participant_code: 'PART-TMT-001', client_name: 'Tmall Tech Sub', parent_node: 'Alibaba Group',
    account_number: 'MCA-TMT-001', priority: 'medium',
    strategies: [{ strategy: 'name_fuzzy', score: 0.61 }],
  },
]

const CANDIDATES_B: MatchCandidate[] = [
  {
    participant_code: 'PART-FLG-001', client_name: 'Fliggy Travel Sub', parent_node: 'Alibaba Group',
    account_number: 'MCA-FLG-001', priority: 'high',
    strategies: [{ strategy: 'saved_payer', score: 0.84 }],
  },
  {
    participant_code: 'PART-AEO-001', client_name: 'AE Outlet Sub', parent_node: 'Alibaba Group',
    account_number: 'MCA-AEO-001', priority: 'medium',
    strategies: [{ strategy: 'name_fuzzy', score: 0.55 }],
  },
]

const MISSING_FIELDS_SWIFT_BANK: MissingField[] = [
  { key: 'sender_bank_swift', label: 'Sender Bank SWIFT BIC', required: true },
  { key: 'sender_bank_name',  label: 'Sender Bank Name',      required: true },
]

export const depositTasks: DepositTask[] = [
  // ── DEPOSIT_RECIPIENT_MATCHING (~3h — normal) ──────────────────────────
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
      candidates: CANDIDATES_A,
      created_at: hoursAgo(3, 12),
      updated_at: hoursAgo(3, 12),
      history: [
        h('TASK_CREATED', 'system', 'STP Engine', 3, 12, 'Unidentified deposit — no reference code or VA match.'),
      ],
    }
  })(),

  // ── DEPOSIT_RECIPIENT_MATCHING (~30h — over 24h, in progress) ──────────
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
      candidates: CANDIDATES_B,
      created_at: hoursAgo(30, 20),
      updated_at: hoursAgo(26, 10),
      history: [
        h('TASK_CREATED', 'system', 'STP Engine', 30, 20, 'No sender details in webhook payload.'),
        h('TASK_CLAIMED', 'ops_001', 'Ling Zhao', 26, 10),
      ],
    }
  })(),

  // ── DEPOSIT_RECIPIENT_MATCHING (~52h — over 48h, urgent) ───────────────
  (() => {
    const o = orderById('dep_anom_007')
    return {
      id: 'TASK-DEP-0066',
      taskType: 'DEPOSIT_RECIPIENT_MATCHING',
      status: 'PENDING',
      depositOrderId: o.id,
      transactionId: o.transaction_id,
      amountDisplay: fmtAmt(o.amount_minor, o.currency),
      assignedTo: null,
      assignedToName: null,
      candidates: CANDIDATES_A,
      created_at: hoursAgo(52, 30),
      updated_at: hoursAgo(52, 30),
      history: [
        h('TASK_CREATED', 'system', 'STP Engine', 52, 30, 'Unidentified deposit — no VA or reference code match.'),
      ],
    }
  })(),

  // ── DEPOSIT_RECIPIENT_MATCHING (~70h — urgent, no candidates → manual / refund) ─
  (() => {
    const o = orderById('dep_anom_008')
    return {
      id: 'TASK-DEP-0021',
      taskType: 'DEPOSIT_RECIPIENT_MATCHING',
      status: 'IN_PROGRESS',
      depositOrderId: o.id,
      transactionId: o.transaction_id,
      amountDisplay: fmtAmt(o.amount_minor, o.currency),
      assignedTo: 'ops_002',
      assignedToName: 'Alex Chen',
      candidates: [],
      created_at: hoursAgo(70, 15),
      updated_at: hoursAgo(6, 0),
      history: [
        h('TASK_CREATED', 'system', 'STP Engine', 70, 15, 'Unidentified deposit — placed in unclaimed funds ledger.'),
        h('TASK_CLAIMED', 'ops_002', 'Alex Chen', 68, 0),
        h('TASK_NOTE', 'ops_002', 'Alex Chen', 24, 30, 'Contacted SGB for additional sender details. Awaiting response.'),
        h('TASK_NOTE', 'ops_002', 'Alex Chen', 6, 0, 'No candidate matched. Investigating manually; refund if sender cannot be identified.'),
      ],
    }
  })(),
  // ── DEPOSIT_STATUS_EXCEPTION (~26h — over 24h) ─────────────────────────
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
      blockingStatuses: ['suspended'],
      created_at: hoursAgo(26, 40),
      updated_at: hoursAgo(20, 0),
      history: [
        h('TASK_CREATED', 'system', 'STP Engine', 26, 40, 'Account status: Suspended — credit blocked at Step 4.'),
        h('TASK_CLAIMED', 'ops_002', 'Alex Chen', 25, 0),
        h('TASK_NOTE', 'ops_002', 'Alex Chen', 20, 0, 'Waiting on client to reactivate account. Escalated to account management team.'),
      ],
    }
  })(),

  // ── DEPOSIT_CLASSIFICATION (~10h — active, ambiguous fuzzy match) ──────
  (() => {
    const o = orderById('dep_anom_009')
    return {
      id: 'TASK-DEP-0097',
      taskType: 'DEPOSIT_CLASSIFICATION',
      status: 'PENDING',
      depositOrderId: o.id,
      transactionId: o.transaction_id,
      amountDisplay: fmtAmt(o.amount_minor, o.currency),
      assignedTo: null,
      assignedToName: null,
      nameMatchScore: 0.68,
      created_at: hoursAgo(10, 25),
      updated_at: hoursAgo(10, 25),
      history: [
        h('TASK_CREATED', 'system', 'STP Engine', 10, 25, 'Name match score 0.68 — ambiguous range (0.5–0.85). Ops to classify 1st / 3rd party.'),
      ],
    }
  })(),

  // ── DEPOSIT_CLASSIFICATION (CANCELLED example — History) ───────────────
  (() => {
    const o = orderById('dep_anom_004')
    return {
      id: 'TASK-DEP-0044',
      taskType: 'DEPOSIT_CLASSIFICATION',
      status: 'CANCELLED',
      depositOrderId: o.id,
      transactionId: o.transaction_id,
      amountDisplay: fmtAmt(o.amount_minor, o.currency),
      assignedTo: 'ops_001',
      assignedToName: 'Ling Zhao',
      nameMatchScore: 0.72,
      created_at: hoursAgo(40, 0),
      updated_at: hoursAgo(20, 0),
      history: [
        h('TASK_CREATED', 'system', 'STP Engine', 40, 0, 'Name match score 0.72 — ambiguous range, classification deferred.'),
        h('TASK_CLAIMED', 'ops_001', 'Ling Zhao', 38, 0),
        h('TASK_CANCELLED', 'ops_001', 'Ling Zhao', 20, 0, 'Deposit reversed at source by the bank — classification no longer needed.'),
      ],
    }
  })(),

  // ── DEPOSIT_MISSING_FIELDS_FYI (~5h — FYI only, no Ops action required) ─
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
      created_at: hoursAgo(5, 10),
      updated_at: hoursAgo(5, 10),
      history: [
        h('TASK_CREATED', 'system', 'STP Engine', 5, 10, 'Missing fields: SWIFT BIC, Sender Bank Name. RFI dispatched to client via AgentX Portal.'),
      ],
    }
  })(),

  // ── DEPOSIT_SCREENING_REVIEW (~8h — VisionX pending review) ────────────
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
      created_at: hoursAgo(8, 30),
      updated_at: hoursAgo(7, 0),
      history: [
        h('TASK_CREATED', 'system', 'VisionX Integration', 8, 30, 'Screening result: Pending Review — manual compliance review required.'),
        h('TASK_CLAIMED', 'ops_002', 'Alex Chen', 7, 0),
      ],
    }
  })(),

  // ── DEPOSIT_WEBHOOK_PARSE_FAILURE (~2h — no deposit record) ────────────
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
    receivedAt: hoursAgo(2, 0),
    rawPayload: JSON.stringify({
      eventType: 'CREDIT',
      payload: { amt: '15000.00', ccy: 'SGD', senderRef: null, valueDt: '' },
      _error: 'Missing mandatory field: receiverAcctNo',
    }, null, 2),
    created_at: hoursAgo(2, 0),
    updated_at: hoursAgo(2, 0),
    history: [
      h('TASK_CREATED', 'system', 'STP Engine', 2, 0, 'GLDB webhook payload unparseable — mandatory fields missing. Raw payload preserved. No deposit record created.'),
    ],
  },

  // ── Completed / Cancelled tasks (History view) ─────────────────────────
  {
    id: 'TASK-DEP-0050',
    taskType: 'DEPOSIT_RECIPIENT_MATCHING',
    status: 'COMPLETED',
    depositOrderId: 'dep_001',
    transactionId: 'DP20260601100001',
    amountDisplay: fmtAmt(5000000, 'SGD'),
    assignedTo: 'ops_002',
    assignedToName: 'Alex Chen',
    created_at: hoursAgo(28, 0),
    updated_at: hoursAgo(25, 0),
    history: [
      h('TASK_CREATED', 'system', 'STP Engine', 28, 0),
      h('TASK_CLAIMED', 'ops_002', 'Alex Chen', 27, 0),
      h('TASK_RECIPIENT_CONFIRMED', 'ops_002', 'Alex Chen', 25, 0, 'Matched to Alibaba SG Master via reference code lookup.'),
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
    created_at: hoursAgo(34, 0),
    updated_at: hoursAgo(31, 0),
    history: [
      h('TASK_CREATED', 'system', 'STP Engine', 34, 0),
      h('TASK_CLAIMED', 'ops_001', 'Ling Zhao', 33, 0),
      h('TASK_CLASSIFIED', 'ops_001', 'Ling Zhao', 31, 0, 'Confirmed 3rd party — payment reference on file.'),
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
    created_at: hoursAgo(46, 0),
    updated_at: hoursAgo(44, 0),
    history: [
      h('TASK_CREATED', 'system', 'VisionX Integration', 46, 0, 'Screening result: Rejected — sanctioned entity detected.'),
      h('TASK_CLAIMED', 'ops_001', 'Ling Zhao', 45, 0),
      h('TASK_REJECTED_REFUND', 'ops_001', 'Ling Zhao', 44, 0, 'Refund flow initiated. Deposit rejected per compliance policy.'),
    ],
  },
]
