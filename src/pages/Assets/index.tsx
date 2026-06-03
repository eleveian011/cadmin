import { CdsPageHeader, CdsButton, CdsMetricCard, CdsTable, CdsBadge } from '../../components/cds'
import type { CdsTableColumn, BadgeTone } from '../../components/cds'
import { Plus, ArrowDownToLine } from 'lucide-react'

const METRICS = [
  { label: 'Total Balance', value: '$1,284,500', badge: '+4.2%', badgeTone: 'success' as const, sub: 'vs last month' },
  { label: 'Available',     value: '$982,300',   sub: 'Ready to use' },
  { label: 'Pending',       value: '$48,200',    badge: '3 orders', badgeTone: 'warning' as const, sub: 'Awaiting settlement' },
  { label: 'Accounts',      value: 6,            sub: 'Across 3 currencies' },
]

interface AccountRow {
  id:       string
  account:  string
  currency: string
  balance:  string
  status:   'Active' | 'Pending' | 'Inactive'
  updated:  string
}

const STATUS_TONE: Record<AccountRow['status'], BadgeTone> = {
  Active:   'success',
  Pending:  'warning',
  Inactive: 'neutral',
}

const ROWS: AccountRow[] = [
  { id: '1', account: 'Operating — USD', currency: 'USD', balance: '$642,100', status: 'Active',   updated: '2026-06-02' },
  { id: '2', account: 'Reserve — USD',   currency: 'USD', balance: '$210,000', status: 'Active',   updated: '2026-06-01' },
  { id: '3', account: 'Operating — EUR', currency: 'EUR', balance: '€184,500', status: 'Active',   updated: '2026-06-02' },
  { id: '4', account: 'Payroll — GBP',   currency: 'GBP', balance: '£96,400',  status: 'Pending',  updated: '2026-05-30' },
  { id: '5', account: 'Treasury — USD',  currency: 'USD', balance: '$118,000', status: 'Active',   updated: '2026-05-29' },
  { id: '6', account: 'Legacy — EUR',    currency: 'EUR', balance: '€33,500',  status: 'Inactive', updated: '2026-04-12' },
]

const COLUMNS: CdsTableColumn<AccountRow>[] = [
  { key: 'account',  header: 'Account', width: '220px', frozen: 'left' },
  { key: 'currency', header: 'Currency', width: '100px' },
  {
    key: 'balance', header: 'Balance', width: '160px', align: 'right',
    render: (v) => <span className="tabular-nums font-medium">{v as string}</span>,
  },
  {
    key: 'status', header: 'Status', width: '120px',
    render: (v) => <CdsBadge tone={STATUS_TONE[v as AccountRow['status']] ?? 'neutral'}>{v as string}</CdsBadge>,
  },
  {
    key: 'updated', header: 'Last Updated', width: '140px',
    render: (v) => <span className="tabular-nums text-(--muted)">{v as string}</span>,
  },
]

export default function Assets() {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <CdsPageHeader
        title="Assets"
        subtitle="A static reference page — use it as a style anchor when building new pages."
        actions={
          <div className="flex items-center gap-2">
            <CdsButton variant="secondary" size="sm" icon={<ArrowDownToLine size={14} />}>Export</CdsButton>
            <CdsButton size="sm" icon={<Plus size={14} />}>New Account</CdsButton>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {METRICS.map(m => (
          <CdsMetricCard key={m.label} {...m} />
        ))}
      </div>

      <CdsTable columns={COLUMNS} data={ROWS} rowKey="id" />
    </div>
  )
}
