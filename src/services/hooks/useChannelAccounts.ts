import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ChannelAccount, BulkUploadResult } from '../../types/channel-account'
import type { PaginatedResponse } from '../../types/api'
import {
  listChannelAccounts, getChannelAccount,
  createChannelAccount, updateChannelAccount, setMappingStatus,
  deleteChannelAccount, bulkUploadChannelAccounts,
} from '../store'
import type {
  ChannelAccountsFilter, CreateChannelAccountPayload,
  UpdateChannelAccountPayload, BulkUploadPayload,
} from '../store'

export type {
  ChannelAccountsFilter, CreateChannelAccountPayload,
  UpdateChannelAccountPayload, BulkUploadPayload,
}

export function useChannelAccounts(filter: ChannelAccountsFilter = {}) {
  return useQuery<PaginatedResponse<ChannelAccount>>({
    queryKey: ['channel-accounts', filter],
    queryFn:  () => listChannelAccounts(filter),
    staleTime: 30_000,
  })
}

export function useChannelAccount(id: string | undefined | null) {
  return useQuery<ChannelAccount>({
    queryKey: ['channel-account', id],
    queryFn:  () => getChannelAccount(id as string),
    enabled:  !!id,
    staleTime: 30_000,
  })
}

/* ─── Mutations ─────────────────────────────────────────────── */

function useChannelAccountMutation() {
  const qc = useQueryClient()
  return {
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['channel-accounts'] })
      qc.invalidateQueries({ queryKey: ['channel-account'] })
    },
  }
}

export function useCreateChannelAccount() {
  return useMutation({ ...useChannelAccountMutation(), mutationFn: createChannelAccount })
}

export function useUpdateChannelAccount() {
  return useMutation({ ...useChannelAccountMutation(), mutationFn: updateChannelAccount })
}

export function useSetMappingStatus() {
  return useMutation({ ...useChannelAccountMutation(), mutationFn: setMappingStatus })
}

export function useDeleteChannelAccount() {
  return useMutation({ ...useChannelAccountMutation(), mutationFn: deleteChannelAccount })
}

/** Bulk upload (GLDB only) — uploads the file; resolves with the backend's result report. */
export function useBulkUploadChannelAccounts() {
  return useMutation<BulkUploadResult, Error, BulkUploadPayload>({
    ...useChannelAccountMutation(),
    mutationFn: bulkUploadChannelAccounts,
  })
}
