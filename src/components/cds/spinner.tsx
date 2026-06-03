export interface CdsSpinnerProps {
  className?: string
}

export function CdsSpinner({ className = '' }: CdsSpinnerProps) {
  return (
    <span
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
      aria-hidden="true"
    />
  )
}
