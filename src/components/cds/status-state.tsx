import type { ReactNode } from 'react'
import { Inbox, SearchX, WifiOff, AlertCircle } from 'lucide-react'
import { CdsButton } from './button'

export type CdsStatusStateType = 'empty' | 'no-results' | 'error' | 'timeout'

export interface CdsStatusStateProps {
  type: CdsStatusStateType
  title?: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  onRetry?: () => void
  className?: string
}

const defaults: Record<CdsStatusStateType, { icon: ReactNode; title: string; description: string }> = {
  empty: {
    icon: <Inbox size={32} />,
    title: 'No data',
    description: 'There is nothing to display yet.',
  },
  'no-results': {
    icon: <SearchX size={32} />,
    title: 'No results found',
    description: 'Try adjusting your search or filters.',
  },
  error: {
    icon: <AlertCircle size={32} />,
    title: 'Something went wrong',
    description: 'An error occurred while loading data.',
  },
  timeout: {
    icon: <WifiOff size={32} />,
    title: 'Request timed out',
    description: 'The server took too long to respond.',
  },
}

export function CdsStatusState({ type, title, description, icon, action, onRetry, className = '' }: CdsStatusStateProps) {
  const d = defaults[type]
  const isError = type === 'error' || type === 'timeout'
  return (
    <div className={`flex flex-col items-center justify-center py-12 gap-3 ${className}`}>
      <span className={isError ? 'text-(--danger)' : 'text-(--muted)'}>{icon ?? d.icon}</span>
      <span className="type-body font-semibold text-(--text)">{title ?? d.title}</span>
      <span className="type-body-sm text-(--muted) text-center max-w-sm">{description ?? d.description}</span>
      {action && <div className="mt-2">{action}</div>}
      {!action && onRetry && (
        <CdsButton variant="primary" size="sm" onClick={onRetry} className="mt-2">Retry</CdsButton>
      )}
    </div>
  )
}
