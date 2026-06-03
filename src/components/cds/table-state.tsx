import type { ReactNode } from 'react'
import { CdsTableSkeleton } from './table-skeleton'
import { CdsStatusState, type CdsStatusStateType } from './status-state'

export interface CdsTableStateProps {
  /** True when query is in initial loading (status === 'pending') */
  isLoading: boolean
  /** True when query is fetching (initial load, refetch, or error retry) */
  isFetching: boolean
  /** True when query is in error state */
  isError: boolean
  /** Called when user clicks the retry button */
  onRetry?: () => void
  /** Override the default skeleton (shown during loading / error retry) */
  loadingContent?: ReactNode
  /** Override the error type for the built-in CdsStatusState */
  errorType?: CdsStatusStateType
  /** Override the entire error content (replaces CdsStatusState) */
  errorContent?: ReactNode
  /** The data content — rendered when not loading and not in error */
  children: ReactNode
}

/**
 * CdsTableState — declarative state machine for table-async pages.
 *
 * States:
 *   isLoading || (isError && isFetching)  → skeleton / loadingContent
 *   isError && !isFetching                → error   / errorContent
 *   otherwise                             → children
 */
export function CdsTableState({
  isLoading,
  isFetching,
  isError,
  onRetry,
  loadingContent,
  errorType = 'error',
  errorContent,
  children,
}: CdsTableStateProps) {
  if (isLoading || (isError && isFetching)) {
    return <>{loadingContent ?? <CdsTableSkeleton />}</>
  }

  if (isError && !isFetching) {
    return <>{errorContent ?? <CdsStatusState type={errorType} onRetry={onRetry} />}</>
  }

  return <>{children}</>
}
