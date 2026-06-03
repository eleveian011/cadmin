// @ts-nocheck
import { useState } from 'react'
import { CdsEntityPicker, CdsContextPanel } from '../../../components/cds'

const ENTITY_OPTIONS = [
  { value: 'alibaba', name: 'Alibaba Group', sublabel: 'PTE-ALIBABA-00' },
  { value: 'taobao', name: 'Taobao Marketplace', sublabel: 'PTE-TAOBAO-01' },
  { value: 'tmall', name: 'Tmall Global', sublabel: 'PTE-TMALL-02' },
  { value: 'alipay', name: 'Alipay Services', sublabel: 'PTE-ALIPAY-03' },
  { value: 'cainiao', name: 'Cainiao Logistics', sublabel: 'PTE-CAINIAO-04' },
  { value: 'lazada', name: 'Lazada Southeast Asia', sublabel: 'PTE-LAZADA-05' },
]

export default function UikitEntityPickerSection() {
  const [value, setValue] = useState(ENTITY_OPTIONS[0].value)

  const selected = ENTITY_OPTIONS.find((o) => o.value === value)

  return (
    <section className="space-y-5">
      <h3 className="type-body font-semibold text-(--text)">Entity Picker</h3>

      <CdsContextPanel title="Specification">
        <ul className="list-disc space-y-1 pl-4">
          <li>Trigger button shows the selected entity name with a chevron.</li>
          <li>Dropdown lists all entities with name and sublabel.</li>
          <li>Built-in search filters the list as you type.</li>
          <li>Load more reveals additional entities beyond the first page.</li>
          <li>Presentational only — selection state is controlled by the parent.</li>
          <li>High z-index keeps the dropdown above page content.</li>
        </ul>
      </CdsContextPanel>

      <div className="space-y-2">
        <p className="type-caption font-medium text-(--muted)">Basic</p>
        <CdsEntityPicker
          value={value}
          label="Entity"
          selectedName={selected?.name ?? null}
          options={ENTITY_OPTIONS}
          onSelect={setValue}
          searchPlaceholder="Search entities…"
          emptyText="No entities found"
        />
      </div>
    </section>
  )
}
