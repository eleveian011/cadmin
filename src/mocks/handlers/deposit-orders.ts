import { http, HttpResponse } from 'msw'
import { depositOrders } from '../seed/deposit-orders'
import type { PaginatedResponse, DepositOrder } from '../../types'

const ANOMALOUS_REASONS = ['unidentified', 'status_exception', 'classification', 'missing_fields', 'screening_review']
const PENDING_ANOMALOUS_STATUSES = ['processing.manual_review', 'pending.rfi_missing_fields']

// Mutable in-memory store so note / refund / task mutations persist in-session.
const orderStore: DepositOrder[] = depositOrders.map(d => ({ ...d }))

export function orderById(id: string): DepositOrder | undefined {
  return orderStore.find(d => d.id === id)
}

export const depositOrderHandlers = [
  // GET /api/v1/deposit-orders — full list, optional ?anomalous=true filter
  http.get('/api/v1/deposit-orders', ({ request }) => {
    const url = new URL(request.url)
    const anomalousOnly = url.searchParams.get('anomalous') === 'true'
    const channelParam  = url.searchParams.get('channel')
    const statusParam   = url.searchParams.get('status')
    const partyParam    = url.searchParams.get('party')
    const reasonParam   = url.searchParams.get('reason')
    const q             = url.searchParams.get('q')?.toLowerCase()
    const page          = parseInt(url.searchParams.get('page') ?? '1', 10)
    const perPage       = parseInt(url.searchParams.get('per_page') ?? '20', 10)

    const channels = channelParam ? channelParam.split(',') : []
    const statuses = statusParam  ? statusParam.split(',')  : []
    const parties  = partyParam   ? partyParam.split(',')   : []
    const reasons  = reasonParam  ? reasonParam.split(',')  : []

    let items = [...orderStore]

    if (anomalousOnly) {
      // PRD §7.11.2: only manual_review + rfi_missing_fields; sorted oldest first
      items = items.filter(d =>
        d.anomalous_reason &&
        ANOMALOUS_REASONS.includes(d.anomalous_reason) &&
        PENDING_ANOMALOUS_STATUSES.includes(d.status)
      )
      items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    }
    if (channels.length) items = items.filter(d => channels.includes(d.payment_channel))
    if (statuses.length) items = items.filter(d => statuses.includes(d.status))
    if (parties.length)  items = items.filter(d => parties.includes(d.party_classification))
    if (reasons.length)  items = items.filter(d => d.anomalous_reason && reasons.includes(d.anomalous_reason))
    if (q) {
      items = items.filter(d =>
        d.transaction_id.toLowerCase().includes(q) ||
        (d.sender_name ?? '').toLowerCase().includes(q) ||
        (d.beneficiary_name ?? '').toLowerCase().includes(q) ||
        (d.reference_code ?? '').toLowerCase().includes(q)
      )
    }

    const total = items.length
    const sliced = items.slice((page - 1) * perPage, page * perPage)

    const body: { data: PaginatedResponse<typeof items[0]> } = {
      data: { items: sliced, total, page, per_page: perPage },
    }
    return HttpResponse.json(body)
  }),

  // GET /api/v1/deposit-orders/:id
  http.get('/api/v1/deposit-orders/:id', ({ params }) => {
    const order = orderById(params.id as string)
    if (!order) {
      return HttpResponse.json({ error: { code: 'not_found', message: 'Order not found' } }, { status: 404 })
    }
    return HttpResponse.json({ data: order })
  }),

  // POST /api/v1/deposit-orders/:id/note — append an Ops note to remarks
  http.post('/api/v1/deposit-orders/:id/note', async ({ params, request }) => {
    const order = orderById(params.id as string)
    if (!order) return HttpResponse.json({ error: { code: 'not_found', message: 'Order not found' } }, { status: 404 })
    const body = await request.json() as { note: string }
    const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ')
    order.remarks = order.remarks
      ? `${order.remarks}\n[${stamp} Alex Chen] ${body.note}`
      : `[${stamp} Alex Chen] ${body.note}`
    order.ops_handler = 'Alex Chen'
    order.updated_at = new Date().toISOString()
    return HttpResponse.json({ data: order })
  }),

  // POST /api/v1/deposit-orders/:id/mark-refunded — manual refund marking (PRD §7.7.8)
  http.post('/api/v1/deposit-orders/:id/mark-refunded', async ({ params, request }) => {
    const order = orderById(params.id as string)
    if (!order) return HttpResponse.json({ error: { code: 'not_found', message: 'Order not found' } }, { status: 404 })

    // Guard: only unidentified + processing.manual_review may be marked refunded
    if (!(order.anomalous_reason === 'unidentified' && order.status === 'processing.manual_review')) {
      return HttpResponse.json({ error: { code: 'invalid_state', message: 'Order is not eligible for manual refund marking' } }, { status: 409 })
    }

    const body = await request.json() as { refund_order_number: string; refund_date: string; refund_notes?: string }
    const now = new Date().toISOString()
    order.status = 'refunded'
    order.refund_info = {
      refund_order_number: body.refund_order_number,
      refund_date:         body.refund_date,
      refund_notes:        body.refund_notes ?? null,
      marked_by:           'Alex Chen',
      marked_at:           now,
    }
    order.ops_handler = 'Alex Chen'
    order.updated_at  = now
    return HttpResponse.json({ data: order })
  }),
]
