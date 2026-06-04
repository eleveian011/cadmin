import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { DepositTask, DepositTaskListResponse } from '../../types/task'
import {
  listTasks, getTaskBadgeCount, getTask,
  claimTask, unclaimTask, completeTaskById, addTaskNote,
  confirmRecipient, retryTask, classifyTask, fillFields,
  rejectRefund, approveScreening, closeNoAction,
  getEligibleAssignees, reassignTask,
} from '../store'
import type { TaskListParams } from '../store'

export type { TaskListParams }

export function useTasks(params: TaskListParams = {}) {
  return useQuery<DepositTaskListResponse>({
    queryKey: ['tasks', params],
    queryFn:  () => listTasks(params),
    staleTime: 30_000,
  })
}

export function useTaskBadgeCount() {
  return useQuery<{ badgeCount: number; mineCount: number; fyiCount: number }>({
    queryKey: ['tasks', 'badge-count'],
    queryFn:  () => getTaskBadgeCount(),
    staleTime: 30_000,
    refetchInterval: 30_000,
  })
}

export function useTaskDetail(id: string | undefined) {
  return useQuery<DepositTask>({
    queryKey: ['tasks', id],
    queryFn:  () => getTask(id as string),
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
  return useMutation({ ...useTaskMutation('claim'), mutationFn: claimTask })
}

export function useUnclaimTask() {
  return useMutation({ ...useTaskMutation('unclaim'), mutationFn: unclaimTask })
}

export function useCompleteTask() {
  return useMutation({ ...useTaskMutation('complete'), mutationFn: completeTaskById })
}

export function useAddTaskNote() {
  return useMutation({ ...useTaskMutation('note'), mutationFn: addTaskNote })
}

/* ─── Type-specific resolution mutations ─────────────────────── */

// DEPOSIT_RECIPIENT_MATCHING — confirm a candidate recipient (or a manual-search pick)
export function useConfirmRecipient() {
  return useMutation({ ...useTaskMutation('confirm-recipient'), mutationFn: confirmRecipient })
}

// DEPOSIT_STATUS_EXCEPTION — retry after account status resolved
export function useRetryTask() {
  return useMutation({ ...useTaskMutation('retry'), mutationFn: retryTask })
}

// DEPOSIT_CLASSIFICATION — set 1st/3rd party
export function useClassifyTask() {
  return useMutation({ ...useTaskMutation('classify'), mutationFn: classifyTask })
}

// DEPOSIT_MISSING_FIELDS_FYI — fill missing fields
export function useFillFields() {
  return useMutation({ ...useTaskMutation('fill-fields'), mutationFn: fillFields })
}

// Reject → refund flow (recipient matching / screening review)
export function useRejectRefund() {
  return useMutation({ ...useTaskMutation('reject-refund'), mutationFn: rejectRefund })
}

// DEPOSIT_SCREENING_REVIEW — approve screening → credit
export function useApproveScreening() {
  return useMutation({ ...useTaskMutation('approve-screening'), mutationFn: approveScreening })
}

// DEPOSIT_WEBHOOK_PARSE_FAILURE — close with no action
export function useCloseNoAction() {
  return useMutation({ ...useTaskMutation('close-no-action'), mutationFn: closeNoAction })
}

export function useEligibleAssignees(taskId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['tasks', taskId, 'assignees'],
    queryFn:  () => getEligibleAssignees(taskId as string),
    enabled:  !!taskId && enabled,
    staleTime: 60_000,
  })
}

export function useReassignTask() {
  return useMutation({ ...useTaskMutation('reassign'), mutationFn: reassignTask })
}
