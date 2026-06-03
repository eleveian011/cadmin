// @ts-nocheck
import { useState } from 'react'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Globe } from 'lucide-react'
import {
  CdsAvatar,
  CdsContextPanel,
  CdsDropdownPanel,
  CdsMenuItem,
  CdsSubDropdownPanel,
  CdsSubMenu,
  CdsStackedListbox,
} from '../../../components/cds'

const LISTBOX_OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'premium', label: 'Premium' },
  { value: 'enterprise', label: 'Enterprise' },
]

const LISTBOX_SECTIONED = [
  { type: 'section', label: 'Product' },
  { value: 'standard', label: 'Standard' },
  { value: 'premium', label: 'Premium' },
  { type: 'section', label: 'Meta' },
  { value: 'profile', label: 'Profile Info', readOnly: true },
  { value: 'enterprise', label: 'Enterprise' },
]

export default function UikitDropdownSection() {
  const [listboxValue, setListboxValue] = useState(LISTBOX_OPTIONS[0].value)

  const listboxOptions = LISTBOX_OPTIONS.map((o) => ({ value: o.value, label: o.label }))
  const sectionedOptions = LISTBOX_SECTIONED

  return (
    <section className="space-y-5">
      <h3 className="type-body font-semibold text-(--text)">Dropdown</h3>

      <CdsContextPanel title="Specification">
        <ul className="list-disc space-y-1 pl-4">
          <li>Three sizes (sm / md / lg).</li>
          <li>Menu width mode: match-trigger or custom.</li>
          <li>Custom menu width via menuWidthClass.</li>
          <li>Item styles: compact, simple, or rich.</li>
          <li>Chevron rotates when the menu is open.</li>
          <li>Disabled state blocks interaction.</li>
          <li>Optional leading icon on the trigger.</li>
        </ul>
      </CdsContextPanel>

      <div className="space-y-2">
        <p className="type-caption font-medium text-(--muted)">Sizes</p>
        <div className="flex flex-wrap items-start gap-3">
          <CdsStackedListbox value={listboxValue} onChange={setListboxValue} options={listboxOptions} size="sm" itemStyle="compact" menuWidthMode="match-trigger" buttonWidthClass="w-40" />
          <CdsStackedListbox value={listboxValue} onChange={setListboxValue} options={listboxOptions} size="md" itemStyle="simple" menuWidthMode="match-trigger" buttonWidthClass="w-44" />
          <CdsStackedListbox value={listboxValue} onChange={setListboxValue} options={listboxOptions} size="lg" itemStyle="simple" menuWidthMode="match-trigger" buttonWidthClass="w-48" />
        </div>
      </div>

      <div className="space-y-2">
        <p className="type-caption font-medium text-(--muted)">Disabled</p>
        <CdsStackedListbox value={listboxValue} onChange={setListboxValue} options={listboxOptions} size="md" itemStyle="simple" menuWidthMode="match-trigger" buttonWidthClass="w-44" disabled />
      </div>

      <div className="space-y-2">
        <p className="type-caption font-medium text-(--muted)">Leading icon</p>
        <CdsStackedListbox value={listboxValue} onChange={setListboxValue} options={listboxOptions} size="md" itemStyle="simple" menuWidthMode="match-trigger" buttonWidthClass="w-52" leadingIcon={<Globe size={14} />} />
      </div>

      <div className="space-y-2">
        <p className="type-caption font-medium text-(--muted)">Rich items with sections</p>
        <CdsStackedListbox value={listboxValue} onChange={setListboxValue} options={sectionedOptions} size="md" itemStyle="rich" menuWidthMode="match-trigger" buttonWidthClass="w-56" />
      </div>

      <div className="space-y-2">
        <p className="type-caption font-medium text-(--muted)">Custom width, bottom end</p>
        <CdsStackedListbox value={listboxValue} onChange={setListboxValue} options={listboxOptions} size="md" itemStyle="rich" menuWidthMode="custom" menuWidthClass="w-72" buttonWidthClass="w-44" anchor="bottom end" />
      </div>

      <div className="space-y-2">
        <p className="type-caption font-medium text-(--muted)">Avatar trigger</p>
        <div className="flex items-start gap-4">
          <Menu>
            <div className="relative inline-block">
              <MenuButton as="div" className="cursor-pointer">
                <CdsAvatar size="md" shape="circle" name="Super Admin" />
              </MenuButton>
              <MenuItems anchor="bottom end" className="z-1200 w-48 rounded-md border border-(--border) bg-(--surface-overlay) p-1 shadow-(--shadow-lg) [--anchor-gap:6px]">
                <div className="px-2.5 py-1.5 type-caption font-semibold uppercase text-(--subtle)">Account</div>
                <MenuItem>
                  {({ focus }) => (
                    <div className={`cursor-pointer rounded-md px-2.5 py-2 type-body ${focus ? 'bg-(--accent-subtle) text-(--accent-text)' : 'text-(--text)'}`}>
                      Edit Profile
                    </div>
                  )}
                </MenuItem>
                <div className="my-1 border-t border-(--border)" />
                <MenuItem>
                  {({ focus }) => (
                    <div className={`cursor-pointer rounded-md px-2.5 py-2 type-body ${focus ? 'bg-(--danger-bg) text-(--danger)' : 'text-(--danger)'}`}>
                      Sign Out
                    </div>
                  )}
                </MenuItem>
              </MenuItems>
            </div>
          </Menu>
          <Menu>
            <div className="relative inline-block">
              <MenuButton as="div" className="cursor-pointer">
                <CdsAvatar size="md" shape="square" name="Super Admin" badge />
              </MenuButton>
              <MenuItems anchor="bottom end" className="z-1200 w-48 rounded-md border border-(--border) bg-(--surface-overlay) p-1 shadow-(--shadow-lg) [--anchor-gap:6px]">
                <div className="px-2.5 py-1.5 type-caption font-semibold uppercase text-(--subtle)">Account</div>
                <MenuItem>
                  {({ focus }) => (
                    <div className={`cursor-pointer rounded-md px-2.5 py-2 type-body ${focus ? 'bg-(--accent-subtle) text-(--accent-text)' : 'text-(--text)'}`}>
                      Edit Profile
                    </div>
                  )}
                </MenuItem>
                <div className="my-1 border-t border-(--border)" />
                <MenuItem>
                  {({ focus }) => (
                    <div className={`cursor-pointer rounded-md px-2.5 py-2 type-body ${focus ? 'bg-(--danger-bg) text-(--danger)' : 'text-(--danger)'}`}>
                      Sign Out
                    </div>
                  )}
                </MenuItem>
              </MenuItems>
            </div>
          </Menu>
        </div>
      </div>

      <div className="space-y-2">
        <p className="type-caption font-medium text-(--muted)">Flyout panel</p>
        <CdsDropdownPanel className="w-56 p-1">
          <CdsMenuItem variant="header">Example panel</CdsMenuItem>
          {['Item one', 'Item two'].map((item) => (
            <CdsMenuItem key={item}>{item}</CdsMenuItem>
          ))}
          <CdsSubDropdownPanel
            label="More options"
            items={listboxOptions}
            value={listboxValue}
            onChange={setListboxValue}
            panelTitle="Select option"
          />
        </CdsDropdownPanel>
      </div>

      <div className="space-y-2">
        <p className="type-caption font-medium text-(--muted)">Panel surface</p>
        <p className="type-body-sm text-(--subtle)">A standalone dropdown panel surface for grouping menu items.</p>
        <CdsDropdownPanel className="w-56 p-1">
          <CdsMenuItem variant="header">Section label</CdsMenuItem>
          {['Item one', 'Item two', 'Item three'].map((item) => (
            <CdsMenuItem key={item}>{item}</CdsMenuItem>
          ))}
        </CdsDropdownPanel>
      </div>

      <div className="space-y-2">
        <p className="type-caption font-medium text-(--muted)">Submenu</p>
        <p className="type-body-sm text-(--subtle)">Nested submenu items expand to reveal child options.</p>
        <CdsDropdownPanel className="w-56 p-1">
          <CdsMenuItem variant="header">Navigation</CdsMenuItem>
          <CdsMenuItem>Dashboard</CdsMenuItem>
          <CdsSubMenu label="Settings" />
          <CdsSubMenu label="Reports" />
        </CdsDropdownPanel>
      </div>
    </section>
  )
}
