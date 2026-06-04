import { useQuery } from '@tanstack/react-query'
import type { ClientSearchResult } from '../../types/task'
import type { PaginatedResponse } from '../../types/api'
import { searchClients } from '../store'

/**
 * CAMP client directory search — backs the Task Center manual recipient search
 * fallback (PRD §7.7.3 item 3). Real-time, debounced by the caller; matches client
 * name (partial) and participant code (partial). Disabled until a query is entered.
 */
export function useClientSearch(query: string, opts: { limit?: number } = {}) {
  const q = query.trim()
  return useQuery<PaginatedResponse<ClientSearchResult>>({
    queryKey: ['clients', q, opts.limit ?? 20],
    queryFn:  () => searchClients(q, opts.limit ?? 20),
    enabled:  q.length > 0,
    staleTime: 30_000,
  })
}
