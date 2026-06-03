// @ts-nocheck
import { CdsDetailList, CdsDetailRow, CdsBadge } from '../../../components/cds'

export default function UikitDetailListSection() {
  return (
    <section className="space-y-6">
      <h3 className="type-body font-semibold text-(--text)">Detail List</h3>
      <p className="type-body-sm text-(--muted) max-w-prose">Key-value rows for displaying record details, with optional copy, link, and badge support.</p>

      {/* Default — bordered list with mixed row variants */}
      <div className="space-y-2">
        <p className="type-caption font-semibold text-(--muted)">Basic</p>
        <CdsDetailList>
          <CdsDetailRow label="Order ID" value="DP-7H3J9K2L" copyText="DP-7H3J9K2L" />
          <CdsDetailRow
            label="Sender Name"
            value="Acme Trading Co."
            badge={<CdsBadge tone="success" soft>1st Party</CdsBadge>}
            copyText="Acme Trading Co."
          />
          <CdsDetailRow label="Account Type" value="Fiat Wallet" />
          <CdsDetailRow
            label="Tx Hash"
            value="0xabc123def4567890abcdef1234567890abcdef1234567890abcdef1234567890"
            href="https://etherscan.io/tx/0xabc123"
            truncated
          />
          <CdsDetailRow label="Network" value="Ethereum" />
        </CdsDetailList>
      </div>

      {/* Read-only — no copy, no link */}
      <div className="space-y-2">
        <p className="type-caption font-semibold text-(--muted)">Read-only</p>
        <CdsDetailList>
          <CdsDetailRow label="Fee" value="1.50 USD" />
          <CdsDetailRow label="Commission" value="0.50 USD" />
          <CdsDetailRow label="Final Receive" value="998.00 USD" />
        </CdsDetailList>
      </div>

      {/* Borderless — for nesting inside other containers */}
      <div className="space-y-2">
        <p className="type-caption font-semibold text-(--muted)">Borderless</p>
        <CdsDetailList bordered={false}>
          <CdsDetailRow label="Reference" value="REF-9KL3MN" copyText="REF-9KL3MN" />
          <CdsDetailRow label="Created" value="2026-05-29 10:42:18" />
        </CdsDetailList>
      </div>
    </section>
  )
}
