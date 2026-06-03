// @ts-nocheck
import { useState } from 'react'
import { CdsFilterPill, CdsMoreFilterPill, CdsFilterPanel, CdsContextPanel } from '../../../components/cds'

export default function UikitFilterPillSection() {
  const [status, setStatus] = useState(null)
  const [currency, setCurrency] = useState('USD')
  const [moreCount, setMoreCount] = useState(0)

  return (
    <section className="space-y-8">
      <h3 className="type-body font-semibold text-(--text)">
        Filter Pill
      </h3>

      <CdsContextPanel title="Specification">
        <ul className="list-disc space-y-1 pl-4">
          <li>Inactive state shows the filter title only.</li>
          <li>Active state shows the selected value with a clear button.</li>
          <li>Clicking the pill opens a dropdown panel with options.</li>
          <li>More Filters pill aggregates extra filters with an active count badge.</li>
        </ul>
      </CdsContextPanel>

      <div className="space-y-2">
        <p className="type-caption font-medium text-(--muted)">
          Inactive
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <CdsFilterPill title="Status" value={status} onClear={() => setStatus(null)}>
            <div className="space-y-1">
              {['Pending', 'Completed', 'Failed'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className="block w-full rounded-md px-3 py-1.5 text-left type-body text-(--text) hover:bg-(--item-hover)"
                >
                  {s}
                </button>
              ))}
            </div>
          </CdsFilterPill>
        </div>
      </div>

      <div className="space-y-2">
        <p className="type-caption font-medium text-(--muted)">
          Active
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <CdsFilterPill title="Currency" value={currency} onClear={() => setCurrency(null)}>
            <div className="space-y-1">
              {['USD', 'EUR', 'GBP', 'CNY'].map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className="block w-full rounded-md px-3 py-1.5 text-left type-body text-(--text) hover:bg-(--item-hover)"
                >
                  {c}
                </button>
              ))}
            </div>
          </CdsFilterPill>
        </div>
      </div>

      <div className="space-y-2">
        <p className="type-caption font-medium text-(--muted)">
          More Filters
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <CdsMoreFilterPill
            title="More Filters"
            activeCount={moreCount}
            onClear={() => setMoreCount(0)}
          >
            <div className="space-y-2">
              <p className="type-body-sm text-(--muted)">Toggle filters below</p>
              <button
                onClick={() => setMoreCount((c) => c + 1)}
                className="rounded-md px-3 py-1.5 type-body text-(--text) hover:bg-(--item-hover)"
              >
                Add filter (+1)
              </button>
            </div>
          </CdsMoreFilterPill>
        </div>
      </div>
      <div className="space-y-2">
        <p className="type-caption font-medium text-(--muted)">
          CdsFilterPanel — pills + summary line
        </p>
        <CdsFilterPanel
          active={!!status || currency !== null}
          count={42}
          countLabel="Results"
          onClear={() => { setStatus(null); setCurrency(null) }}
        >
          <CdsFilterPill title="Status" value={status} onClear={() => setStatus(null)}>
            <div className="space-y-1">
              {['Pending', 'Completed', 'Failed'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className="block w-full rounded-md px-3 py-1.5 text-left type-body text-(--text) hover:bg-(--item-hover)"
                >
                  {s}
                </button>
              ))}
            </div>
          </CdsFilterPill>
          <CdsFilterPill title="Currency" value={currency} onClear={() => setCurrency(null)}>
            <div className="space-y-1">
              {['USD', 'EUR', 'GBP', 'CNY'].map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className="block w-full rounded-md px-3 py-1.5 text-left type-body text-(--text) hover:bg-(--item-hover)"
                >
                  {c}
                </button>
              ))}
            </div>
          </CdsFilterPill>
        </CdsFilterPanel>
      </div>
    </section>
  )
}
