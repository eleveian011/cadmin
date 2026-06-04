import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../_client'
import type { DepositTask, DepositTaskListResponse } from '../../types/task'

export interface TaskListParams {
  view?:   'active' | 'completed' | 'mine'
  type?:   string
  q?:      string
  page?:   number
  limit?:  number
}

export function useTasks(params: TaskListParams = {}) {
  const p = new URLSearchParams()
  if (params.view)            p.set('view',  params.view)
  if (params.type)            p.set('type',  params.type)
  if (params.q)               p.set('q',     params.q)
  if (params.page)            p.set('page',  String(params.page))
  if (params.limit)           p.set('limit', String(params.limit))
  const qs = p.toString()

  return useQuery<DepositTaskListResponse>({
    queryKey: ['tasks', params],
    queryFn:  () => apiFetch(`/tasks${qs ? `?${qs}` : ''}`),
    staleTime: 30_000,
  })
}

export function useTaskBadgeCount() {
  return useQuery<{ count: number }>({
    queryKey: ['tasks', 'badge-count'],
    queryFn:  () => apiFetch('/tasks/badge-count'),
    staleTime: 30_000,
    refetchInterval: 30_000,
  })
}

export function useTaskDetail(id: string | undefined) {
  return useQuery<DepositTask>({
    queryKey: ['tasks', id],
    queryFn:  () => apiFetch(`/tasks/${id}`),
    enabled:  !!id,
    staleTime: 30_000,
  })
}

function useTaskMutation(action: string) {
  const qc = useQueryClient()
  return {
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['deposit-orders'] })
    },
    mutationKey: ['tasks', action] as const,
  }
}

export function useClaimTask() {
  return useMutation({
    ...useTaskMutation('claim'),
    mutationFn: (id: string) => apiFetch<DepositTask>(`/tasks/${id}/claim`, { method: 'POST' }),
  })
}

export function useUnclaimTask() {
  return useMutation({
    ...useTaskMutation('unclaim'),
    mutationFn: (id: string) => apiFetch<DepositTask>(`/tasks/${id}/unclaim`, { method: 'POST' }),
  })
}

export function useCompleteTask() {
  return useMutation({
    ...useTaskMutation('complete'),
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      apiFetch<DepositTask>(`/tasks/${id}/complete`, {
        method: 'POST',
        body: JSON.stringify({ comment }),
      }),
  })
}

export function useAddTaskNote() {
  return useMutation({
    ...useTaskMutation('note'),
    mutationFn: ({ id, comment }: { id: string; comment: string }) =>
      apiFetch<DepositTask>(`/tasks/${id}/note`, {
        method: 'POST',
        body: JSON.stringify({ comment }),
      }),
  })
}

/* ─── Type-specific resolution mutations ─────────────────────── */

// DEPOSIT_RECIPIENT_MATCHING — confirm a candidate recipient
export function useConfirmRecipient() {
  return useMutation({
    ...useTaskMutation('confirm-recipient'),
    mutationFn: ({ id, participant_code, client_name, account_number }:
      { id: string; participant_code: string; client_name: string; account_number: string }) =>
      apiFetch<DepositTask>(`/tasks/${id}/confirm-recipient`, {
        method: 'POST',
        body: JSON.stringify({ participant_code, client_name, account_number }),
      }),
  })
}

// DEPOSIT_STATUS_EXCEPTION — retry after account status resolved
export function useRetryTask() {
  return useMutation({
    ...useTaskMutation('retry'),
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      apiFetch<DepositTask>(`/tasks/${id}/retry`, {
        method: 'POST',
        body: JSON.stringify({ comment }),
      }),
  })
}

// DEPOSIT_CLASSIFICATION — set 1st/3rd party
export function useClassifyTask() {
  return useMutation({
    ...useTaskMutation('classify'),
    mutationFn: ({ id, classification }: { id: string; classification: '1st_party' | '3rd_party' }) =>
      apiFetch<DepositTask>(`/tasks/${id}/classify`, {
        method: 'POST',
        body: JSON.stringify({ classification }),
      }),
  })
}

// DEPOSIT_MISSING_FIELDS_FYI — fill missing fields
export function useFillFields() {
  return useMutation({
    ...useTaskMutation('fill-fields'),
    mutationFn: ({ id, fields }: { id: string; fields: Record<string, string> }) =>
      apiFetch<DepositTask>(`/tasks/${id}/fill-fields`, {
        method: 'POST',
        body: JSON.stringify({ fields }),
      }),
  })
}

// Reject → refund flow (recipient matching / screening review)
export function useRejectRefund() {
  return useMutation({
    ...useTaskMutation('reject-refund'),
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiFetch<DepositTask>(`/tasks/${id}/reject-refund`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
  })
}

// DEPOSIT_SCREENING_REVIEW — approve screening → credit
export function useApproveScreening() {
  return useMutation({
    ...useTaskMutation('approve-screening'),
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      apiFetch<DepositTask>(`/tasks/${id}/approve-screening`, {
        method: 'POST',
        body: JSON.stringify({ comment }),
      }),
  })
}

// DEPOSIT_WEBHOOK_PARSE_FAILURE — close with no action
export function useCloseNoAction() {
  return useMutation({
    ...useTaskMutation('close-no-action'),
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiFetch<DepositTask>(`/tasks/${id}/close-no-action`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
  })
}
