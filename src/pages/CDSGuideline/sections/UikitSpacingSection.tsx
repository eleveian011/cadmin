// @ts-nocheck

const SPACING = [4, 8, 12, 16, 24, 32, 40]

export default function UikitSpacingSection() {
  return (
    <section className="space-y-3">
      <h3 className="type-body font-semibold text-(--text)">Spacing</h3>
      <div className="flex flex-wrap items-end gap-4">
        {SPACING.map((s) => (
          <div key={s} className="flex flex-col items-center gap-2">
            <div className="rounded border border-(--border) bg-(--accent-subtle)" style={{ width: s, height: s }} />
            <span className="type-caption text-(--muted)">{s}px</span>
          </div>
        ))}
      </div>
    </section>
  )
}
