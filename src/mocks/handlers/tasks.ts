import { http, HttpResponse } from 'msw'
import { depositTasks } from '../seed/tasks'
import { orderById } from './deposit-orders'
import type { DepositTask, TaskStatus } from '../../types/task'

const ACTIVE_STATUSES: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'ABNORMAL']
const COMPLETED_STATUSES: TaskStatus[] = ['COMPLETED']

// In-memory mutable copy so claim/complete mutations persist in-session
const taskStore: DepositTask[] = depositTasks.map(t => ({ ...t, history: [...t.history] }))

function taskById(id: string): DepositTask | undefined {
  return taskStore.find(t => t.id === id)
}

const ACTOR = { id: 'ops_002', name: 'Alex Chen' }

function pushHistory(task: DepositTask, action: string, comment?: string) {
  task.history.push({
    action, actorId: ACTOR.id, actorName: ACTOR.name,
    timestamp: new Date().toISOString(),
    ...(comment ? { comment } : {}),
  })
}

/** Resolve a task → COMPLETED, stamp handler + timestamp. */
function completeTask(task: DepositTask, action: string, comment?: string) {
  task.status        = 'COMPLETED'
  task.assignedTo    = task.assignedTo ?? ACTOR.id
  task.assignedToName= task.assignedToName ?? ACTOR.name
  task.updated_at    = new Date().toISOString()
  pushHistory(task, action, comment)
}

export const taskHandlers = [
  // GET /api/v1/tasks — list with filtering + pagination
  http.get('/api/v1/tasks', ({ request }) => {
    const url    = new URL(request.url)
    const view   = url.searchParams.get('view')   // 'active' | 'completed' | 'mine'
    const type   = url.searchParams.get('type')   // DepositTaskType
    const search = url.searchParams.get('q')?.toLowerCase()
    const page   = parseInt(url.searchParams.get('page')   ?? '1',  10)
    const limit  = parseInt(url.searchParams.get('limit')  ?? '20', 10)

    let items = [...taskStore]

    if (view === 'completed') {
      items = items.filter(t => COMPLETED_STATUSES.includes(t.status))
    } else if (view === 'mine') {
      // In a real system this would check session; we pin "me" to ops_002 / Alex Chen
      items = items.filter(t => ACTIVE_STATUSES.includes(t.status) && t.assignedTo === 'ops_002')
    } else {
      items = items.filter(t => ACTIVE_STATUSES.includes(t.status))
    }

    if (type) {
      items = items.filter(t => t.taskType === type)
    }

    if (search) {
      items = items.filter(t =>
        t.id.toLowerCase().includes(search) ||
        t.transactionId.toLowerCase().includes(search) ||
        (t.assignedToName ?? '').toLowerCase().includes(search)
      )
    }

    // Active view: oldest first (highest urgency first)
    if (view !== 'completed') {
      items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    } else {
      items.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    }

    const total  = items.length
    const sliced = items.slice((page - 1) * limit, page * limit)
    const badgeCount = taskStore.filter(t => ACTIVE_STATUSES.includes(t.status)).length

    return HttpResponse.json({
      data: { tasks: sliced, total, page, per_page: limit, badgeCount },
    })
  }),

  // GET /api/v1/tasks/badge-count
  http.get('/api/v1/tasks/badge-count', () => {
    const count = taskStore.filter(t => ACTIVE_STATUSES.includes(t.status)).length
    return HttpResponse.json({ data: { count } })
  }),

  // GET /api/v1/tasks/:id
  http.get('/api/v1/tasks/:id', ({ params }) => {
    const task = taskById(params.id as string)
    if (!task) return HttpResponse.json({ error: { code: 'not_found', message: 'Task not found' } }, { status: 404 })
    return HttpResponse.json({ data: task })
  }),

  // POST /api/v1/tasks/:id/claim
  http.post('/api/v1/tasks/:id/claim', async ({ params }) => {
    const task = taskById(params.id as string)
    if (!task) return HttpResponse.json({ error: { code: 'not_found', message: 'Task not found' } }, { status: 404 })
    task.assignedTo     = 'ops_002'
    task.assignedToName = 'Alex Chen'
    task.status         = 'IN_PROGRESS'
    task.updated_at     = new Date().toISOString()
    task.history.push({ action: 'TASK_CLAIMED', actorId: 'ops_002', actorName: 'Alex Chen', timestamp: new Date().toISOString() })
    return HttpResponse.json({ data: task })
  }),

  // POST /api/v1/tasks/:id/unclaim
  http.post('/api/v1/tasks/:id/unclaim', async ({ params }) => {
    const task = taskById(params.id as string)
    if (!task) return HttpResponse.json({ error: { code: 'not_found', message: 'Task not found' } }, { status: 404 })
    task.assignedTo     = null
    task.assignedToName = null
    task.status         = 'PENDING'
    task.updated_at     = new Date().toISOString()
    task.history.push({ action: 'TASK_UNCLAIMED', actorId: 'ops_002', actorName: 'Alex Chen', timestamp: new Date().toISOString() })
    return HttpResponse.json({ data: task })
  }),

  // POST /api/v1/tasks/:id/complete — Ops resolves the task with a resolution note
  http.post('/api/v1/tasks/:id/complete', async ({ params, request }) => {
    const task = taskById(params.id as string)
    if (!task) return HttpResponse.json({ error: { code: 'not_found', message: 'Task not found' } }, { status: 404 })
    const body = await request.json() as { comment?: string }
    task.status     = 'COMPLETED'
    task.updated_at = new Date().toISOString()
    task.history.push({
      action: 'TASK_COMPLETED', actorId: 'ops_002', actorName: 'Alex Chen',
      timestamp: new Date().toISOString(),
      ...(body.comment ? { comment: body.comment } : {}),
    })
    return HttpResponse.json({ data: task })
  }),

  // POST /api/v1/tasks/:id/note — add an ops note without completing
  http.post('/api/v1/tasks/:id/note', async ({ params, request }) => {
    const task = taskById(params.id as string)
    if (!task) return HttpResponse.json({ error: { code: 'not_found', message: 'Task not found' } }, { status: 404 })
    const body = await request.json() as { comment: string }
    task.updated_at = new Date().toISOString()
    pushHistory(task, 'TASK_NOTE', body.comment)
    return HttpResponse.json({ data: task })
  }),

  // POST /api/v1/tasks/:id/confirm-recipient — DEPOSIT_RECIPIENT_MATCHING
  // Ops selects the correct client; deposit re-enters rule engine → credited.
  http.post('/api/v1/tasks/:id/confirm-recipient', async ({ params, request }) => {
    const task = taskById(params.id as string)
    if (!task) return HttpResponse.json({ error: { code: 'not_found', message: 'Task not found' } }, { status: 404 })
    const body = await request.json() as { participant_code: string; client_name: string; account_number: string }

    const order = orderById(task.depositOrderId)
    if (order) {
      order.beneficiary_name    = body.client_name
      order.beneficiary_code    = body.participant_code
      order.beneficiary_account = body.account_number
      order.party_classification = order.party_classification === 'unclassified' ? '1st_party' : order.party_classification
      order.status              = 'successful'
      order.anomalous_reason    = undefined
      order.credit_date         = new Date().toISOString()
      order.ops_handler         = ACTOR.name
      order.updated_at          = new Date().toISOString()
    }
    completeTask(task, 'TASK_RECIPIENT_CONFIRMED', `Recipient confirmed: ${body.client_name} (${body.participant_code}). Deposit re-entered pipeline → screening → credit.`)
    return HttpResponse.json({ data: task })
  }),

  // POST /api/v1/tasks/:id/retry — DEPOSIT_STATUS_EXCEPTION
  // Account status resolved → re-enter pipeline at Step 6.
  http.post('/api/v1/tasks/:id/retry', async ({ params, request }) => {
    const task = taskById(params.id as string)
    if (!task) return HttpResponse.json({ error: { code: 'not_found', message: 'Task not found' } }, { status: 404 })
    const body = await request.json().catch(() => ({})) as { comment?: string }
    const order = orderById(task.depositOrderId)
    if (order) {
      order.status           = 'successful'
      order.anomalous_reason = undefined
      order.credit_date      = new Date().toISOString()
      order.ops_handler      = ACTOR.name
      order.updated_at       = new Date().toISOString()
    }
    completeTask(task, 'TASK_RETRIED', body.comment || 'Account status resolved. Deposit re-entered pipeline at Step 6.')
    return HttpResponse.json({ data: task })
  }),

  // POST /api/v1/tasks/:id/classify — DEPOSIT_CLASSIFICATION
  http.post('/api/v1/tasks/:id/classify', async ({ params, request }) => {
    const task = taskById(params.id as string)
    if (!task) return HttpResponse.json({ error: { code: 'not_found', message: 'Task not found' } }, { status: 404 })
    const body = await request.json() as { classification: '1st_party' | '3rd_party' }
    const order = orderById(task.depositOrderId)
    if (order) {
      order.party_classification = body.classification
      order.status               = 'successful'
      order.anomalous_reason     = undefined
      order.credit_date          = new Date().toISOString()
      order.ops_handler          = ACTOR.name
      order.updated_at           = new Date().toISOString()
    }
    const label = body.classification === '1st_party' ? '1st Party' : '3rd Party'
    completeTask(task, 'TASK_CLASSIFIED', `Classified as ${label}. Deposit proceeds to screening.`)
    return HttpResponse.json({ data: task })
  }),

  // POST /api/v1/tasks/:id/fill-fields — DEPOSIT_MISSING_FIELDS_FYI
  http.post('/api/v1/tasks/:id/fill-fields', async ({ params, request }) => {
    const task = taskById(params.id as string)
    if (!task) return HttpResponse.json({ error: { code: 'not_found', message: 'Task not found' } }, { status: 404 })
    const body = await request.json() as { fields: Record<string, string> }
    const order = orderById(task.depositOrderId)
    if (order) {
      for (const [k, v] of Object.entries(body.fields)) {
        if (v) (order as any)[k] = v
      }
      order.status           = 'successful'
      order.anomalous_reason = undefined
      order.credit_date      = new Date().toISOString()
      order.ops_handler      = ACTOR.name
      order.updated_at       = new Date().toISOString()
    }
    const filled = Object.keys(body.fields).filter(k => body.fields[k]).join(', ')
    completeTask(task, 'TASK_FIELDS_FILLED', `Missing fields provided: ${filled}. Deposit proceeds to screening.`)
    return HttpResponse.json({ data: task })
  }),

  // POST /api/v1/tasks/:id/reject-refund — DEPOSIT_RECIPIENT_MATCHING / SCREENING_REVIEW reject path
  http.post('/api/v1/tasks/:id/reject-refund', async ({ params, request }) => {
    const task = taskById(params.id as string)
    if (!task) return HttpResponse.json({ error: { code: 'not_found', message: 'Task not found' } }, { status: 404 })
    const body = await request.json() as { reason: string }
    const order = orderById(task.depositOrderId)
    if (order) {
      order.status        = 'refunding'
      order.ops_handler   = ACTOR.name
      order.updated_at    = new Date().toISOString()
    }
    completeTask(task, 'TASK_REJECTED_REFUND', `Rejected → refund flow initiated. Reason: ${body.reason}`)
    return HttpResponse.json({ data: task })
  }),

  // POST /api/v1/tasks/:id/approve-screening — DEPOSIT_SCREENING_REVIEW approve path
  http.post('/api/v1/tasks/:id/approve-screening', async ({ params, request }) => {
    const task = taskById(params.id as string)
    if (!task) return HttpResponse.json({ error: { code: 'not_found', message: 'Task not found' } }, { status: 404 })
    const body = await request.json().catch(() => ({})) as { comment?: string }
    const order = orderById(task.depositOrderId)
    if (order) {
      order.screening_result = 'pass'
      order.status           = 'successful'
      order.anomalous_reason = undefined
      order.credit_date      = new Date().toISOString()
      order.ops_handler      = ACTOR.name
      order.updated_at       = new Date().toISOString()
    }
    completeTask(task, 'TASK_SCREENING_APPROVED', body.comment || 'Compliance approved screening. Deposit credited.')
    return HttpResponse.json({ data: task })
  }),

  // POST /api/v1/tasks/:id/close-no-action — DEPOSIT_WEBHOOK_PARSE_FAILURE
  http.post('/api/v1/tasks/:id/close-no-action', async ({ params, request }) => {
    const task = taskById(params.id as string)
    if (!task) return HttpResponse.json({ error: { code: 'not_found', message: 'Task not found' } }, { status: 404 })
    const body = await request.json() as { reason: string }
    if (!body.reason?.trim()) {
      return HttpResponse.json({ error: { code: 'validation', message: 'A closing reason is required' } }, { status: 400 })
    }
    completeTask(task, 'TASK_CLOSED_NO_ACTION', `Closed — no action needed. Reason: ${body.reason}`)
    return HttpResponse.json({ data: task })
  }),
]
