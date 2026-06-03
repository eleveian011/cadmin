// @ts-nocheck
import { useState } from 'react'
import { CdsTable, CdsPagination, CdsTableSkeleton, CdsTableState, CdsRadio } from '../../../components/cds'

const SAMPLE_DATA = [
  { id: '1', name: 'Apex Holdings',     country: 'Hong Kong',   industry: 'Asset Management',   status: 'active',     balance: '$2,847,500',  txCount: 48,  vaCount: 4, rm: 'Sarah Chen',  joinedAt: '2023-08-14' },
  { id: '2', name: 'Meridian Capital',  country: 'Singapore',   industry: 'Investment Fund',    status: 'active',     balance: '$8,920,000',  txCount: 136, vaCount: 6, rm: 'James Liu',   joinedAt: '2022-11-20' },
  { id: '3', name: 'BlueStar Payments', country: 'UK',          industry: 'Payment Services',   status: 'active',     balance: '$1,380,000',  txCount: 72,  vaCount: 3, rm: 'Sarah Chen',  joinedAt: '2023-03-05' },
  { id: '4', name: 'NovaTech Corp',     country: 'US',          industry: 'Technology',         status: 'onboarding', balance: '$267,000',    txCount: 22,  vaCount: 1, rm: 'Mike Tan',    joinedAt: '2026-01-15' },
  { id: '5', name: 'Solaris Ventures',  country: 'Germany',     industry: 'Venture Capital',    status: 'active',     balance: '$3,210,000',  txCount: 61,  vaCount: 5, rm: 'James Liu',   joinedAt: '2023-06-17' },
  { id: '6', name: 'Crestview Partners',country: 'Switzerland', industry: 'Private Equity',     status: 'active',     balance: '$12,400,000', txCount: 210, vaCount: 8, rm: 'Sarah Chen',  joinedAt: '2022-05-10' },
  { id: '7', name: 'Orion Financial',   country: 'Australia',   industry: 'Financial Services', status: 'active',     balance: '$478,000',    txCount: 34,  vaCount: 2, rm: 'Mike Tan',    joinedAt: '2024-02-28' },
  { id: '8', name: 'Zenith Trading',    country: 'Singapore',   industry: 'Trading',            status: 'restricted', balance: '$118,000',    txCount: 11,  vaCount: 1, rm: 'James Liu',   joinedAt: '2024-07-22' },
]

const STATUS_COLORS = {
  active:     'text-(--success)',
  onboarding: 'text-(--warning)',
  restricted: 'text-(--danger)',
}

const TREE_DATA = [
  {
    id: 'open-t1', name: 'Open Term T+1', apr: '2.50%', term: 'Flexible (T+1)',
    children: [
      { id: 'open-t1-usd',  name: 'USD',  apr: '2.50%', term: 'Flexible (T+1)' },
      { id: 'open-t1-usdt', name: 'USDT', apr: '2.50%', term: 'Flexible (T+1)' },
    ],
  },
  {
    id: 'fixed-30', name: '30 Days', apr: '5.00%', term: '30 Days',
    children: [
      { id: 'fixed-30-usd', name: 'USD', apr: '5.00%', term: '30 Days' },
      { id: 'fixed-30-btc', name: 'BTC', apr: '0.50%', term: '30 Days' },
    ],
  },
]

export default function UikitTableSection() {
  const [selectedKeys, setSelectedKeys] = useState(new Set())

  const columns = [
    { key: 'name',     header: 'Name',     width: '180px', frozen: 'left' },
    { key: 'country',  header: 'Country',  width: '120px' },
    { key: 'industry', header: 'Industry', width: '160px' },
    {
      key: 'status', header: 'Status', width: '100px',
      render: (v) => <span className={`font-medium capitalize ${STATUS_COLORS[v] ?? ''}`}>{v}</span>,
    },
    {
      key: 'balance', header: 'Balance', width: '140px', align: 'right',
      render: (v) => <span className="tabular-nums font-medium">{v}</span>,
    },
    {
      key: 'txCount', header: 'Transactions', width: '110px', align: 'right',
      render: (v) => <span className="tabular-nums">{v}</span>,
    },
    {
      key: 'vaCount', header: 'VAs', width: '60px', align: 'right',
      render: (v) => <span className="tabular-nums">{v}</span>,
    },
    { key: 'rm',       header: 'RM',       width: '120px' },
    { key: 'joinedAt', header: 'Joined',   width: '100px', render: (v) => <span className="tabular-nums text-(--muted)">{v}</span> },
  ]

  return (
    <section className="space-y-6">
      <div>
        <h3 className="type-body font-semibold text-(--text)">Table</h3>
        <p className="mt-1 type-body-sm text-(--muted)">
          Data table with hover, horizontal scroll, frozen columns, column toggle, and checkbox selection.
        </p>
      </div>

      {/* Basic — many columns to trigger scroll */}
      <div className="space-y-2">
        <p className="type-caption font-medium text-(--muted)">Basic (scroll horizontally →)</p>
        <CdsTable
          columns={columns.map(c => ({ ...c, frozen: undefined }))}
          data={SAMPLE_DATA}
          rowKey="id"
        />
      </div>

      {/* With selection + frozen */}
      <div className="space-y-2">
        <p className="type-caption font-medium text-(--muted)">Selectable + frozen left column</p>
        <CdsTable
          columns={columns}
          data={SAMPLE_DATA}
          rowKey="id"
          selectable
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
        />
        {selectedKeys.size > 0 && (
          <p className="type-caption text-(--accent-text)">{selectedKeys.size} row(s) selected</p>
        )}
      </div>

      {/* Column toggle */}
      <div className="space-y-2">
        <p className="type-caption font-medium text-(--muted)">Column toggle</p>
        <CdsTable
          columns={columns.map(c => ({ ...c, frozen: undefined }))}
          data={SAMPLE_DATA}
          rowKey="id"
          columnToggle
        />
      </div>

      {/* Compact + striped */}
      <div className="space-y-2">
        <p className="type-caption font-medium text-(--muted)">Compact + striped</p>
        <CdsTable
          columns={columns.map(c => ({ ...c, frozen: undefined }))}
          data={SAMPLE_DATA}
          rowKey="id"
          compact
          striped
        />
      </div>

      {/* Empty state */}
      <div className="space-y-2">
        <p className="type-caption font-medium text-(--muted)">Empty state</p>
        <CdsTable
          columns={columns.map(c => ({ ...c, frozen: undefined }))}
          data={[]}
          rowKey="id"
          emptyText="No clients found"
        />
      </div>

      {/* Expandable tree (2 levels, leaf expander hidden) */}
      <div className="space-y-2">
        <p className="type-caption font-medium text-(--muted)">
          Expandable tree — <code className="type-caption">hideLeafExpander</code> drops the faded chevron on leaf rows when depth is fixed
        </p>
        <CdsTable
          columns={[
            { key: 'name',    header: 'Product Type', width: '240px' },
            { key: 'apr',     header: 'Est. APR', width: '120px', render: (v) => <span className="font-bold text-(--success-text)">{v}</span> },
            { key: 'term',    header: 'Term' },
          ]}
          data={TREE_DATA}
          rowKey="id"
          getChildren={(row) => row.children ?? []}
          isExpandable={(row) => !!row.children}
          hideLeafExpander
        />
      </div>

      {/* Fixed layout — content wraps instead of horizontal scroll */}
      <div className="space-y-2">
        <p className="type-caption font-medium text-(--muted)">
          <code className="type-caption">layout="fixed"</code> — columns honour their width and long cell content wraps (reference / label-value tables) instead of overflowing into horizontal scroll
        </p>
        <CdsTable
          columns={[
            { key: 'term', header: 'Key Terms', width: '220px' },
            { key: 'desc', header: 'Description' },
          ]}
          data={[
            { term: 'Security Structure', desc: 'The Notes are collateralized by the cash deposits held in segregated and secured bank accounts, granting noteholders a first-priority claim. The collateralized assets are subject to strict governance and oversight.' },
            { term: 'Limited Recourse', desc: "Subscribers' recourse shall be limited to the Underlying Portfolio. Upon the exhaustion of the Underlying Portfolio, all liabilities and obligations of the issuer shall be extinguished." },
          ]}
          rowKey="term"
          layout="fixed"
        />
      </div>


      {/* CdsPagination */}
      <div className="space-y-2">
        <p className="type-caption font-medium text-(--muted)">CdsPagination</p>
        <CdsPagination page={3} totalPages={8} onChange={() => {}} pageSize={20} onPageSizeChange={() => {}} />
      </div>

      <div className="space-y-2">
        <p className="type-caption font-medium text-(--muted)">CdsTableSkeleton</p>
        <CdsTableSkeleton rows={4} />
      </div>

      {/* CdsTableState — interactive state switching */}
      <div className="space-y-3">
        <p className="type-caption font-medium text-(--muted)">CdsTableState</p>
        <p className="type-body-sm text-(--muted)">
          Declarative state machine for table pages. Handles loading, error, retry-in-progress,
          and ready states so pages don&apos;t repeat the same conditional rendering.
        </p>
        <CdsTableStateDemo />
      </div>
    </section>
  )
}

type DemoState = 'loading' | 'error' | 'retrying' | 'data' | 'data-refetch'

function CdsTableStateDemo() {
  const [demoState, setDemoState] = useState<DemoState>('loading')

  const stateConfig: Record<DemoState, { isLoading: boolean; isFetching: boolean; isError: boolean }> = {
    'loading':       { isLoading: true,  isFetching: true,  isError: false },
    'error':         { isLoading: false, isFetching: false, isError: true },
    'retrying':      { isLoading: false, isFetching: true,  isError: true },
    'data':          { isLoading: false, isFetching: false, isError: false },
    'data-refetch':  { isLoading: false, isFetching: true,  isError: false },
  }

  const { isLoading, isFetching, isError } = stateConfig[demoState]

  const columns = [
    { key: 'name', header: 'Name', width: '180px', frozen: 'left' },
    { key: 'country', header: 'Country', width: '120px' },
    { key: 'balance', header: 'Balance', width: '140px', align: 'right' },
    { key: 'status', header: 'Status', width: '100px' },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* State switcher */}
      <div className="flex flex-wrap gap-3">
        {(['loading', 'error', 'retrying', 'data', 'data-refetch'] as DemoState[]).map(s => (
          <label key={s} className="flex items-center gap-2 type-body-sm text-(--text) cursor-pointer">
            <CdsRadio checked={demoState === s} onChange={() => setDemoState(s)} />
            {s}
          </label>
        ))}
      </div>

      <div className="rounded-lg border border-(--border) p-4">
        <CdsTableState
          isLoading={isLoading}
          isFetching={isFetching}
          isError={isError}
          onRetry={() => { /* noop */ }}
        >
          <CdsTable
            columns={columns as any}
            data={SAMPLE_DATA.slice(0, 5)}
            rowKey="id"
          />
        </CdsTableState>
      </div>
    </div>
  )
}
