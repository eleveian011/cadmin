import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { CdsBreadcrumb, BreadcrumbItem } from './breadcrumb'

export interface CdsPageHeaderProps {
  breadcrumb?: BreadcrumbItem[]
  backHref?:   string
  title:       React.ReactNode
  subtitle?:   React.ReactNode
  actions?:    React.ReactNode
  children?:   React.ReactNode
  className?:  string
}

export function CdsPageHeader({
  breadcrumb,
  backHref,
  title,
  subtitle,
  actions,
  children,
  className = '',
}: CdsPageHeaderProps) {
  // Back link reads its label from the breadcrumb's parent (second-to-last item).
  const parentCrumb = breadcrumb && breadcrumb.length >= 2
    ? breadcrumb[breadcrumb.length - 2]
    : undefined

  return (
    <header className={className}>
      {breadcrumb && <CdsBreadcrumb items={breadcrumb} />}
      <div className="mt-10">
        {backHref && (
          <Link
            to={backHref}
            className="inline-flex items-center gap-1 mb-3 type-body-lg text-(--muted) hover:text-(--text) transition-colors"
          >
            <ArrowLeft size={16} />
            <span>{`Back to ${parentCrumb?.label ?? 'previous'}`}</span>
          </Link>
        )}
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="type-h2 md:type-h1 font-bold text-(--text) truncate md:whitespace-normal">{title}</h1>
            {subtitle && (
              typeof subtitle === 'string'
                ? <p className="type-body md:type-body-lg max-w-3xl text-(--muted)">{subtitle}</p>
                : <div className="type-body md:type-body-lg max-w-3xl text-(--muted)">{subtitle}</div>
            )}
          </div>
          {actions && (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          )}
        </div>
      </div>
      {children && <div className="mt-4 space-y-3">{children}</div>}
    </header>
  )
}
