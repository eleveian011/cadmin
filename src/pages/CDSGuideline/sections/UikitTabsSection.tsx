// @ts-nocheck
import { useState } from 'react'
import { ToggleLeft, Table2, Network, TrendingUp, Activity, Vault, BookUser, User } from 'lucide-react'
import { CdsTabs, CdsPillTabs, CdsSegmentTabs, CdsContextPanel } from '../../../components/cds'

export default function UikitTabsSection() {
  const [filter, setFilter] = useState('all')
  const [range, setRange] = useState('7d')
  const [page, setPage] = useState('assets')
  const [seg, setSeg] = useState('all')

  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-(--text)">
          <ToggleLeft size={17} className="text-(--accent-text)" />
          <h2 className="type-h4 font-semibold">Tabs</h2>
        </div>
        <p className="type-body text-(--muted)">
          Two tab styles: segmented (capsule) for inline filters, pill for page-level navigation.
        </p>
      </div>

      <div className="space-y-2">
        <p className="type-caption font-medium text-(--muted)">Segmented — inline filter</p>
        <CdsTabs
          value={filter}
          onChange={setFilter}
          items={[
            { value: 'all', label: 'All' },
            { value: 'fiat', label: 'Fiat' },
            { value: 'crypto', label: 'Crypto' },
          ]}
        />
        <p className="type-caption text-(--subtle)">Selected: <code className="font-bold text-(--accent-text)">{filter}</code></p>
      </div>

      <div className="space-y-2">
        <p className="type-caption font-medium text-(--muted)">Segmented — two options</p>
        <CdsTabs
          value={range}
          onChange={setRange}
          items={[
            { value: '7d', label: '7 Days' },
            { value: '30d', label: '30 Days' },
          ]}
        />
      </div>

      <div className="space-y-2">
        <p className="type-caption font-medium text-(--muted)">Pill — page-level navigation (with icon + count badge)</p>
        <div className="rounded-lg border border-(--border) bg-(--surface)">
          <div className="border-b border-(--border) px-4">
            <CdsPillTabs
              value={page}
              onChange={setPage}
              className="py-2.5"
              items={[
                { value: 'assets',       label: 'Assets',       icon: <TrendingUp size={15} /> },
                { value: 'transactions', label: 'Transactions', icon: <Activity size={15} />, count: 12 },
                { value: 'va',           label: 'Fund Services',icon: <Vault size={15} />,    count: 3  },
                { value: 'recipients',   label: 'Recipients',   icon: <BookUser size={15} />  },
                { value: 'profile',      label: 'Profile',      icon: <User size={15} />      },
              ]}
            />
          </div>
          <div className="px-4 py-3 type-body-sm text-(--muted)">
            Active tab: <code className="font-bold text-(--accent-text)">{page}</code>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="type-caption font-medium text-(--muted)">Segment — low-profile inline filter (gray, compact)</p>
        <CdsSegmentTabs
          value={seg}
          onChange={setSeg}
          items={[
            { value: 'all', label: 'All' },
            { value: '48h', label: '48h+' },
            { value: '24h', label: '24–48h' },
          ]}
        />
        <p className="type-caption text-(--subtle)">Selected: <code className="font-bold text-(--accent-text)">{seg}</code></p>
      </div>

      <CdsContextPanel title="Spec">
        <ul className="list-disc space-y-1 pl-4">
          <li><strong>CdsTabs (segmented)</strong>: capsule shape, shared border, accent fill on active</li>
          <li><strong>CdsPillTabs</strong>: individual pill buttons, accent-muted fill on active, supports icon + count badge</li>
          <li><strong>CdsSegmentTabs</strong>: low-profile gray segment, type-body-sm, self-sizing width (w-fit), no accent color</li>
          <li>Use CdsSegmentTabs for compact inline filters alongside dropdowns; CdsTabs for prominent filters; CdsPillTabs for page-level navigation</li>
          <li>Full-width divider below pill tabs comes from the parent container, not the component</li>
        </ul>
      </CdsContextPanel>
    </section>
  )
}
