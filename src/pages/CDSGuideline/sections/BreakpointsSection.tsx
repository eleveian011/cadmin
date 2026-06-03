// @ts-nocheck
import { Ruler } from 'lucide-react'
import { CdsTable } from '../../../components/cds'

const BREAKPOINTS = [
  { token: '--breakpoint-sm', prefix: 'sm:', minWidth: '640px', usage: 'Large phones, small tablets' },
  { token: '--breakpoint-md', prefix: 'md:', minWidth: '768px', usage: 'Tablets, primary mobile/desktop split' },
  { token: '--breakpoint-lg', prefix: 'lg:', minWidth: '1024px', usage: 'Laptops, small desktops' },
  { token: '--breakpoint-xl', prefix: 'xl:', minWidth: '1280px', usage: 'Desktops, sidebar layouts' },
  { token: '--breakpoint-2xl', prefix: '2xl:', minWidth: '1536px', usage: 'Large desktops, wide monitors' },
]

export default function BreakpointsSection() {
  const columns = [
    { key: 'token',    header: 'Token',     width: '160px', render: (v) => <code className="font-bold type-caption text-(--accent-text)">{v}</code> },
    { key: 'prefix',   header: 'Prefix',    width: '96px',  render: (v) => <code className="font-bold type-caption text-(--muted)">{v}</code> },
    { key: 'minWidth', header: 'Min width', width: '96px',  render: (v) => <span className="font-bold type-caption text-(--muted)">{v}</span> },
    { key: 'usage',    header: 'Usage',     render: (_, row) => <span className="text-(--muted)">{row.usage}</span> },
  ]

  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-(--text)">
          <Ruler size={17} className="text-(--accent-text)" />
          <h2 className="type-h4 font-semibold">Breakpoints</h2>
        </div>
        <p className="type-body text-(--muted)">Responsive breakpoints used across the design system. Apply them with Tailwind prefixes.</p>
      </div>
      <CdsTable columns={columns} data={BREAKPOINTS} rowKey="token" compact />
    </section>
  )
}
