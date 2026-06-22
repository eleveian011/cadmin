import type { ReconResult, ReconCycle } from '../types/reconciliation'

/**
 * reconciliation_results seed (PRD §7.13.4). Covers all severity tiers, most
 * outcome types, a range of ages (for the >7d amber / >30d red Age thresholds),
 * open + resolved records, and multiple cycles. Transaction IDs reuse the
 * deposit-orders `DP...` format so cross-links read realistically.
 *
 * Static fixture mutated in-memory by the store (Resolve action).
 */

function daysAgo(n: number, offsetHours = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(d.getHours() - offsetHours)
  return d.toISOString()
}

/** Cycle id in the PRD's date-hour format, e.g. RECON-2026-06-17-10-00. */
function cycleId(n: number, hour = 10): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  const p = (x: number) => String(x).padStart(2, '0')
  return `RECON-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(hour)}-00`
}

export const reconResults: ReconResult[] = [
  // ── Critical · Amount Mismatch · fresh (age 2d) ────────────────────────────
  {
    id: 'rec_001',
    cycle_id: cycleId(0),
    transaction_id: 'DP20260601100001',
    channel_transaction_id: 'GLDB-TXN-88345',
    payment_channel: 'GLDB',
    outcome: 'AmountMismatch',
    severity: 'critical',
    channel_value: { amount: '50000.00', currency: 'SGD', fee_amount: '12.50', status: 'success', counterparty_name: 'Alibaba Group Holding', counterparty_account_no: '88001234567', value_date: '2026-06-01' },
    order_value:   { amount: '49500.00', currency: 'SGD', fee_amount: '12.50', status: 'Successful', counterparty_name: 'Alibaba Group Holding', counterparty_account_no: '88001234567', value_date: '2026-06-01' },
    discrepancy_detail: 'Amount mismatch: channel 50000.00 vs order 49500.00 (SGD).',
    mismatch_fields: ['amount'],
    first_seen_at: daysAgo(2),
    last_seen_at: daysAgo(0),
    resolved_at: null,
    resolution_note: null,
    correction_order: null,
    cycle_count: 3,
  },
  // ── Critical · Unmatched Channel Transaction · aged (12d → amber) ──────────
  {
    id: 'rec_002',
    cycle_id: cycleId(0),
    transaction_id: null,
    channel_transaction_id: 'SGB-TXN-55012',
    payment_channel: 'SGB',
    outcome: 'UnmatchedChannelTransaction',
    severity: 'critical',
    channel_value: { amount: '12000.00', currency: 'USD', fee_amount: '0.00', status: 'success', counterparty_name: 'Novo Tech Ltd', counterparty_account_no: 'SGB9988776655', value_date: '2026-06-09' },
    order_value: null,
    discrepancy_detail: 'Channel transaction has no corresponding order (beyond 1h grace period). Confirmed pipeline gap.',
    mismatch_fields: ['amount', 'currency', 'status', 'counterparty_name'],
    first_seen_at: daysAgo(12),
    last_seen_at: daysAgo(0),
    resolved_at: null,
    resolution_note: null,
    correction_order: null,
    cycle_count: 240,
  },
  // ── Critical · Currency Mismatch · old (35d → red) ─────────────────────────
  {
    id: 'rec_003',
    cycle_id: cycleId(0),
    transaction_id: 'DP20260518100044',
    channel_transaction_id: 'TM-TXN-33781',
    payment_channel: 'TransferMate',
    outcome: 'CurrencyMismatch',
    severity: 'critical',
    channel_value: { amount: '8000.00', currency: 'EUR', fee_amount: '5.00', status: 'success', counterparty_name: 'Grab Financial Group', value_date: '2026-05-18' },
    order_value:   { amount: '8000.00', currency: 'USD', fee_amount: '5.00', status: 'Successful', counterparty_name: 'Grab Financial Group', value_date: '2026-05-18' },
    discrepancy_detail: 'Currency mismatch: channel EUR vs order USD.',
    mismatch_fields: ['currency'],
    first_seen_at: daysAgo(35),
    last_seen_at: daysAgo(0),
    resolved_at: null,
    resolution_note: null,
    correction_order: null,
    cycle_count: 700,
  },
  // ── Critical · Status Contradiction · fresh (1d) ───────────────────────────
  {
    id: 'rec_004',
    cycle_id: cycleId(0),
    transaction_id: 'DP20260620100071',
    channel_transaction_id: 'GLDB-TXN-90233',
    payment_channel: 'GLDB',
    outcome: 'StatusContradiction',
    severity: 'critical',
    channel_value: { amount: '25000.00', currency: 'SGD', status: 'pending', counterparty_name: 'Tmall Tech GmbH', value_date: '2026-06-20' },
    order_value:   { amount: '25000.00', currency: 'SGD', status: 'Successful', counterparty_name: 'Tmall Tech GmbH', value_date: '2026-06-20' },
    discrepancy_detail: 'Status contradiction: channel reports pending but order is Successful (credited before channel settlement).',
    mismatch_fields: ['status'],
    first_seen_at: daysAgo(1),
    last_seen_at: daysAgo(0),
    resolved_at: null,
    resolution_note: null,
    correction_order: null,
    cycle_count: 1,
  },
  // ── High · Fee Mismatch · aged (9d → amber) ────────────────────────────────
  {
    id: 'rec_005',
    cycle_id: cycleId(0),
    transaction_id: 'DP20260613100052',
    channel_transaction_id: 'SGB-TXN-55480',
    payment_channel: 'SGB',
    outcome: 'FeeMismatch',
    severity: 'high',
    channel_value: { amount: '30000.00', currency: 'USD', fee_amount: '25.00', status: 'success', counterparty_name: 'Shopee Pte Ltd', value_date: '2026-06-13' },
    order_value:   { amount: '30000.00', currency: 'USD', fee_amount: '15.00', status: 'Successful', counterparty_name: 'Shopee Pte Ltd', value_date: '2026-06-13' },
    discrepancy_detail: 'Fee mismatch: channel fee 25.00 vs order fee 15.00 (USD).',
    mismatch_fields: ['fee_amount'],
    first_seen_at: daysAgo(9),
    last_seen_at: daysAgo(0),
    resolved_at: null,
    resolution_note: null,
    correction_order: null,
    cycle_count: 180,
  },
  // ── High · Status Anomaly · old (50d → red) ────────────────────────────────
  {
    id: 'rec_006',
    cycle_id: cycleId(0),
    transaction_id: 'DP20260503100018',
    channel_transaction_id: 'TZP-TXN-77120',
    payment_channel: 'Tazapay',
    outcome: 'StatusAnomaly',
    severity: 'high',
    channel_value: { amount: '5000.00', currency: 'SGD', status: 'success', counterparty_name: 'Lazada SEA Holding', value_date: '2026-05-03' },
    order_value:   { amount: '5000.00', currency: 'SGD', status: 'processing.manual_review', counterparty_name: 'Lazada SEA Holding', value_date: '2026-05-03' },
    discrepancy_detail: 'Order stalled in processing.manual_review for 50 days (threshold 48h). Possible unactioned Task Center task.',
    mismatch_fields: ['status'],
    first_seen_at: daysAgo(50),
    last_seen_at: daysAgo(0),
    resolved_at: null,
    resolution_note: null,
    correction_order: null,
    cycle_count: 1000,
  },
  // ── Medium · Counterparty Name Mismatch · fresh (3d) ───────────────────────
  {
    id: 'rec_007',
    cycle_id: cycleId(0),
    transaction_id: 'DP20260619100066',
    channel_transaction_id: 'GLDB-TXN-89901',
    payment_channel: 'GLDB',
    outcome: 'CounterpartyNameMismatch',
    severity: 'medium',
    channel_value: { amount: '15000.00', currency: 'SGD', status: 'success', counterparty_name: 'RED ENVELOPE ALPHA INC', counterparty_account_no: '4395608', value_date: '2026-06-19' },
    order_value:   { amount: '15000.00', currency: 'SGD', status: 'Successful', counterparty_name: 'Red Envelope Alpha Incorporated', counterparty_account_no: '4395608', value_date: '2026-06-19' },
    discrepancy_detail: 'Counterparty name mismatch: channel "RED ENVELOPE ALPHA INC" vs order "Red Envelope Alpha Incorporated".',
    mismatch_fields: ['counterparty_name'],
    first_seen_at: daysAgo(3),
    last_seen_at: daysAgo(0),
    resolved_at: null,
    resolution_note: null,
    correction_order: null,
    cycle_count: 5,
  },
  // ── Medium · Value Date Mismatch · aged (8d → amber) ───────────────────────
  {
    id: 'rec_008',
    cycle_id: cycleId(0),
    transaction_id: 'DP20260614100058',
    channel_transaction_id: 'TM-TXN-34002',
    payment_channel: 'TransferMate',
    outcome: 'ValueDateMismatch',
    severity: 'medium',
    channel_value: { amount: '42000.00', currency: 'EUR', status: 'success', value_date: '2026-06-14' },
    order_value:   { amount: '42000.00', currency: 'EUR', status: 'Successful', value_date: '2026-06-15' },
    discrepancy_detail: 'Value date mismatch: channel 2026-06-14 vs order 2026-06-15.',
    mismatch_fields: ['value_date'],
    first_seen_at: daysAgo(8),
    last_seen_at: daysAgo(0),
    resolved_at: null,
    resolution_note: null,
    correction_order: null,
    cycle_count: 160,
  },
  // ── Low · Payment Reference Mismatch · fresh (4d) ──────────────────────────
  {
    id: 'rec_009',
    cycle_id: cycleId(0),
    transaction_id: 'DP20260618100061',
    channel_transaction_id: 'SGB-TXN-55600',
    payment_channel: 'SGB',
    outcome: 'PaymentReferenceMismatch',
    severity: 'low',
    channel_value: { amount: '7600.00', currency: 'USD', status: 'success', payment_reference: 'SGL26107FKFBLDCC' },
    order_value:   { amount: '7600.00', currency: 'USD', status: 'Successful', payment_reference: 'SGL26107FKFBLDC' },
    discrepancy_detail: 'Payment reference mismatch: channel "SGL26107FKFBLDCC" vs order "SGL26107FKFBLDC" (truncation).',
    mismatch_fields: ['payment_reference'],
    first_seen_at: daysAgo(4),
    last_seen_at: daysAgo(0),
    resolved_at: null,
    resolution_note: null,
    correction_order: null,
    cycle_count: 8,
  },
  // ── Critical · Missing Channel Transaction · aged (20d → amber) ────────────
  {
    id: 'rec_010',
    cycle_id: cycleId(0),
    transaction_id: 'DP20260601100099',
    channel_transaction_id: null,
    payment_channel: 'GLDB',
    outcome: 'MissingChannelTransaction',
    severity: 'critical',
    channel_value: null,
    order_value:   { amount: '99000.00', currency: 'SGD', status: 'Successful', counterparty_name: 'Manual Booking Co', value_date: '2026-06-01' },
    discrepancy_detail: 'Order exists with no channel transaction record. Possible manual order creation bypassing the STP pipeline.',
    mismatch_fields: ['amount', 'currency', 'status'],
    first_seen_at: daysAgo(20),
    last_seen_at: daysAgo(0),
    resolved_at: null,
    resolution_note: null,
    correction_order: null,
    cycle_count: 400,
  },
  // ── RESOLVED · Amount Mismatch (history) ───────────────────────────────────
  {
    id: 'rec_011',
    cycle_id: cycleId(6),
    transaction_id: 'DP20260520100021',
    channel_transaction_id: 'GLDB-TXN-87012',
    payment_channel: 'GLDB',
    outcome: 'AmountMismatch',
    severity: 'critical',
    channel_value: { amount: '20000.00', currency: 'SGD', status: 'success', counterparty_name: 'Ninja Van Holdings', value_date: '2026-05-20' },
    order_value:   { amount: '20000.00', currency: 'SGD', status: 'Successful', counterparty_name: 'Ninja Van Holdings', value_date: '2026-05-20' },
    discrepancy_detail: 'Amount mismatch: channel 20000.00 vs order 19000.00 (SGD).',
    mismatch_fields: ['amount'],
    first_seen_at: daysAgo(7),
    last_seen_at: daysAgo(5),
    resolved_at: daysAgo(5),
    resolution_note: 'Order amount corrected via adjustment booking. Channel value confirmed as authoritative.',
    correction_order: 'ADJ-20260601-0012',
    cycle_count: 48,
  },
  // ── RESOLVED · Counterparty Account No Mismatch (history) ──────────────────
  {
    id: 'rec_012',
    cycle_id: cycleId(8),
    transaction_id: 'DP20260512100009',
    channel_transaction_id: 'TZP-TXN-76004',
    payment_channel: 'Tazapay',
    outcome: 'CounterpartyAccountNoMismatch',
    severity: 'medium',
    channel_value: { amount: '3300.00', currency: 'SGD', status: 'success', counterparty_account_no: 'TZP-SG-5510-8842' },
    order_value:   { amount: '3300.00', currency: 'SGD', status: 'Successful', counterparty_account_no: 'TZP-SG-5510-8840' },
    discrepancy_detail: 'Counterparty account no mismatch: channel "...8842" vs order "...8840".',
    mismatch_fields: ['counterparty_account_no'],
    first_seen_at: daysAgo(10),
    last_seen_at: daysAgo(8),
    resolved_at: daysAgo(8),
    resolution_note: 'Confirmed typo in manual entry; order updated to match channel record.',
    correction_order: null,
    cycle_count: 36,
  },
]

/** Per-cycle batch summaries (§7.13.3 — Cycle Results tab). */
export const reconCycles: ReconCycle[] = [
  { cycle_id: cycleId(0),    ran_at: daysAgo(0),  total: 1284, matched: 1274, unmatched: 2, discrepancy: 10 },
  { cycle_id: cycleId(0, 9), ran_at: daysAgo(0, 1), total: 1190, matched: 1182, unmatched: 1, discrepancy: 8 },
  { cycle_id: cycleId(1),    ran_at: daysAgo(1),  total: 1322, matched: 1313, unmatched: 3, discrepancy: 9 },
  { cycle_id: cycleId(6),    ran_at: daysAgo(6),  total: 1201, matched: 1195, unmatched: 1, discrepancy: 6 },
  { cycle_id: cycleId(8),    ran_at: daysAgo(8),  total: 1150, matched: 1146, unmatched: 0, discrepancy: 4 },
]
