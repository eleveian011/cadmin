/** @deprecated Use CdsStatusState instead */
import type { ReactNode } from 'react'
import { CdsStatusState } from './status-state'

export interface CdsEmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

/** @deprecated Use CdsStatusState type="empty" instead */
export function CdsEmptyState({ icon, title, description, action, className }: CdsEmptyStateProps) {
  return <CdsStatusState type="empty" icon={icon} title={title} description={description} action={action} className={className} />
}
