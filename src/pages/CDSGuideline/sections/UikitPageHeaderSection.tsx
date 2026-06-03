// @ts-nocheck
import { CdsBreadcrumb, CdsPageHeader, CdsButton } from '../../../components/cds'

export default function UikitPageHeaderSection() {
  return (
    <section className="space-y-8">
      <h3 className="type-body font-semibold text-(--text)">Page Header</h3>

      {/* Breadcrumb standalone */}
      <div className="space-y-2">
        <p className="type-body-sm font-medium text-(--muted)">Breadcrumb</p>
        <CdsBreadcrumb items={[
          { to: '/organizations', label: 'Organizations' },
          { to: '/organizations/123', label: 'Alibaba Group' },
          { label: 'Wallets' },
        ]} />
      </div>

      {/* PageHeader basic */}
      <div className="space-y-2">
        <p className="type-body-sm font-medium text-(--muted)">Basic</p>
        <div className="rounded-lg border border-(--border) bg-(--fill) p-4">
          <CdsPageHeader
            breadcrumb={[{ to: '/settings', label: 'Settings' }, { label: 'API Keys' }]}
            title="API Keys"
            subtitle="Manage your API keys for programmatic access."
          />
        </div>
      </div>

      {/* PageHeader with actions */}
      <div className="space-y-2">
        <p className="type-body-sm font-medium text-(--muted)">With actions</p>
        <div className="rounded-lg border border-(--border) bg-(--fill) p-4">
          <CdsPageHeader
            breadcrumb={[{ to: '/organizations', label: 'Organizations' }, { label: 'Alibaba Group' }]}
            title="Alibaba Group"
            subtitle="Enterprise client since 2024."
            actions={
              <>
                <CdsButton variant="secondary" size="sm">Export</CdsButton>
                <CdsButton size="sm">New Wallet</CdsButton>
              </>
            }
          />
        </div>
      </div>

      {/* PageHeader with back link */}
      <div className="space-y-2">
        <p className="type-body-sm font-medium text-(--muted)">With back link</p>
        <div className="rounded-lg border border-(--border) bg-(--fill) p-4">
          <CdsPageHeader
            breadcrumb={[{ to: '/assets', label: 'Assets' }, { label: 'Currency Detail' }]}
            backHref="/assets"
            title="USD"
            subtitle="Back link reads its label from the breadcrumb's parent (second-to-last item)."
          />
        </div>
      </div>

      {/* PageHeader with children slot */}
      <div className="space-y-2">
        <p className="type-body-sm font-medium text-(--muted)">With children slot</p>
        <div className="rounded-lg border border-(--border) bg-(--fill) p-4">
          <CdsPageHeader
            title="Balance Overview"
            subtitle="Track your account balances across all currencies."
          >
            <div className="rounded-md border border-(--border) bg-(--surface) px-3 py-2 type-body-sm text-(--muted)">
              Children slot — use for filters, tabs, or summary cards below the header.
            </div>
          </CdsPageHeader>
        </div>
      </div>
    </section>
  )
}
