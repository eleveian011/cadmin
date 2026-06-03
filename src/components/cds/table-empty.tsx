/** @deprecated Use CdsStatusState instead */
import React from 'react'
import { CdsStatusState, type CdsStatusStateType } from './status-state'

export type CdsTableEmptyType = 'empty' | 'no-results' | 'timeout' | 'error'

export interface CdsTableEmptyProps {
  type: CdsTableEmptyType
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}

/** @deprecated Use CdsStatusState instead */
export function CdsTableEmpty({ type, title, description, onRetry, className }: CdsTableEmptyProps) {
  return <CdsStatusState type={type as CdsStatusStateType} title={title} description={description} onRetry={onRetry} className={className} />
}
