// @ts-nocheck
import { CdsSpinner, CdsContextPanel } from '../../../components/cds'

export default function UikitMiscSection() {
  return (
    <section className="space-y-6">
      <h3 className="type-body font-semibold text-(--text)">Misc</h3>

      {/* Spinner */}
      <div className="space-y-3">
        <p className="type-body-sm font-medium text-(--muted)">Spinner</p>
        <div className="flex items-center gap-3">
          <CdsSpinner className="h-4 w-4 text-(--accent-text)" />
          <CdsSpinner className="h-5 w-5 text-(--muted)" />
          <CdsSpinner className="h-6 w-6 text-(--subtle)" />
        </div>
      </div>

      {/* Context Panel */}
      <div className="space-y-3">
        <p className="type-body-sm font-medium text-(--muted)">Context panel</p>
        <CdsContextPanel title="With title">
          <p>Body text goes here. Use this panel to display contextual information, specs, or guidance notes.</p>
        </CdsContextPanel>
        <CdsContextPanel>
          <p>Without title — just body content in a bordered container.</p>
        </CdsContextPanel>
      </div>
    </section>
  )
}
