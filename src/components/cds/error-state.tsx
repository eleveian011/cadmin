/** @deprecated Use CdsStatusState instead */
import type { ReactNode } from 'react'
import { CdsStatusState } from './status-state'

export interface CdsErrorStateProps {
  icon?: ReactNode
  title?: string
  message: string
  onRetry?: () => void
  className?: string
}

/** @deprecated Use CdsStatusState type="error" instead */
export function CdsErrorState({ icon, title, message, onRetry, className }: CdsErrorStateProps) {
  return <CdsStatusState type="error" icon={icon} title={title} description={message} onRetry={onRetry} className={className} />
}
