import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../_client'
import type { DepositOrder } from '../../types/deposit-order'
import type { PaginatedResponse } from '../../types/api'

export interface DepositOrdersFilter {
  anomalous?: boolean
  channel?:   string   // comma-separated for multi-select
  status?:    string   // comma-separated for multi-select
  party?:     string   // comma-separated: 1st_party,3rd_party,unclassified
  reason?:    string   // comma-separated anomalous_reason values
  q?:         string
  page?:      number
  per_page?:  number
}

export function useDepositOrders(filter: DepositOrdersFilter = {}) {
  const params = new URLSearchParams()
  if (filter.anomalous)         params.set('anomalous', 'true')
  if (filter.channel)           params.set('channel', filter.channel)
  if (filter.status)            params.set('status', filter.status)
  if (filter.party)             params.set('party', filter.party)
  if (filter.reason)            params.set('reason', filter.reason)
  if (filter.q)                 params.set('q', filter.q)
  if (filter.page)              params.set('page', String(filter.page))
  if (filter.per_page)          params.set('per_page', String(filter.per_page))

  const qs = params.toString()
  const url = `/deposit-orders${qs ? `?${qs}` : ''}`

  return useQuery<PaginatedResponse<DepositOrder>>({
    queryKey: ['deposit-orders', filter],
    queryFn:  () => apiFetch(url),
  })
}

/* ─── Mutations ─────────────────────────────────────────────── */

function useDepositMutation() {
  const qc = useQueryClient()
  return {
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deposit-orders'] }),
  }
}

export function useAddDepositNote() {
  return useMutation({
    ...useDepositMutation(),
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      apiFetch<DepositOrder>(`/deposit-orders/${id}/note`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      }),
  })
}

export interface MarkRefundedPayload {
  id:                  string
  refund_order_number: string
  refund_date:         string
  refund_notes?:       string
}

export function useMarkDepositRefunded() {
  return useMutation({
    ...useDepositMutation(),
    mutationFn: ({ id, ...body }: MarkRefundedPayload) =>
      apiFetch<DepositOrder>(`/deposit-orders/${id}/mark-refunded`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  })
}
