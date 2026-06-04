import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { DepositOrder } from '../../types/deposit-order'
import type { PaginatedResponse } from '../../types/api'
import {
  listDepositOrders, getDepositOrder, markDepositRefunded,
} from '../store'
import type { DepositOrdersFilter, MarkRefundedPayload } from '../store'

export type { DepositOrdersFilter, MarkRefundedPayload }

export function useDepositOrders(filter: DepositOrdersFilter = {}) {
  return useQuery<PaginatedResponse<DepositOrder>>({
    queryKey: ['deposit-orders', filter],
    queryFn:  () => listDepositOrders(filter),
  })
}

/**
 * Single deposit-order fetch — used by the Task Center drawer to surface full
 * transaction details (sender, value date, reference code) for an Ops decision.
 * Disabled for tasks with no linked order (e.g. webhook parse failures).
 */
export function useDepositOrder(id: string | undefined | null) {
  return useQuery<DepositOrder>({
    queryKey: ['deposit-order', id],
    queryFn:  () => getDepositOrder(id as string),
    enabled:  !!id,
    staleTime: 30_000,
  })
}

/* ─── Mutations ─────────────────────────────────────────────── */

function useDepositMutation() {
  const qc = useQueryClient()
  return {
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deposit-orders'] })
      qc.invalidateQueries({ queryKey: ['deposit-order'] })
    },
  }
}

export function useMarkDepositRefunded() {
  return useMutation({
    ...useDepositMutation(),
    mutationFn: markDepositRefunded,
  })
}
