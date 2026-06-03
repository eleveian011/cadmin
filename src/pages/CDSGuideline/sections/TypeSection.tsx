// @ts-nocheck
import { Type } from 'lucide-react'

const TYPE_SCALE = [
  { cls: 'type-display-1', size: '64', lh: '80', ls: '-0.025em', sample: 'Design that scales', group: 'display' },
  { cls: 'type-display-2', size: '56', lh: '74', ls: '-0.025em', sample: 'Design that scales', group: 'display' },
  { cls: 'type-display-3', size: '40', lh: '58', ls: '-0.02em', sample: 'Design that scales', group: 'display' },
  { cls: 'type-h1', size: '34', lh: '48', ls: '-0.02em', sample: 'The quick brown fox' },
  { cls: 'type-h2', size: '28', lh: '40', ls: '-0.015em', sample: 'The quick brown fox' },
  { cls: 'type-h3', size: '24', lh: '32', ls: '-0.01em', sample: 'The quick brown fox' },
  { cls: 'type-h4', size: '22', lh: '32', ls: '-0.01em', sample: 'The quick brown fox' },
  { cls: 'type-h5', size: '18', lh: '28', ls: '—', sample: 'The quick brown fox' },
  { cls: 'type-body-lg', size: '16', lh: '24', ls: '—', sample: 'The quick brown fox jumps over the lazy dog' },
  { cls: 'type-body', size: '14', lh: '20', ls: '—', sample: 'The quick brown fox jumps over the lazy dog' },
  { cls: 'type-body-sm', size: '12', lh: '16', ls: '—', sample: 'The quick brown fox jumps over the lazy dog' },
  { cls: 'type-caption', size: '12', lh: '16', ls: '—', sample: 'Labels, metadata, and annotations' },
]

export default function TypeSection() {
  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-(--text)">
          <Type size={17} className="text-(--accent-text)" />
          <h2 className="type-h4 font-semibold">Typography</h2>
        </div>
        <p className="type-body text-(--muted)">A single type scale defines size and line-height. Weight and color are applied separately.</p>
      </div>

      <div className="flex flex-wrap gap-6 rounded-lg border border-(--border) bg-(--fill) px-4 py-3 type-body">
        <div>
          <span className="type-caption font-medium text-(--muted)">Typeface</span>
          <p className="mt-0.5 font-semibold text-(--text)">HarmonyOS Sans</p>
        </div>
        <div>
          <span className="type-caption font-medium text-(--muted)">Weights</span>
          <p className="mt-0.5 font-semibold text-(--text)">Regular 400 · Medium 500 · Bold 700</p>
        </div>
        <div>
          <span className="type-caption font-medium text-(--muted)">Weight note</span>
          <p className="mt-0.5 type-body-sm text-(--muted)">Type classes set size and line-height only — never weight.</p>
        </div>
      </div>

      {/* Type scale — stacked list */}
      <div className="space-y-0 divide-y divide-(--border) rounded-lg border border-(--border) overflow-hidden">
        {TYPE_SCALE.map((row, i) => {
          const isDisplay = row.group === 'display'
          const showDivider = i === 3
          return (
            <div key={row.cls}>
              {showDivider && (
                <div className="bg-(--fill) px-4 py-1.5 type-caption font-medium uppercase text-(--muted)">UI</div>
              )}
              <div className="flex items-baseline gap-4 px-4 py-3">
                <div className="w-36 shrink-0 space-y-0.5">
                  <code className="rounded bg-(--fill) px-1.5 py-0.5 type-caption font-bold text-(--accent-text)">{row.cls}</code>
                  <p className="type-caption text-(--muted)">{row.size}/{row.lh} {row.ls !== '—' ? row.ls : ''}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <span className={`${row.cls} font-normal text-(--text)`}>{row.sample}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="space-y-2">
        <p className="type-caption font-medium text-(--muted)">Weight demo</p>
        <div className="space-y-1.5 rounded-lg border border-(--border) px-4 py-3">
          {[['font-normal', '400'], ['font-medium', '500'], ['font-bold', '700']].map(([cls, w]) => (
            <div key={cls} className="flex items-baseline gap-4">
              <code className="w-28 shrink-0 rounded bg-(--fill) px-1.5 py-0.5 type-caption font-bold text-(--accent-text)">{cls}</code>
              <span className={`type-body ${cls} text-(--text)`}>The quick brown fox jumps over the lazy dog — {w}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <div>
          <h3 className="type-body font-semibold text-(--text)">Numerals</h3>
          <p className="mt-1 type-body-sm text-(--muted)">Use tabular numerals for figures that need to align vertically, such as tables and amounts.</p>
        </div>
        <div className="overflow-hidden rounded-lg border border-(--border)">
          <div className="grid grid-cols-2 gap-px bg-(--border)">
            <div className="bg-(--surface) px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="type-caption font-semibold uppercase text-(--subtle)">Default</span>
                <code className="type-caption font-bold text-(--muted)">—</code>
              </div>
              <div className="mt-2 space-y-0.5 type-body font-medium text-(--text)">
                <div>$ 1,111,111.11</div>
                <div>$ 9,888,777.66</div>
                <div>$ 4,520,030.05</div>
                <div>$&nbsp;&nbsp;&nbsp;&nbsp;67,283.40</div>
              </div>
            </div>
            <div className="bg-(--surface) px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="type-caption font-semibold uppercase text-(--accent-text)">Tabular</span>
                <code className="type-caption font-bold text-(--accent-text)">.tabular-nums</code>
              </div>
              <div className="mt-2 space-y-0.5 type-body font-medium tabular-nums text-(--text)">
                <div>$ 1,111,111.11</div>
                <div>$ 9,888,777.66</div>
                <div>$ 4,520,030.05</div>
                <div>$&nbsp;&nbsp;&nbsp;&nbsp;67,283.40</div>
              </div>
            </div>
          </div>
          <p className="border-t border-(--border) bg-(--fill) px-4 py-2 type-caption text-(--muted)">
            Tabular numerals keep every digit the same width so columns of figures line up.
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-(--border)">
          <div className="flex items-center justify-between bg-(--fill) px-4 py-2">
            <span className="type-caption font-semibold uppercase text-(--subtle)">Monospace</span>
            <code className="type-caption font-bold text-(--accent-text)">.font-bold</code>
          </div>
          <div className="space-y-2 px-4 py-3 text-(--text)">
            <div className="flex items-baseline gap-3">
              <span className="w-24 shrink-0 type-caption font-medium uppercase text-(--subtle)">API key</span>
              <code className="font-bold type-body-sm">pk_live_4xT9mK2vR8aD5pL3nQ7wX1yB6cZ</code>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="w-24 shrink-0 type-caption font-medium uppercase text-(--subtle)">TX ID</span>
              <code className="font-bold type-body-sm">txn_01HQ8FYWB3M2K6P9C7VRJX2NDA</code>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="w-24 shrink-0 type-caption font-medium uppercase text-(--subtle)">IBAN</span>
              <code className="font-bold type-body-sm">GB29 NWBK 6016 1331 9268 19</code>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="w-24 shrink-0 type-caption font-medium uppercase text-(--subtle)">Hash</span>
              <code className="font-bold type-body-sm">0x7f3a8c…b2e91d04</code>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="w-24 shrink-0 type-caption font-medium uppercase text-(--subtle)">Code</span>
              <code className="font-bold type-body-sm">curl -X POST /api/v1/payouts</code>
            </div>
          </div>
          <p className="border-t border-(--border) bg-(--fill) px-4 py-2 type-caption text-(--muted)">
            Use a monospace face for keys, IDs, hashes, and code so characters stay distinct.
          </p>
        </div>
      </div>
    </section>
  )
}
