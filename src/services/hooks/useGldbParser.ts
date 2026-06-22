import { useQuery } from '@tanstack/react-query'
import { lookupPayee } from '../store'
import type { PayeeLookupResult } from '../store'

export type { PayeeLookupResult }

/**
 * Payee lookup for the GLDB Webhook Parser (§6.2). Exact match of the webhook
 * account number against Channel Account Number (Internal). Disabled until an
 * account number is provided.
 */
export function usePayeeLookup(accountNo: string | null | undefined) {
  return useQuery<PayeeLookupResult>({
    queryKey: ['payee-lookup', accountNo],
    queryFn:  () => lookupPayee(accountNo as string),
    enabled:  !!accountNo,
    staleTime: 10_000,
  })
}
