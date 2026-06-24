// @ts-nocheck
/**
 * In-memory data store for the demo build.
 *
 * This replaces the MSW mock layer. All page hooks (useDepositOrders / useTasks /
 * useClients / useExport) call the plain async functions below instead of hitting
 * a network. State is held in module-level arrays and mutated in place, so
 * claim / confirm / mark-refunded / classify etc. stay interactive across the session.
 *
 * ── For backend integration ──────────────────────────────────────────────
 * Each exported function is the seam for a real API call. Swap the body of each
 * for a `fetch(...)` to the corresponding endpoint; the hooks and pages need no
 * changes. The endpoint each function maps to is noted in its comment.
 */
import { depositOrders as ordersSeed } from '../data/deposit-orders'
import { depositTasks as tasksSeed }    from '../data/tasks'
import { clients as clientsSeed }       from '../data/clients'
import { channelAccounts as channelAccountsSeed } from '../data/channel-accounts'
import { reconResults as reconSeed, reconCycles as reconCyclesSeed } from '../data/reconciliation'
import { roleDefinitions as rolesSeed, PERMISSION_CATALOG } from '../data/user-roles'
import type { RoleDefinition, RoleKey, PermissionMap } from '../types/user-role'
import type { DepositOrder } from '../types/deposit-order'
import type { DepositTask, TaskStatus, ClientSearchResult } from '../types/task'
import type {
  ChannelAccount, ChannelAccountChannel, AccountType, MappingStatus,
  DuplicateMode, BulkUploadResult, BulkRowResult,
} from '../types/channel-account'
import type { ReconResult, ReconCycle, ReconSeverity, ReconOutcome } from '../types/reconciliation'
import type { PaginatedResponse } from '../types/api'

/* ─── Mutable in-memory state (seeded once per page load) ────── */

const orders: DepositOrder[]  = ordersSeed.map(d => ({ ...d }))
const tasks:  DepositTask[]   = tasksSeed.map(t => ({ ...t, history: [...t.history] }))
const clients: ClientSearchResult[] = clientsSeed
const channelAccts: ChannelAccount[] = channelAccountsSeed.map(c => ({ ...c, history: [...c.history] }))
const reconResults: ReconResult[] = reconSeed.map(r => ({ ...r }))
const reconCycles:  ReconCycle[]  = reconCyclesSeed.map(c => ({ ...c }))
const roles:        RoleDefinition[] = rolesSeed.map(r => ({ ...r, permissions: { ...r.permissions } }))

// "Current user" — in a real app this comes from the session.
const ACTOR = { id: 'ops_002', name: 'Alex Chen' }

const ACTIVE_TASK_STATUSES:  TaskStatus[] = ['PENDING', 'IN_PROGRESS']
const HISTORY_TASK_STATUSES: TaskStatus[] = ['COMPLETED', 'CANCELLED']

const ANOMALOUS_REASONS = ['unidentified', 'status_exception', 'classification', 'missing_fields', 'screening_review']
const PENDING_ANOMALOUS_STATUSES = ['processing.manual_review', 'pending.rfi_missing_fields']

/** Simulate async so React Query loading states still render naturally. */
function tick<T>(value: T): Promise<T> {
  return Promise.resolve(value)
}

function orderById(id: string): DepositOrder | undefined {
  return orders.find(d => d.id === id)
}
function taskById(id: string): DepositTask | undefined {
  return tasks.find(t => t.id === id)
}

// CHUNK_DEPOSIT_QUERIES

/* ─── Deposit Orders ────────────────────────────────────────── */

export interface DepositOrdersFilter {
  anomalous?: boolean
  order_type?: string
  channel?:   string
  status?:    string
  party?:     string
  reason?:    string
  currency?:  string
  txid?:      string
  channel_txid?: string
  sender?:    string
  sender_bank?: string
  beneficiary?: string
  beneficiary_bank?: string
  client?:    string  // beneficiary name or participant code
  amount_min?: number  // major units (e.g. dollars)
  amount_max?: number
  date_from?: string   // created_at range, ISO date
  date_to?:   string
  q?:         string
  page?:      number
  per_page?:  number
}

/** GET /deposit-orders */
export function listDepositOrders(filter: DepositOrdersFilter = {}): Promise<PaginatedResponse<DepositOrder>> {
  const page    = filter.page ?? 1
  const perPage = filter.per_page ?? 20
  const lc = (s?: string) => s?.toLowerCase()
  const channels = filter.channel ? filter.channel.split(',') : []
  const statuses = filter.status  ? filter.status.split(',')  : []
  const parties  = filter.party   ? filter.party.split(',')   : []
  const reasons  = filter.reason  ? filter.reason.split(',')  : []
  const currencies = filter.currency ? filter.currency.split(',') : []
  const orderTypes = filter.order_type ? filter.order_type.split(',') : []
  const txid   = lc(filter.txid)
  const channelTxid = lc(filter.channel_txid)
  const sender = lc(filter.sender)
  const sBank  = lc(filter.sender_bank)
  const bene   = lc(filter.beneficiary)
  const bBank  = lc(filter.beneficiary_bank)
  const client = lc(filter.client)
  const q      = lc(filter.q)

  let items = [...orders]

  if (filter.anomalous) {
    items = items.filter(d =>
      d.internal_reason &&
      ANOMALOUS_REASONS.includes(d.internal_reason) &&
      PENDING_ANOMALOUS_STATUSES.includes(d.status)
    )
    items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }
  if (orderTypes.length) items = items.filter(d => orderTypes.includes(d.order_type))
  if (channels.length) items = items.filter(d => channels.includes(d.payment_channel))
  if (statuses.length) items = items.filter(d => statuses.includes(d.status))
  if (parties.length)  items = items.filter(d => parties.includes(d.classification))
  if (reasons.length)  items = items.filter(d => d.internal_reason && reasons.includes(d.internal_reason))
  if (currencies.length) items = items.filter(d => currencies.includes(d.currency))
  if (filter.amount_min != null) items = items.filter(d => d.amount_minor >= filter.amount_min * 100)
  if (filter.amount_max != null) items = items.filter(d => d.amount_minor <= filter.amount_max * 100)
  if (filter.date_from) {
    const from = new Date(filter.date_from).getTime()
    items = items.filter(d => new Date(d.created_at).getTime() >= from)
  }
  if (filter.date_to) {
    const to = new Date(filter.date_to).getTime() + 86_399_999 // end of day
    items = items.filter(d => new Date(d.created_at).getTime() <= to)
  }
  if (txid)   items = items.filter(d => d.transaction_id.toLowerCase().includes(txid))
  if (channelTxid) items = items.filter(d => (d.channel_transaction_id ?? '').toLowerCase().includes(channelTxid))
  if (sender) items = items.filter(d =>
    (d.counterparty_name ?? '').toLowerCase().includes(sender) ||
    (d.counterparty_account_no ?? '').toLowerCase().includes(sender))
  if (sBank) items = items.filter(d =>
    (d.counterparty_bank_name ?? '').toLowerCase().includes(sBank) ||
    (d.counterparty_bank_swift_bic ?? '').toLowerCase().includes(sBank))
  if (bene) items = items.filter(d =>
    (d.beneficiary_name ?? '').toLowerCase().includes(bene) ||
    (d.beneficiary_account_no ?? '').toLowerCase().includes(bene))
  if (bBank) items = items.filter(d => (d.beneficiary_bank_name ?? '').toLowerCase().includes(bBank))
  if (client) items = items.filter(d =>
    (d.beneficiary_name ?? '').toLowerCase().includes(client) ||
    (d.participant_code ?? '').toLowerCase().includes(client))
  if (q) items = items.filter(d =>
    d.transaction_id.toLowerCase().includes(q) ||
    (d.counterparty_name ?? '').toLowerCase().includes(q) ||
    (d.beneficiary_name ?? '').toLowerCase().includes(q) ||
    (d.reference_code ?? '').toLowerCase().includes(q))

  const total  = items.length
  const sliced = items.slice((page - 1) * perPage, page * perPage)
  return tick({ items: sliced, total, page, per_page: perPage })
}

/** GET /deposit-orders/:id */
export function getDepositOrder(id: string): Promise<DepositOrder> {
  const order = orderById(id)
  if (!order) return Promise.reject(new Error('Order not found'))
  return tick(order)
}

export interface MarkRefundedPayload {
  id: string
  refund_order_number: string
  refund_date: string
  refund_notes?: string
}

/** POST /deposit-orders/:id/mark-refunded (PRD §7.7.8) */
export function markDepositRefunded({ id, refund_order_number, refund_date, refund_notes }: MarkRefundedPayload): Promise<DepositOrder> {
  const order = orderById(id)
  if (!order) return Promise.reject(new Error('Order not found'))
  if (!(order.internal_reason === 'unidentified' && order.status === 'processing.manual_review')) {
    return Promise.reject(new Error('Order is not eligible for manual refund marking'))
  }
  const now = new Date().toISOString()
  order.status = 'refunded'
  order.refund_info = {
    refund_order_number,
    refund_date,
    refund_notes: refund_notes ?? null,
    marked_by: ACTOR.name,
    marked_at: now,
  }
  order.ops_handler = ACTOR.name
  order.updated_at  = now
  return tick(order)
}

// CHUNK_TASK_QUERIES

/* ─── Tasks ─────────────────────────────────────────────────── */

function pushHistory(task: DepositTask, action: string, comment?: string) {
  task.history.push({
    action, actorId: ACTOR.id, actorName: ACTOR.name,
    timestamp: new Date().toISOString(),
    ...(comment ? { comment } : {}),
  })
}
function completeTask(task: DepositTask, action: string, comment?: string) {
  task.status         = 'COMPLETED'
  task.assignedTo     = task.assignedTo ?? ACTOR.id
  task.assignedToName = task.assignedToName ?? ACTOR.name
  task.updated_at     = new Date().toISOString()
  pushHistory(task, action, comment)
}
function cancelTask(task: DepositTask, action: string, comment?: string) {
  task.status         = 'CANCELLED'
  task.assignedTo     = task.assignedTo ?? ACTOR.id
  task.assignedToName = task.assignedToName ?? ACTOR.name
  task.updated_at     = new Date().toISOString()
  pushHistory(task, action, comment)
}

export interface TaskListParams {
  view?:  'active' | 'completed' | 'mine' | 'fyi'
  type?:  string
  q?:     string
  /** Transaction ID search (exact field, vs `q` which also matches id/assignee). */
  txId?:  string
  /** Ops user id, or 'unassigned' for tasks with no owner. */
  assignedTo?: string
  /** Wait-time bucket against created_at: 'under24h' = <24h, '24h' = >24h, '48h' = >48h. */
  wait?:  'under24h' | '24h' | '48h'
  /** Linked-order field searches (matched against the deposit order). */
  senderQ?:     string  // sender name or account
  senderBank?:  string  // sender bank name or SWIFT
  recipientQ?:  string  // beneficiary name or account
  recipientBank?: string
  clientQ?:     string  // beneficiary name or participant code
  /** created_at range (inclusive), ISO date strings. */
  dateFrom?: string
  dateTo?:   string
  page?:  number
  limit?: number
}

// FYI task types — informational only. Collected in their own tab; excluded from
// All Pending / My Tasks and from the active badge count.
const FYI_TASK_TYPES = ['DEPOSIT_MISSING_FIELDS_FYI', 'DEPOSIT_WEBHOOK_PARSE_FAILURE']
const isFyi = (t: DepositTask) => FYI_TASK_TYPES.includes(t.taskType)

/** Apply all task list filters (view + field filters), returning sorted matches. */
function filterTasks(params: TaskListParams = {}): DepositTask[] {
  const search = params.q?.toLowerCase()

  let items = [...tasks]
  if (params.view === 'completed') {
    items = items.filter(t => HISTORY_TASK_STATUSES.includes(t.status))
  } else if (params.view === 'fyi') {
    items = items.filter(t => isFyi(t) && ACTIVE_TASK_STATUSES.includes(t.status))
  } else if (params.view === 'mine') {
    items = items.filter(t => !isFyi(t) && ACTIVE_TASK_STATUSES.includes(t.status) && t.assignedTo === ACTOR.id)
  } else {
    // All Pending — every active task (FYI + everyone else's). My Tasks and FYI
    // are subsets of this set.
    items = items.filter(t => ACTIVE_TASK_STATUSES.includes(t.status))
  }
  if (params.type) items = items.filter(t => t.taskType === params.type)
  if (search) items = items.filter(t =>
    t.id.toLowerCase().includes(search) ||
    t.transactionId.toLowerCase().includes(search) ||
    (t.assignedToName ?? '').toLowerCase().includes(search))

  // Transaction ID (dedicated field search)
  const txId = params.txId?.toLowerCase()
  if (txId) items = items.filter(t => t.transactionId.toLowerCase().includes(txId))

  // Assigned to — id, or 'unassigned' for ownerless tasks
  if (params.assignedTo) {
    items = params.assignedTo === 'unassigned'
      ? items.filter(t => !t.assignedTo)
      : items.filter(t => t.assignedTo === params.assignedTo)
  }

  // Wait-time bucket against created_at
  if (params.wait) {
    if (params.wait === 'under24h') {
      const cutoff = Date.now() - 24 * 3_600_000
      items = items.filter(t => new Date(t.created_at).getTime() > cutoff)
    } else {
      const minHours = params.wait === '48h' ? 48 : 24
      const cutoff = Date.now() - minHours * 3_600_000
      items = items.filter(t => new Date(t.created_at).getTime() <= cutoff)
    }
  }

  // created_at date range (inclusive)
  if (params.dateFrom) {
    const from = new Date(params.dateFrom).getTime()
    items = items.filter(t => new Date(t.created_at).getTime() >= from)
  }
  if (params.dateTo) {
    const to = new Date(params.dateTo).getTime() + 86_399_999 // end of day
    items = items.filter(t => new Date(t.created_at).getTime() <= to)
  }

  // Linked-order field searches — join via depositOrderId. Parse-failure tasks
  // have no order, so they drop out whenever any order-based filter is active.
  const senderQ      = params.senderQ?.toLowerCase()
  const senderBank   = params.senderBank?.toLowerCase()
  const recipientQ   = params.recipientQ?.toLowerCase()
  const recipientBank = params.recipientBank?.toLowerCase()
  const clientQ      = params.clientQ?.toLowerCase()
  const needsOrder = senderQ || senderBank || recipientQ || recipientBank || clientQ
  if (needsOrder) {
    items = items.filter(t => {
      const o = t.depositOrderId ? orderById(t.depositOrderId) : undefined
      if (!o) return false
      if (senderQ && !(
        (o.counterparty_name ?? '').toLowerCase().includes(senderQ) ||
        (o.counterparty_account_no ?? '').toLowerCase().includes(senderQ))) return false
      if (senderBank && !(
        (o.counterparty_bank_name ?? '').toLowerCase().includes(senderBank) ||
        (o.counterparty_bank_swift_bic ?? '').toLowerCase().includes(senderBank))) return false
      if (recipientQ && !(
        (o.beneficiary_name ?? '').toLowerCase().includes(recipientQ) ||
        (o.beneficiary_account_no ?? '').toLowerCase().includes(recipientQ))) return false
      if (recipientBank && !(o.beneficiary_bank_name ?? '').toLowerCase().includes(recipientBank)) return false
      if (clientQ && !(
        (o.beneficiary_name ?? '').toLowerCase().includes(clientQ) ||
        (o.participant_code ?? '').toLowerCase().includes(clientQ))) return false
      return true
    })
  }

  if (params.view !== 'completed') {
    items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  } else {
    items.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
  }

  return items
}

/** GET /tasks */
export function listTasks(params: TaskListParams = {}) {
  const page  = params.page  ?? 1
  const limit = params.limit ?? 20

  const items = filterTasks(params)
  const total = items.length
  const sliced = items.slice((page - 1) * limit, page * limit)
  // All Pending badge — every active task (FYI tasks included; they are a subset).
  const badgeCount = tasks.filter(t => ACTIVE_TASK_STATUSES.includes(t.status)).length
  return tick({ tasks: sliced, total, page, per_page: limit, badgeCount })
}

/** All filtered tasks (no pagination) — used by the per-tab export. */
export function listTasksForExport(params: TaskListParams = {}): DepositTask[] {
  return filterTasks(params)
}

/** GET /tasks/badge-count — per-view active counts (badgeCount = action-required, excludes FYI) */
export function getTaskBadgeCount(): Promise<{ badgeCount: number; mineCount: number; fyiCount: number }> {
  const active = tasks.filter(t => ACTIVE_TASK_STATUSES.includes(t.status))
  return tick({
    badgeCount: active.length,
    mineCount:  active.filter(t => !isFyi(t) && t.assignedTo === ACTOR.id).length,
    fyiCount:   active.filter(t => isFyi(t)).length,
  })
}

/** GET /tasks/:id */
export function getTask(id: string): Promise<DepositTask> {
  const task = taskById(id)
  if (!task) return Promise.reject(new Error('Task not found'))
  return tick(task)
}

// CHUNK_TASK_MUTATIONS

/** POST /tasks/:id/claim */
export function claimTask(id: string): Promise<DepositTask> {
  const task = taskById(id)
  if (!task) return Promise.reject(new Error('Task not found'))
  task.assignedTo = ACTOR.id
  task.assignedToName = ACTOR.name
  task.status = 'IN_PROGRESS'
  task.updated_at = new Date().toISOString()
  pushHistory(task, 'TASK_CLAIMED')
  return tick(task)
}

/** POST /tasks/:id/unclaim */
export function unclaimTask(id: string): Promise<DepositTask> {
  const task = taskById(id)
  if (!task) return Promise.reject(new Error('Task not found'))
  task.assignedTo = null
  task.assignedToName = null
  task.status = 'PENDING'
  task.updated_at = new Date().toISOString()
  pushHistory(task, 'TASK_UNCLAIMED')
  return tick(task)
}

/** POST /tasks/:id/complete */
export function completeTaskById({ id, comment }: { id: string; comment?: string }): Promise<DepositTask> {
  const task = taskById(id)
  if (!task) return Promise.reject(new Error('Task not found'))
  completeTask(task, 'TASK_COMPLETED', comment)
  return tick(task)
}

/** POST /tasks/:id/note */
export function addTaskNote({ id, comment }: { id: string; comment: string }): Promise<DepositTask> {
  const task = taskById(id)
  if (!task) return Promise.reject(new Error('Task not found'))
  task.updated_at = new Date().toISOString()
  pushHistory(task, 'TASK_NOTE', comment)
  return tick(task)
}

/** POST /tasks/:id/confirm-recipient — DEPOSIT_RECIPIENT_MATCHING */
export function confirmRecipient({ id, participant_code, client_name, account_number, via_manual_search }:
  { id: string; participant_code: string; client_name: string; account_number: string; via_manual_search?: boolean }): Promise<DepositTask> {
  const task = taskById(id)
  if (!task) return Promise.reject(new Error('Task not found'))
  const order = orderById(task.depositOrderId)
  if (order) {
    order.beneficiary_name     = client_name
    order.participant_code     = participant_code
    order.beneficiary_account_no  = account_number
    order.classification = order.classification === 'unclassified' ? '1st_party' : order.classification
    order.status               = 'successful'
    order.internal_reason     = undefined
    order.credit_date          = new Date().toISOString()
    order.ops_handler          = ACTOR.name
    order.updated_at           = new Date().toISOString()
  }
  const method = via_manual_search ? 'manual search' : 'candidate list'
  completeTask(task, 'TASK_RECIPIENT_CONFIRMED', `Recipient confirmed via ${method}: ${client_name} (${participant_code}). Deposit re-entered pipeline → screening → credit.`)
  return tick(task)
}

/** POST /tasks/:id/retry — DEPOSIT_STATUS_EXCEPTION */
export function retryTask({ id, comment }: { id: string; comment?: string }): Promise<DepositTask> {
  const task = taskById(id)
  if (!task) return Promise.reject(new Error('Task not found'))
  const order = orderById(task.depositOrderId)
  if (order) {
    order.status           = 'successful'
    order.internal_reason = undefined
    order.credit_date      = new Date().toISOString()
    order.ops_handler      = ACTOR.name
    order.updated_at       = new Date().toISOString()
  }
  completeTask(task, 'TASK_RETRIED', comment || 'Account status resolved. Deposit re-entered pipeline at Step 6.')
  return tick(task)
}

/** POST /tasks/:id/classify — DEPOSIT_CLASSIFICATION */
export function classifyTask({ id, classification }: { id: string; classification: '1st_party' | '3rd_party' }): Promise<DepositTask> {
  const task = taskById(id)
  if (!task) return Promise.reject(new Error('Task not found'))
  const order = orderById(task.depositOrderId)
  if (order) {
    order.classification = classification
    order.status               = 'successful'
    order.internal_reason     = undefined
    order.credit_date          = new Date().toISOString()
    order.ops_handler          = ACTOR.name
    order.updated_at           = new Date().toISOString()
  }
  const label = classification === '1st_party' ? '1st Party' : '3rd Party'
  completeTask(task, 'TASK_CLASSIFIED', `Classified as ${label}. Deposit proceeds to screening.`)
  return tick(task)
}

/** POST /tasks/:id/fill-fields — DEPOSIT_MISSING_FIELDS_FYI */
export function fillFields({ id, fields }: { id: string; fields: Record<string, string> }): Promise<DepositTask> {
  const task = taskById(id)
  if (!task) return Promise.reject(new Error('Task not found'))
  const order = orderById(task.depositOrderId)
  if (order) {
    for (const [k, v] of Object.entries(fields)) {
      if (v) (order as any)[k] = v
    }
    order.status           = 'successful'
    order.internal_reason = undefined
    order.credit_date      = new Date().toISOString()
    order.ops_handler      = ACTOR.name
    order.updated_at       = new Date().toISOString()
  }
  const filled = Object.keys(fields).filter(k => fields[k]).join(', ')
  completeTask(task, 'TASK_FIELDS_FILLED', `Missing fields provided: ${filled}. Deposit proceeds to screening.`)
  return tick(task)
}

/** POST /tasks/:id/reject-refund — recipient matching / screening review reject path */
export function rejectRefund({ id, reason }: { id: string; reason: string }): Promise<DepositTask> {
  const task = taskById(id)
  if (!task) return Promise.reject(new Error('Task not found'))
  const order = orderById(task.depositOrderId)
  if (order) {
    order.status      = 'refunding'
    order.ops_handler = ACTOR.name
    order.updated_at  = new Date().toISOString()
  }
  completeTask(task, 'TASK_REJECTED_REFUND', `Rejected → refund flow initiated. Reason: ${reason}`)
  return tick(task)
}

/** POST /tasks/:id/approve-screening — DEPOSIT_SCREENING_REVIEW */
export function approveScreening({ id, comment }: { id: string; comment?: string }): Promise<DepositTask> {
  const task = taskById(id)
  if (!task) return Promise.reject(new Error('Task not found'))
  const order = orderById(task.depositOrderId)
  if (order) {
    order.screening_result = 'pass'
    order.status           = 'successful'
    order.internal_reason = undefined
    order.credit_date      = new Date().toISOString()
    order.ops_handler      = ACTOR.name
    order.updated_at       = new Date().toISOString()
  }
  completeTask(task, 'TASK_SCREENING_APPROVED', comment || 'Compliance approved screening. Deposit credited.')
  return tick(task)
}

/** POST /tasks/:id/close-no-action — DEPOSIT_WEBHOOK_PARSE_FAILURE → CANCELLED */
export function closeNoAction({ id, reason }: { id: string; reason?: string }): Promise<DepositTask> {
  const task = taskById(id)
  if (!task) return Promise.reject(new Error('Task not found'))
  cancelTask(task, 'TASK_CLOSED_NO_ACTION', reason?.trim() ? `Closed — no action needed. Reason: ${reason}` : 'Closed — no action needed.')
  return tick(task)
}

/* ─── Mock assignees (demo build) ───────────────────────────── */

export interface MockAssignee {
  id:   string
  name: string
  role: string
}

const MOCK_ASSIGNEES: MockAssignee[] = [
  { id: 'ops_001', name: 'Sarah Lin',     role: 'Senior Ops' },
  { id: 'ops_002', name: 'Alex Chen',     role: 'Ops Analyst' },
  { id: 'ops_003', name: 'James Wu',      role: 'Ops Analyst' },
  { id: 'ops_004', name: 'Mei Tanaka',    role: 'Compliance' },
  { id: 'ops_005', name: 'David Park',    role: 'Senior Compliance' },
]

/** The roster used to populate the "Assigned to" filter (sync, demo build). */
export function listAssignees(): MockAssignee[] {
  return MOCK_ASSIGNEES
}

/** GET /tasks/:id/eligible-assignees */
export function getEligibleAssignees(_id: string): Promise<{ assignees: MockAssignee[] }> {
  return tick({ assignees: MOCK_ASSIGNEES })
}

/** POST /tasks/:id/assign */
export function reassignTask({ id, targetUserId, reason }: { id: string; targetUserId: string; reason?: string }): Promise<DepositTask> {
  const task = taskById(id)
  if (!task) return Promise.reject(new Error('Task not found'))
  const assignee = MOCK_ASSIGNEES.find(a => a.id === targetUserId)
  if (!assignee) return Promise.reject(new Error('Assignee not found'))
  const prev = task.assignedToName
  task.assignedTo     = assignee.id
  task.assignedToName = assignee.name
  task.status         = task.status === 'PENDING' ? 'IN_PROGRESS' : task.status
  task.updated_at     = new Date().toISOString()
  const comment = reason ? `Reason: ${reason}` : undefined
  const note = prev ? `Reassigned from ${prev} to ${assignee.name}` : `Assigned to ${assignee.name}`
  pushHistory(task, 'TASK_ASSIGNED', comment ? `${note}. ${comment}` : note)
  return tick(task)
}

// CHUNK_CLIENTS_EXPORT

/* ─── Clients (manual recipient search) ─────────────────────── */

/** GET /clients?q= */
export function searchClients(query: string, limit = 20): Promise<PaginatedResponse<ClientSearchResult>> {
  const q = query.trim().toLowerCase()
  let items = clients
  if (q) items = clients.filter(c =>
    c.client_name.toLowerCase().includes(q) ||
    c.participant_code.toLowerCase().includes(q))
  const total = items.length
  return tick({ items: items.slice(0, limit), total, page: 1, per_page: limit })
}

/* ─── Export ────────────────────────────────────────────────── */

export interface ExportParams {
  type: string
  filters: Record<string, string>
}
export interface ExportResult {
  job_id: string
  download_url: string
  filename: string
}

/** POST /export — demo returns a tiny inline CSV data URL */
export function exportData({ type, filters }: ExportParams): Promise<ExportResult> {
  const filename = `export_${type}_${filters.from ?? 'all'}_${filters.to ?? 'now'}.csv`
  return tick({
    job_id: `job_${Date.now()}`,
    download_url: 'data:text/csv;charset=utf-8,transaction_id%2Camount%2Cstatus%0ADP001%2C1000%2Csuccessful',
    filename,
  })
}

// CHUNK_CHANNEL_ACCOUNTS

/* ─── Channel Accounts (Fiat Account Mapping Reference Table, PRD §7.4) ──────── */

function channelAccountById(id: string): ChannelAccount | undefined {
  return channelAccts.find(c => c.id === id)
}

function pushAcctHistory(acct: ChannelAccount, action: string, comment?: string) {
  acct.history.push({
    action, actorId: ACTOR.id, actorName: ACTOR.name,
    timestamp: new Date().toISOString(),
    ...(comment ? { comment } : {}),
  })
}

/** Uniqueness key per §7.4: Payment Channel + Channel Account Number + Account Type. */
function acctKey(channel: string, channelAccountNumber: string, accountType: string): string {
  return `${channel}::${channelAccountNumber}::${accountType}`.toLowerCase()
}

export interface ChannelAccountsFilter {
  /** Comma-separated payment channels. */
  channel?:            string
  account_type?:       AccountType | ''
  channel_account?:    string
  reference_code?:     string
  user_channel_account?: string
  currency?:           string
  client_name?:        string
  participant_code?:   string
  /** Combined "Client Name or Participant Code" search (matches either field). */
  client_q?:           string
  /** Comma-separated participant statuses. */
  participant_status?: string
  mapping_status?:     MappingStatus | ''
  /** Free-text search across channel account / user channel account / client / reference. */
  q?:                  string
  page?:               number
  per_page?:           number
}

/** GET /channel-accounts — list with filters (archived rows excluded). */
export function listChannelAccounts(filter: ChannelAccountsFilter = {}): Promise<PaginatedResponse<ChannelAccount>> {
  const page    = filter.page ?? 1
  const perPage = filter.per_page ?? 20
  const lc = (s?: string) => s?.trim().toLowerCase()
  const channels  = filter.channel ? filter.channel.split(',') : []
  const pStatuses = filter.participant_status ? filter.participant_status.split(',') : []
  const chanAcct  = lc(filter.channel_account)
  const refCode   = lc(filter.reference_code)
  const userAcct  = lc(filter.user_channel_account)
  const currency  = lc(filter.currency)
  const clientNm  = lc(filter.client_name)
  const partCode  = lc(filter.participant_code)
  const clientQ   = lc(filter.client_q)
  const q         = lc(filter.q)

  let items = channelAccts.filter(c => !c.archived)

  if (channels.length)  items = items.filter(c => channels.includes(c.payment_channel))
  if (filter.account_type)   items = items.filter(c => c.account_type === filter.account_type)
  if (filter.mapping_status) items = items.filter(c => c.mapping_status === filter.mapping_status)
  if (pStatuses.length) items = items.filter(c => pStatuses.includes(c.participant_status))
  if (chanAcct) items = items.filter(c => c.channel_account_number.toLowerCase().includes(chanAcct))
  if (refCode)  items = items.filter(c => (c.reference_code ?? '').toLowerCase().includes(refCode))
  if (userAcct) items = items.filter(c => c.user_channel_account_number.toLowerCase().includes(userAcct))
  if (currency) items = items.filter(c => c.currency.some(cur => cur.toLowerCase().includes(currency)))
  if (clientNm) items = items.filter(c => c.client_name.toLowerCase().includes(clientNm))
  if (partCode) items = items.filter(c => (c.participant_code ?? '').toLowerCase().includes(partCode))
  if (clientQ)  items = items.filter(c =>
    c.client_name.toLowerCase().includes(clientQ) ||
    (c.participant_code ?? '').toLowerCase().includes(clientQ))
  if (q) items = items.filter(c =>
    c.channel_account_number.toLowerCase().includes(q) ||
    c.user_channel_account_number.toLowerCase().includes(q) ||
    c.client_name.toLowerCase().includes(q) ||
    (c.reference_code ?? '').toLowerCase().includes(q))

  items.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

  const total  = items.length
  const sliced = items.slice((page - 1) * perPage, page * perPage)
  return tick({ items: sliced, total, page, per_page: perPage })
}

/** GET /channel-accounts/:id */
export function getChannelAccount(id: string): Promise<ChannelAccount> {
  const acct = channelAccountById(id)
  if (!acct) return Promise.reject(new Error('Channel account not found'))
  return tick(acct)
}
// CHUNK_CHANNEL_ACCOUNTS_MUTATIONS

export interface CreateChannelAccountPayload {
  payment_channel:        ChannelAccountChannel
  channel_account_number: string
  user_channel_account_number: string
  account_type:           AccountType
  currency:               string[]
  mapping_status:         MappingStatus
  /** Client identity — in a real system auto-populated via CAMP lookup on Participant Code entry. */
  client_name:            string
  participant_code:       string | null
  bank_details:           ChannelAccount['bank_details']
  intermediary_bank:      ChannelAccount['intermediary_bank']
}

/** POST /channel-accounts — Add New Entry (§7.4). Reference Code is system-generated (null here). */
export function createChannelAccount(payload: CreateChannelAccountPayload): Promise<ChannelAccount> {
  const key = acctKey(payload.payment_channel, payload.user_channel_account_number, payload.account_type)
  const dup = channelAccts.some(c => !c.archived &&
    acctKey(c.payment_channel, c.user_channel_account_number, c.account_type) === key)
  if (dup) {
    return Promise.reject(new Error('A mapping with this Payment Channel + Channel Account Number + Account Type already exists.'))
  }
  const now = new Date().toISOString()
  const acct: ChannelAccount = {
    id: `ca_${Date.now()}`,
    payment_channel:        payload.payment_channel,
    channel_account_number: payload.channel_account_number.trim(),
    user_channel_account_number: payload.user_channel_account_number.trim(),
    account_type:           payload.account_type,
    reference_code:         null,
    currency:               payload.currency.map(c => c.trim().toUpperCase()).filter(Boolean),
    client_name:            payload.client_name.trim(),
    participant_code:       payload.participant_code?.trim() || null,
    participant_status:     'active',
    mapping_status:         payload.mapping_status,
    bank_details:           payload.bank_details,
    intermediary_bank:      payload.intermediary_bank,
    archived:               false,
    history:                [],
    created_at:             now,
    updated_at:             now,
  }
  pushAcctHistory(acct, 'ACCOUNT_CREATED')
  channelAccts.unshift(acct)
  return tick(acct)
}

export interface UpdateChannelAccountPayload {
  id: string
  /** GLDB entries may correct these; non-GLDB account numbers are read-only. */
  channel_account_number?: string
  user_channel_account_number?: string
  currency?:               string[]
  mapping_status?:         MappingStatus
  bank_details?:           ChannelAccount['bank_details']
  intermediary_bank?:      ChannelAccount['intermediary_bank']
}

/** PATCH /channel-accounts/:id — Edit Entry (§7.4). Client identity fields stay read-only. */
export function updateChannelAccount(payload: UpdateChannelAccountPayload): Promise<ChannelAccount> {
  const acct = channelAccountById(payload.id)
  if (!acct) return Promise.reject(new Error('Channel account not found'))

  const isGldb = acct.payment_channel === 'GLDB'
  // Non-GLDB: account number fields are read-only (§7.4 Edit Entry).
  if (isGldb && payload.user_channel_account_number != null) {
    const next = payload.user_channel_account_number.trim()
    const key  = acctKey(acct.payment_channel, next, acct.account_type)
    const clash = channelAccts.some(c => c.id !== acct.id && !c.archived &&
      acctKey(c.payment_channel, c.user_channel_account_number, c.account_type) === key)
    if (clash) return Promise.reject(new Error('Another active mapping already uses this Channel Account Number for this channel + account type.'))
    acct.user_channel_account_number = next
  }
  if (isGldb && payload.channel_account_number != null) acct.channel_account_number = payload.channel_account_number.trim()
  if (payload.currency != null)          acct.currency = payload.currency.map(c => c.trim().toUpperCase()).filter(Boolean)
  if (payload.mapping_status != null)    acct.mapping_status = payload.mapping_status
  if (payload.bank_details != null)      acct.bank_details = payload.bank_details
  if (payload.intermediary_bank !== undefined) acct.intermediary_bank = payload.intermediary_bank

  acct.updated_at = new Date().toISOString()
  pushAcctHistory(acct, 'ACCOUNT_UPDATED')
  return tick(acct)
}

/** PATCH /channel-accounts/:id/mapping-status — toggle Active/Inactive (always editable). */
export function setMappingStatus({ id, status }: { id: string; status: MappingStatus }): Promise<ChannelAccount> {
  const acct = channelAccountById(id)
  if (!acct) return Promise.reject(new Error('Channel account not found'))
  acct.mapping_status = status
  acct.updated_at = new Date().toISOString()
  pushAcctHistory(acct, 'ACCOUNT_MAPPING_STATUS', `Mapping set to ${status}`)
  return tick(acct)
}

/** DELETE /channel-accounts/:id — soft delete (archived, excluded from list + engine). */
export function deleteChannelAccount(id: string): Promise<{ id: string }> {
  const acct = channelAccountById(id)
  if (!acct) return Promise.reject(new Error('Channel account not found'))
  acct.archived = true
  acct.updated_at = new Date().toISOString()
  pushAcctHistory(acct, 'ACCOUNT_ARCHIVED')
  return tick({ id })
}
// CHUNK_CHANNEL_ACCOUNTS_BULK

/* ─── Bulk Upload (GLDB only, §7.4) ──────────────────────────────────────────
 *
 * Architecture note: in production the uploaded Excel is parsed and validated
 * SERVER-SIDE (the trust boundary). The client uploads the file and receives only
 * a structured result report — it never parses the workbook itself. This avoids
 * the file-parsing injection / prototype-pollution surface entirely on the front
 * end. The function below stands in for that backend: it synthesises a realistic
 * parsed batch, applies it under the chosen duplicate mode, mutates the in-memory
 * table, and returns the report. Swap its body for `fetch('/channel-accounts/bulk-upload', { body: formData })`.
 */

export interface BulkUploadPayload {
  /** Uploaded file name (the bytes go to the backend; demo only needs the name). */
  fileName: string
  /** GLDB only — other channels are rejected up front (§7.4). */
  channel: ChannelAccountChannel
  /** Ops-selected duplicate handling: skip existing rows, or update them. */
  mode: DuplicateMode
}

/** A synthetic "parsed" row the mock backend pretends it read from the workbook. */
interface ParsedBulkRow {
  channel_account_number:      string
  user_channel_account_number: string
  currency:                    string
  account_type:                AccountType
  participant_code:            string | null
  client_name:                 string
  /** Set when the row is intentionally invalid, so we can report a rejection. */
  invalidReason?:              string
}

/** Fixed synthetic batch — represents what the backend parsed out of the file. */
const SYNTHETIC_BULK_BATCH: ParsedBulkRow[] = [
  // New rows (no existing GLDB match) → added
  { channel_account_number: 'GLDB-8800-2001-0001', user_channel_account_number: 'UCA-RDM-001', currency: 'SGD', account_type: 'fiat', participant_code: 'PART-RDM-001', client_name: 'RedMart Logistics' },
  { channel_account_number: 'GLDB-8800-2001-0002', user_channel_account_number: 'UCA-GJK-001', currency: 'IDR', account_type: 'fiat', participant_code: 'PART-GJK-001', client_name: 'Gojek Tech Sub' },
  { channel_account_number: 'GLDB-8800-2001-0003', user_channel_account_number: 'UCA-SHP-002', currency: 'USD', account_type: 'investment_fiat', participant_code: 'PART-SHP-002', client_name: 'Shopee Express' },
  // Collides with existing GLDB ca_001 (same channel + account no + type) → updated or ignored per mode
  { channel_account_number: 'GLDB-8800-1234-5678', user_channel_account_number: 'UCA-ALI-001', currency: 'SGD', account_type: 'fiat', participant_code: 'PART-ALI-001', client_name: 'Alibaba Group Holding Limited' },
  // Invalid: no participant code → rejected regardless of mode
  { channel_account_number: 'GLDB-8800-2001-0009', user_channel_account_number: 'UCA-UNK-999', currency: 'SGD', account_type: 'fiat', participant_code: null, client_name: '', invalidReason: 'Missing client identifier — Participant Code is required.' },
]

/** POST /channel-accounts/bulk-upload — returns the result report (backend-parsed). */
export function bulkUploadChannelAccounts(payload: BulkUploadPayload): Promise<BulkUploadResult> {
  // Non-GLDB bulk upload is rejected with a clear error (§7.4).
  if (payload.channel !== 'GLDB') {
    return Promise.reject(new Error('Bulk upload supports the GLDB channel only. Add other channels individually.'))
  }

  const rows: BulkRowResult[] = []
  let added = 0, updated = 0, ignored = 0, rejected = 0
  const now = new Date().toISOString()

  SYNTHETIC_BULK_BATCH.forEach((row, i) => {
    const rowNumber = i + 2 // +2: header row is row 1
    if (row.invalidReason) {
      rejected++
      rows.push({ rowNumber, outcome: 'rejected', channel_account_number: row.channel_account_number, reason: row.invalidReason })
      return
    }

    const key = acctKey('GLDB', row.channel_account_number, row.account_type)
    const existing = channelAccts.find(c => !c.archived &&
      acctKey(c.payment_channel, c.channel_account_number, c.account_type) === key)

    if (existing) {
      if (payload.mode === 'ignore') {
        ignored++
        rows.push({ rowNumber, outcome: 'ignored', channel_account_number: row.channel_account_number, reason: 'Duplicate — existing row kept unchanged.' })
      } else {
        // overwrite: update mutable fields of the existing row
        existing.user_channel_account_number = row.user_channel_account_number
        existing.currency           = [row.currency]
        existing.participant_code   = row.participant_code
        existing.client_name        = row.client_name
        existing.updated_at         = now
        pushAcctHistory(existing, 'ACCOUNT_BULK_UPDATED', `Updated via bulk upload (${payload.fileName})`)
        updated++
        rows.push({ rowNumber, outcome: 'updated', channel_account_number: row.channel_account_number })
      }
      return
    }

    // No match → insert a new row
    const acct: ChannelAccount = {
      id: `ca_${Date.now()}_${i}`,
      payment_channel:        'GLDB',
      channel_account_number: row.channel_account_number,
      user_channel_account_number: row.user_channel_account_number,
      account_type:           row.account_type,
      reference_code:         null,
      currency:               [row.currency],
      client_name:            row.client_name,
      participant_code:       row.participant_code,
      participant_status:     'active',
      mapping_status:         'active',
      bank_details:           { bank_name: 'Green Link Digital Bank (GLDB)', account_number: row.channel_account_number, swift_code: 'GLDBSGSG', country_code: 'SG', bank_address: '88 Market Street, Floor 30, CapitaSpring, Singapore 048948' },
      intermediary_bank:      null,
      archived:               false,
      history:                [],
      created_at:             now,
      updated_at:             now,
    }
    pushAcctHistory(acct, 'ACCOUNT_BULK_CREATED', `Created via bulk upload (${payload.fileName})`)
    channelAccts.unshift(acct)
    added++
    rows.push({ rowNumber, outcome: 'added', channel_account_number: row.channel_account_number })
  })

  return tick({ added, updated, ignored, rejected, rows })
}

// CHUNK_GLDB_PAYEE_LOOKUP

/* ─── GLDB Webhook Parser — Payee Lookup (GLDB tool PRD §6.2) ─────────────────
 *
 * Deterministic key lookup: the webhook account number is matched EXACTLY against
 * `channel_account_number` (Channel Account Number, Internal) in the Fiat Account
 * Mapping Reference Table. Archived + inactive mappings are still returned (the UI
 * flags them) so Ops sees a mapping exists but is not active. Multiple matches
 * (same account number, different Account Types) are all returned.
 */
export interface PayeeLookupResult {
  confidence:        'exact' | 'multiple' | 'none'
  searchedAccountNo: string
  matches:           ChannelAccount[]
}

/** GET /payee-lookup?accountNo= — exact match on Channel Account Number (Internal). */
export function lookupPayee(accountNo: string): Promise<PayeeLookupResult> {
  const key = accountNo.trim().toLowerCase()
  const matches = channelAccts.filter(c =>
    !c.archived && c.channel_account_number.trim().toLowerCase() === key)
  const confidence = matches.length === 0 ? 'none' : matches.length === 1 ? 'exact' : 'multiple'
  return tick({ confidence, searchedAccountNo: accountNo.trim(), matches })
}

// CHUNK_RECONCILIATION

/* ─── Channel–Order Reconciliation (PRD §7.13.7) ─────────────────────────────
 *
 * Backs the Reconciliation Report page. `Match` rows are never surfaced here —
 * they're audit-trail only — so the seed contains discrepancies + resolved items.
 */

/** Resolved-status filter for the three tabs. */
export type ReconResolvedFilter = 'open' | 'resolved' | 'all'

export interface ReconResultsFilter {
  /** Resolved lifecycle filter — drives Open / Resolved / All tabs. */
  resolved?:        ReconResolvedFilter
  cycle_id?:        string
  transaction_id?:  string
  channel?:         string
  recon_type?:      string
  /** Comma-separated outcome types (multi-select). */
  outcome?:         string
  severity?:        ReconSeverity | ''
  /** Age range in days since first_seen_at. */
  age_min?:         number
  age_max?:         number
  /** Resolved-at range (Resolved History tab). */
  resolved_from?:   string
  resolved_to?:     string
  page?:            number
  per_page?:        number
}

/** Whole-days elapsed since an ISO timestamp. */
function ageInDays(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

function reconById(id: string): ReconResult | undefined {
  return reconResults.find(r => r.id === id)
}

/** GET /reconciliation/results — filtered list (§7.13.7 query conditions). */
export function listReconResults(filter: ReconResultsFilter = {}): Promise<PaginatedResponse<ReconResult>> {
  const page    = filter.page ?? 1
  const perPage = filter.per_page ?? 20
  const lc = (s?: string) => s?.trim().toLowerCase()
  const outcomes = filter.outcome ? filter.outcome.split(',') : []
  const txid     = lc(filter.transaction_id)
  const cycle    = lc(filter.cycle_id)

  let items = reconResults.slice()

  // Resolved lifecycle
  if (filter.resolved === 'open')     items = items.filter(r => !r.resolved_at)
  if (filter.resolved === 'resolved') items = items.filter(r => !!r.resolved_at)

  if (filter.channel)   items = items.filter(r => r.payment_channel === filter.channel)
  if (filter.recon_type) items = items.filter(r => r.recon_type === filter.recon_type)
  if (filter.severity)  items = items.filter(r => r.severity === filter.severity)
  if (outcomes.length)  items = items.filter(r => outcomes.includes(r.outcome))
  if (txid)  items = items.filter(r => (r.transaction_id ?? '').toLowerCase().includes(txid))
  if (cycle) items = items.filter(r => r.cycle_id.toLowerCase().includes(cycle))
  if (filter.age_min != null) items = items.filter(r => ageInDays(r.first_seen_at) >= filter.age_min!)
  if (filter.age_max != null) items = items.filter(r => ageInDays(r.first_seen_at) <= filter.age_max!)
  if (filter.resolved_from) items = items.filter(r => r.resolved_at && r.resolved_at >= filter.resolved_from!)
  if (filter.resolved_to)   items = items.filter(r => r.resolved_at && r.resolved_at <= filter.resolved_to! + 'T23:59:59.999Z')

  // Open discrepancies: oldest first (§7.13.7). Resolved/All: most recent activity first.
  if (filter.resolved === 'open') {
    items.sort((a, b) => new Date(a.first_seen_at).getTime() - new Date(b.first_seen_at).getTime())
  } else {
    items.sort((a, b) => new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime())
  }

  const total  = items.length
  const sliced = items.slice((page - 1) * perPage, page * perPage)
  return tick({ items: sliced, total, page, per_page: perPage })
}

/** GET /reconciliation/cycles — per-cycle batch summaries (Cycle Results tab). */
export function listReconCycles(): Promise<ReconCycle[]> {
  const sorted = reconCycles.slice().sort((a, b) => new Date(b.ran_at).getTime() - new Date(a.ran_at).getTime())
  return tick(sorted)
}

export interface ResolveReconPayload {
  id: string
  resolution_note: string
  correction_order?: string | null
}

/** POST /reconciliation/results/:id/resolve — Ops resolves a discrepancy (§7.13.7). */
export function resolveReconResult(payload: ResolveReconPayload): Promise<ReconResult> {
  const rec = reconById(payload.id)
  if (!rec) return Promise.reject(new Error('Reconciliation result not found'))
  if (!payload.resolution_note.trim()) return Promise.reject(new Error('A resolution note is required.'))
  rec.resolved_at      = new Date().toISOString()
  rec.resolution_note  = payload.resolution_note.trim()
  rec.resolved_by      = ACTOR.name
  rec.correction_order = payload.correction_order?.trim() || null
  return tick(rec)
}

// CHUNK_USER_ROLES

/* ─── Manage User Role — role permission config ──────────────── */

function roleByKey(key: RoleKey): RoleDefinition | undefined {
  return roles.find(r => r.key === key)
}

/** GET /roles — the three role definitions with their permission grants. */
export function listRoles(): Promise<RoleDefinition[]> {
  return tick(roles.map(r => ({ ...r, permissions: { ...r.permissions } })))
}

/**
 * Normalize a permission map against the dependency tree: a child can only be
 * granted while its parent is granted. Revoking a parent cascades to children.
 */
function normalizePermissions(perms: PermissionMap): PermissionMap {
  const next = { ...perms }
  for (const node of PERMISSION_CATALOG) {
    if (node.children && !next[node.key]) {
      for (const child of node.children) next[child.key] = false
    }
  }
  return next
}

export interface UpdateRolePayload {
  key:          RoleKey
  name?:        string
  description?: string
  permissions?: PermissionMap
}

/** PUT /roles/:key — save a role's name, description, and permission grants. */
export function updateRole(payload: UpdateRolePayload): Promise<RoleDefinition> {
  const role = roleByKey(payload.key)
  if (!role) return Promise.reject(new Error('Role not found'))
  if (payload.name != null)        role.name = payload.name.trim() || role.name
  if (payload.description != null) role.description = payload.description
  if (payload.permissions != null) role.permissions = normalizePermissions(payload.permissions)
  return tick({ ...role, permissions: { ...role.permissions } })
}





