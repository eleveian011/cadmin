// @ts-nocheck
import { useState } from 'react'
import { CdsCheckbox, CdsRadio, CdsSwitch } from '../../../components/cds'

export default function UikitFormSection() {
  const [cb1, setCb1] = useState(false)
  const [cb2, setCb2] = useState(true)
  const [cb3, setCb3] = useState(false)
  const [radio, setRadio] = useState('a')
  const [sw1, setSw1] = useState(false)
  const [sw2, setSw2] = useState(true)
  const [sw3, setSw3] = useState(true)

  return (
    <section className="space-y-8">
      <h3 className="type-body font-semibold text-(--text)">Controls (Checkbox / Radio / Switch)</h3>

      {/* Checkbox */}
      <div className="space-y-3">
        <p className="type-body-sm font-medium text-(--muted)">Checkbox</p>
        <div className="flex flex-wrap items-start gap-6">
          <label className="flex items-center gap-2 type-body text-(--text) cursor-pointer">
            <CdsCheckbox checked={cb1} onChange={setCb1} />
            Unchecked
          </label>
          <label className="flex items-center gap-2 type-body text-(--text) cursor-pointer">
            <CdsCheckbox checked={cb2} onChange={setCb2} />
            Checked
          </label>
          <label className="flex items-center gap-2 type-body text-(--text) cursor-pointer">
            <CdsCheckbox indeterminate />
            Indeterminate
          </label>
          <label className="flex items-center gap-2 type-body text-(--muted)">
            <CdsCheckbox checked={cb3} onChange={setCb3} disabled />
            Disabled
          </label>
          <label className="flex items-center gap-2 type-body text-(--muted)">
            <CdsCheckbox checked disabled />
            Disabled checked
          </label>
        </div>
      </div>

      {/* Radio */}
      <div className="space-y-3">
        <p className="type-body-sm font-medium text-(--muted)">Radio</p>
        <div className="flex flex-wrap items-start gap-6">
          <label className="flex items-center gap-2 type-body text-(--text) cursor-pointer">
            <CdsRadio checked={radio === 'a'} onChange={() => setRadio('a')} />
            Option A
          </label>
          <label className="flex items-center gap-2 type-body text-(--text) cursor-pointer">
            <CdsRadio checked={radio === 'b'} onChange={() => setRadio('b')} />
            Option B
          </label>
          <label className="flex items-center gap-2 type-body text-(--text) cursor-pointer">
            <CdsRadio checked={radio === 'c'} onChange={() => setRadio('c')} />
            Option C
          </label>
          <label className="flex items-center gap-2 type-body text-(--muted)">
            <CdsRadio checked={false} disabled />
            Disabled
          </label>
          <label className="flex items-center gap-2 type-body text-(--muted)">
            <CdsRadio checked disabled />
            Disabled checked
          </label>
        </div>
      </div>

      {/* Switch */}
      <div className="space-y-3">
        <p className="type-body-sm font-medium text-(--muted)">Switch</p>
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 type-body text-(--text) cursor-pointer">
            <CdsSwitch checked={sw1} onChange={setSw1} />
            {sw1 ? 'On' : 'Off'}
          </label>
          <label className="flex items-center gap-2 type-body text-(--text) cursor-pointer">
            <CdsSwitch size="sm" checked={sw2} onChange={setSw2} />
            Small
          </label>
          <label className="flex items-center gap-2 type-body text-(--text) cursor-pointer">
            <CdsSwitch size="md" checked={sw3} onChange={setSw3} />
            Medium
          </label>
          <label className="flex items-center gap-2 type-body text-(--muted)">
            <CdsSwitch checked={false} disabled />
            Disabled
          </label>
          <label className="flex items-center gap-2 type-body text-(--muted)">
            <CdsSwitch checked disabled />
            Disabled on
          </label>
        </div>
      </div>
    </section>
  )
}
