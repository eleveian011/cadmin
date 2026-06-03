// @ts-nocheck
import { useState } from 'react'
import { CdsBadge, CdsPageHeader, CdsContextPanel } from '../../components/cds'

import PaletteSection from './sections/PaletteSection'
import TokensSection from './sections/TokensSection'
import BreakpointsSection from './sections/BreakpointsSection'
import TypeSection from './sections/TypeSection'
import IconsSection from './sections/IconsSection'
import UikitButtonsSection from './sections/UikitButtonsSection'
import UikitFormSection from './sections/UikitFormSection'
import UikitAvatarSection from './sections/UikitAvatarSection'
import UikitBadgesSection from './sections/UikitBadgesSection'
import UikitDropdownSection from './sections/UikitDropdownSection'
import UikitSearchSection from './sections/UikitSearchSection'
import UikitEntityPickerSection from './sections/UikitEntityPickerSection'
import UikitMiscSection from './sections/UikitMiscSection'
import UikitSpacingSection from './sections/UikitSpacingSection'
import UikitFeedbackSection from './sections/UikitFeedbackSection'
import UikitTableSection from './sections/UikitTableSection'
import UikitMetricCardSection from './sections/UikitMetricCardSection'
import UikitTabsSection from './sections/UikitTabsSection'
import UikitPageHeaderSection from './sections/UikitPageHeaderSection'
import UikitStatusSection from './sections/UikitStatusSection'
import UikitFilterPillSection from './sections/UikitFilterPillSection'
import UikitDrawerSection from './sections/UikitDrawerSection'
import UikitDetailListSection from './sections/UikitDetailListSection'

const NAV_ITEMS = [
  { id: 'palette', label: 'Palette' },
  { id: 'tokens', label: 'Tokens' },
  { id: 'breakpoints', label: 'Breakpoints' },
  { id: 'type', label: 'Typography' },
  { id: 'icons', label: 'Icons' },
  {
    id: 'uikit',
    label: 'UI Kit',
    children: [
      { id: 'uikit-buttons', label: 'Buttons' },
      { id: 'uikit-form', label: 'Form' },
      { id: 'uikit-avatar', label: 'Avatar' },
      { id: 'uikit-badges', label: 'Badges' },
      { id: 'uikit-dropdown', label: 'Dropdown' },
      { id: 'uikit-search', label: 'Search' },
      { id: 'uikit-entity-picker', label: 'Entity Picker' },
      { id: 'uikit-table', label: 'Table' },
      { id: 'uikit-tabs', label: 'Tabs' },
      { id: 'uikit-metric-card', label: 'Metric Card' },
      { id: 'uikit-page-header', label: 'Page Header' },
      { id: 'uikit-misc', label: 'Misc' },
      { id: 'uikit-spacing', label: 'Spacing' },
      { id: 'uikit-feedback', label: 'Feedback' },
      { id: 'uikit-status', label: 'Status' },
      { id: 'uikit-filter-pill', label: 'Filter Pill' },
      { id: 'uikit-drawer', label: 'Drawer' },
      { id: 'uikit-detail-list', label: 'Detail List' },
    ],
  },
]

const SECTION_MAP = {
  'palette': PaletteSection,
  'tokens': TokensSection,
  'breakpoints': BreakpointsSection,
  'type': TypeSection,
  'icons': IconsSection,
  'uikit-buttons': UikitButtonsSection,
  'uikit-form': UikitFormSection,
  'uikit-avatar': UikitAvatarSection,
  'uikit-badges': UikitBadgesSection,
  'uikit-dropdown': UikitDropdownSection,
  'uikit-search': UikitSearchSection,
  'uikit-entity-picker': UikitEntityPickerSection,
  'uikit-table': UikitTableSection,
  'uikit-tabs': UikitTabsSection,
  'uikit-metric-card': UikitMetricCardSection,
  'uikit-page-header': UikitPageHeaderSection,
  'uikit-misc': UikitMiscSection,
  'uikit-spacing': UikitSpacingSection,
  'uikit-feedback': UikitFeedbackSection,
  'uikit-status': UikitStatusSection,
  'uikit-filter-pill': UikitFilterPillSection,
  'uikit-drawer': UikitDrawerSection,
  'uikit-detail-list': UikitDetailListSection,
}

const NAV_ITEM_BASE = 'type-body block w-full rounded-md px-3 py-1.5 text-left transition cursor-pointer'
const NAV_ITEM_ACTIVE = `${NAV_ITEM_BASE} bg-(--accent-subtle) font-medium text-(--accent-text)`
const NAV_ITEM_DEFAULT = `${NAV_ITEM_BASE} text-(--muted) hover:bg-(--item-hover) hover:text-(--text)`

export default function CDSGuideline() {
  const [activeSection, setActiveSection] = useState('palette')

  const ActiveComponent = SECTION_MAP[activeSection]

  return (
    <div className="min-h-full" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div>
        <CdsPageHeader
          breadcrumb={[{ to: '/docs', label: 'Docs' }, { label: 'Design System' }]}
          title="Camp Design System"
          subtitle="Component library, tokens, and styling reference"
          className="mb-10"
        >
          <div className="flex flex-wrap items-center gap-2">
            <a href="https://tailwindcss.com/docs" target="_blank" rel="noreferrer">
              <CdsBadge tone="primary">Tailwind CSS</CdsBadge>
            </a>
            <a href="https://headlessui.com/react" target="_blank" rel="noreferrer">
              <CdsBadge tone="success">Headless UI</CdsBadge>
            </a>
          </div>
          <CdsContextPanel title="For designers">
            <p>Every screen is built from these tokens and components — start here before designing new flows.</p>
            <p className="mt-1">Reuse what exists and follow the scale so the product stays consistent.</p>
          </CdsContextPanel>
        </CdsPageHeader>

        <div className="grid grid-cols-1 gap-10 xl:grid-cols-[260px_1fr]">
          <aside className="hidden xl:block">
            <nav className="sticky top-20 space-y-1">
              <p className="mb-2 type-caption font-semibold uppercase text-(--subtle)">On this page</p>
              {NAV_ITEMS.map((item) => {
                if (item.children) {
                  return (
                    <div key={item.id} className="space-y-0.5">
                      <button
                        className={activeSection === item.id ? NAV_ITEM_ACTIVE : NAV_ITEM_DEFAULT}
                        onClick={() => setActiveSection(item.children[0].id)}
                      >
                        {item.label}
                      </button>
                      <div className="ml-3 space-y-0.5 border-l border-(--border) pl-2">
                        {item.children.map((child) => (
                          <button
                            key={child.id}
                            className={activeSection === child.id ? NAV_ITEM_ACTIVE : NAV_ITEM_DEFAULT}
                            onClick={() => setActiveSection(child.id)}
                          >
                            {child.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                }
                return (
                  <button
                    key={item.id}
                    className={activeSection === item.id ? NAV_ITEM_ACTIVE : NAV_ITEM_DEFAULT}
                    onClick={() => setActiveSection(item.id)}
                  >
                    {item.label}
                  </button>
                )
              })}
            </nav>
          </aside>

          <main className="min-w-0">
            <ActiveComponent />
          </main>
        </div>
      </div>
    </div>
  )
}
