import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ReconResult, ReconCycle } from '../../types/reconciliation'
import type { PaginatedResponse } from '../../types/api'
import { listReconResults, listReconCycles, resolveReconResult } from '../store'
import type { ReconResultsFilter, ResolveReconPayload } from '../store'

export type { ReconResultsFilter, ResolveReconPayload }

/** Reconciliation results list (§7.13.7) — filtered + paginated. */
export function useReconResults(filter: ReconResultsFilter = {}) {
  return useQuery<PaginatedResponse<ReconResult>>({
    queryKey: ['recon-results', filter],
    queryFn:  () => listReconResults(filter),
    staleTime: 30_000,
  })
}

/** Per-cycle batch summaries (Cycle Results tab). */
export function useReconCycles() {
  return useQuery<ReconCycle[]>({
    queryKey: ['recon-cycles'],
    queryFn:  () => listReconCycles(),
    staleTime: 30_000,
  })
}

/** Resolve a discrepancy with a required note + optional correction order. */
export function useResolveReconResult() {
  const qc = useQueryClient()
  return useMutation<ReconResult, Error, ResolveReconPayload>({
    mutationFn: resolveReconResult,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recon-results'] })
      qc.invalidateQueries({ queryKey: ['recon-cycles'] })
    },
  })
}
