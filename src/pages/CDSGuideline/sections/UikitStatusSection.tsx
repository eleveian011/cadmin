// @ts-nocheck
import { Wallet } from 'lucide-react'
import { CdsStatusState, CdsCard, CdsButton } from '../../../components/cds'

export default function UikitStatusSection() {

  return (
    <section className="space-y-8">
      <h3 className="type-body font-semibold text-(--text)">Status States</h3>

      <div className="space-y-2">
        <p className="type-caption font-semibold text-(--muted)">CdsStatusState — empty</p>
        <CdsStatusState type="empty" />
      </div>

      <div className="space-y-2">
        <p className="type-caption font-semibold text-(--muted)">CdsStatusState — empty (custom icon + action)</p>
        <CdsStatusState
          type="empty"
          icon={<Wallet size={32} />}
          title="No accounts yet"
          description="Accounts will appear here once they are created or assigned."
          action={<CdsButton size="sm">Create Account</CdsButton>}
        />
      </div>

      <div className="space-y-2">
        <p className="type-caption font-semibold text-(--muted)">CdsStatusState — no-results</p>
        <CdsStatusState type="no-results" />
      </div>

      <div className="space-y-2">
        <p className="type-caption font-semibold text-(--muted)">CdsStatusState — error (with retry)</p>
        <CdsStatusState type="error" onRetry={() => {}} />
      </div>

      <div className="space-y-2">
        <p className="type-caption font-semibold text-(--muted)">CdsStatusState — timeout (with retry)</p>
        <CdsStatusState type="timeout" onRetry={() => {}} />
      </div>

      {/* CdsCard — Container with skeleton fallback */}
      <div className="space-y-2">
        <p className="type-caption font-semibold text-(--muted)">CdsCard — Skeleton (no children)</p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <CdsCard />
          <CdsCard />
          <CdsCard />
        </div>
      </div>

      <div className="space-y-2">
        <p className="type-caption font-semibold text-(--muted)">CdsCard — With content (clickable)</p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <CdsCard onClick={() => {}}>
            <span className="type-body-lg font-bold text-(--text)">Order Approval</span>
            <span className="type-body text-(--muted)">Deposit order submitted by Wang Wei</span>
            <div className="flex items-center justify-between">
              <span className="type-caption text-(--subtle)">Pending</span>
              <span className="type-caption text-(--subtle)">2h ago</span>
            </div>
          </CdsCard>
          <CdsCard onClick={() => {}}>
            <span className="type-body-lg font-bold text-(--text)">Request for Information</span>
            <span className="type-body text-(--muted)">Please provide source of funds documentation for the USD 120,000 payment.</span>
            <div className="flex items-center justify-between">
              <span className="type-caption text-(--subtle)">In Progress</span>
              <span className="type-caption text-(--subtle)">1d ago</span>
            </div>
          </CdsCard>
          <CdsCard>
            <span className="type-body-lg font-bold text-(--text)">Static Card</span>
            <span className="type-body text-(--muted)">No onClick — no hover effect, renders as a div.</span>
          </CdsCard>
        </div>
      </div>
      <div className="space-y-2">
        <p className="type-caption font-semibold text-(--muted)">CdsCard — Row variant (skeleton)</p>
        <div className="flex flex-col gap-3">
          <CdsCard variant="row" />
          <CdsCard variant="row" />
          <CdsCard variant="row" />
        </div>
      </div>

      <div className="space-y-2">
        <p className="type-caption font-semibold text-(--muted)">CdsCard — Row variant (with content)</p>
        <div className="flex flex-col gap-3">
          <CdsCard variant="row" onClick={() => {}}>
            <span className="type-body font-bold text-(--text) w-32 shrink-0">HSBC</span>
            <span className="type-body-sm text-(--muted)">Deposit</span>
            <span className="type-body-sm font-bold text-(--text) flex-1">GB22MIDL40514951234567</span>
            <span className="type-caption text-(--muted) shrink-0">USD / SWIFT</span>
          </CdsCard>
          <CdsCard variant="row">
            <span className="type-body font-bold text-(--text) w-32 shrink-0">Citibank</span>
            <span className="type-body-sm text-(--muted)">Both</span>
            <span className="type-body-sm font-bold text-(--text) flex-1">CITI021000089</span>
            <span className="type-caption text-(--muted) shrink-0">SGD / SWIFT</span>
          </CdsCard>
        </div>
      </div>
    </section>
  )
}
