import { ChevronRight, Home } from 'lucide-react'
import { Link } from 'react-router-dom'

export interface BreadcrumbItem {
  label: string
  to?:   string
}

export interface CdsBreadcrumbProps {
  items?: BreadcrumbItem[]
}

export function CdsBreadcrumb({ items = [] }: CdsBreadcrumbProps) {
  return (
    <nav className="inline-flex items-center gap-1 type-body-sm text-(--muted)" aria-label="Breadcrumb">
      <Link to="/assets" className="inline-flex items-center gap-1 text-(--muted) hover:text-(--text)">
        <Home size={12} />
        <span>Home</span>
      </Link>
      {items.map((item, idx) => (
        <span key={`${item.label}-${idx}`} className="inline-flex items-center gap-1">
          <ChevronRight size={12} className="text-(--subtle)" />
          {item.to
            ? <Link to={item.to} className="text-(--muted) hover:text-(--text)">{item.label}</Link>
            : <span className="font-medium text-(--text)">{item.label}</span>}
        </span>
      ))}
    </nav>
  )
}
