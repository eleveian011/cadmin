// @ts-nocheck
import { useState } from 'react'
import { CdsButton, CdsDrawer, CdsDrawerLeft } from '../../../components/cds'

export default function UikitDrawerSection() {
  const [rightOpen, setRightOpen] = useState(false)
  const [leftOpen, setLeftOpen] = useState(false)

  return (
    <section className="space-y-6">
      <h3 className="type-body font-semibold text-(--text)">Drawers</h3>

      <div className="space-y-4">
        <h4 className="type-body-sm font-semibold text-(--text)">CdsDrawer (Right)</h4>
        <CdsButton variant="secondary" size="sm" onClick={() => setRightOpen(true)}>Open Right Drawer</CdsButton>
        <CdsDrawer open={rightOpen} onClose={() => setRightOpen(false)} title="Right Drawer">
          <p className="type-body text-(--text)">Drawer content goes here.</p>
        </CdsDrawer>
      </div>

      <div className="space-y-4">
        <h4 className="type-body-sm font-semibold text-(--text)">CdsDrawerLeft</h4>
        <CdsButton variant="secondary" size="sm" onClick={() => setLeftOpen(true)}>Open Left Drawer</CdsButton>
        <CdsDrawerLeft open={leftOpen} onClose={() => setLeftOpen(false)} title="Left Drawer">
          <p className="type-body text-(--text)">Left drawer content goes here.</p>
        </CdsDrawerLeft>
      </div>
    </section>
  )
}
