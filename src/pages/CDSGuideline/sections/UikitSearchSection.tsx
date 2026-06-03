// @ts-nocheck
import { useRef, useState } from 'react'
import { CdsSearchInput, CdsSearchBox, CdsSearchBar, CdsStackedListbox, CdsCombobox, CdsDateRangePicker, CdsInput, CdsTextarea, CdsFileUpload, CdsContextPanel, useCdsSearchShortcut } from '../../../components/cds'

const COMBO_OPTIONS = [
  { value: 'apex', label: 'Apex Holdings' },
  { value: 'meridian', label: 'Meridian Capital' },
  { value: 'bluestar', label: 'BlueStar Payments' },
  { value: 'novatech', label: 'NovaTech Corp' },
  { value: 'solaris', label: 'Solaris Ventures' },
]

export default function UikitSearchSection() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchActive, setSearchActive] = useState(false)
  const [boxQuery, setBoxQuery] = useState('')
  const [inputVal, setInputVal] = useState('')
  const [barInput, setBarInput] = useState('')
  const [barStatus, setBarStatus] = useState('all')
  const [textareaVal, setTextareaVal] = useState('')
  const [uploadFiles, setUploadFiles] = useState([{ id: 'demo_1', name: 'invoice_2026.pdf', size: 2_400_000, type: 'application/pdf', status: 'uploading' }])
  const [barActive, setBarActive] = useState(false)
  const [comboVal, setComboVal] = useState('')
  const [dateRange, setDateRange] = useState({ from: null, to: null })
  const searchRef = useRef(null)
  useCdsSearchShortcut(searchRef, { key: 'k', meta: true })

  return (
    <section className="space-y-8">
      <h3 className="type-body font-semibold text-(--text)">Search & Input</h3>

      {/* ─── Search Inputs ─────────────────────────────────── */}
      <div className="space-y-4">
        <p className="type-caption font-semibold uppercase text-(--subtle)">Search Inputs</p>

        <div className="space-y-2">
          <p className="type-caption text-(--muted)">CdsSearchInput — topbar style, shortcut hint, clear on value</p>
          <CdsSearchInput
            inputRef={searchRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            onFocus={() => setSearchActive(true)}
            onBlur={() => setSearchActive(false)}
            active={searchActive}
            placeholder="Search"
            shortcut="⌘K"
            className="max-w-sm"
          />
        </div>

        <div className="space-y-2">
          <p className="type-caption text-(--muted)">CdsSearchBox — bordered, 3 sizes (sm / md / lg)</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <span className="type-caption font-semibold text-(--text) mb-1 block">sm</span>
              <CdsSearchBox size="sm" value={boxQuery} onChange={(e) => setBoxQuery(e.target.value)} onClear={() => setBoxQuery('')} placeholder="Search…" />
            </div>
            <div>
              <span className="type-caption font-semibold text-(--text) mb-1 block">md</span>
              <CdsSearchBox size="md" value={boxQuery} onChange={(e) => setBoxQuery(e.target.value)} onClear={() => setBoxQuery('')} placeholder="Search…" />
            </div>
            <div>
              <span className="type-caption font-semibold text-(--text) mb-1 block">lg</span>
              <CdsSearchBox size="lg" value={boxQuery} onChange={(e) => setBoxQuery(e.target.value)} onClear={() => setBoxQuery('')} placeholder="Search…" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Text Input ────────────────────────────────────── */}
      <div className="space-y-4">
        <p className="type-caption font-semibold uppercase text-(--subtle)">Text Input</p>
        <div className="space-y-2">
          <p className="type-caption text-(--muted)">CdsInput — bordered, 3 sizes (sm / md / lg), with clear icon</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <span className="type-caption font-semibold text-(--text) mb-1 block">sm</span>
              <CdsInput size="sm" placeholder="Small input" value={inputVal} onChange={(e) => setInputVal(e.target.value)} onClear={() => setInputVal('')} />
            </div>
            <div>
              <span className="type-caption font-semibold text-(--text) mb-1 block">md</span>
              <CdsInput size="md" placeholder="Medium input" value={inputVal} onChange={(e) => setInputVal(e.target.value)} onClear={() => setInputVal('')} />
            </div>
            <div>
              <span className="type-caption font-semibold text-(--text) mb-1 block">lg</span>
              <CdsInput size="lg" placeholder="Large input" value={inputVal} onChange={(e) => setInputVal(e.target.value)} onClear={() => setInputVal('')} />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Combobox ──────────────────────────────────────── */}
      <div className="space-y-4">
        <p className="type-caption font-semibold uppercase text-(--subtle)">Combobox (Searchable Dropdown)</p>
        <div className="space-y-2">
          <p className="type-caption text-(--muted)">CdsCombobox — 3 sizes, debounced search, loadmore, clear</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <span className="type-caption font-semibold text-(--text) mb-1 block">sm</span>
              <CdsCombobox size="sm" value={comboVal} onChange={setComboVal} options={COMBO_OPTIONS} placeholder="Select…" />
            </div>
            <div>
              <span className="type-caption font-semibold text-(--text) mb-1 block">md</span>
              <CdsCombobox size="md" value={comboVal} onChange={setComboVal} options={COMBO_OPTIONS} placeholder="Select…" />
            </div>
            <div>
              <span className="type-caption font-semibold text-(--text) mb-1 block">lg</span>
              <CdsCombobox size="lg" value={comboVal} onChange={setComboVal} options={COMBO_OPTIONS} placeholder="Select…" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Date Range Picker ─────────────────────────────── */}
      <div className="space-y-4">
        <p className="type-caption font-semibold uppercase text-(--subtle)">Date Range Picker</p>
        <div className="space-y-2">
          <p className="type-caption text-(--muted)">CdsDateRangePicker — dual calendar, presets, year nav, 3 sizes</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <span className="type-caption font-semibold text-(--text) mb-1 block">sm</span>
              <CdsDateRangePicker size="sm" value={dateRange} onChange={setDateRange} />
            </div>
            <div>
              <span className="type-caption font-semibold text-(--text) mb-1 block">md</span>
              <CdsDateRangePicker size="md" value={dateRange} onChange={setDateRange} />
            </div>
            <div>
              <span className="type-caption font-semibold text-(--text) mb-1 block">lg</span>
              <CdsDateRangePicker size="lg" value={dateRange} onChange={setDateRange} />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Combined Search Bar ───────────────────────────── */}
      <div className="space-y-4">
        <p className="type-caption font-semibold uppercase text-(--subtle)">Combined Search Bar</p>
        <div className="space-y-2">
          <p className="type-caption text-(--muted)">CdsSearchBar — input + filter slots + Search/Reset actions</p>
          <CdsSearchBar
            inputValue={barInput}
            onInputChange={setBarInput}
            inputPlaceholder="Search by name…"
            slots={[
              { key: 'status', node: <CdsStackedListbox size="sm" buttonWidthClass="w-28" value={barStatus} onChange={setBarStatus} options={[{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'suspended', label: 'Suspended' }]} /> },
            ]}
            onSearch={() => setBarActive(true)}
            onReset={() => { setBarInput(''); setBarStatus('all'); setBarActive(false) }}
            hasActiveFilters={barActive}
          />
        </div>
      </div>

      {/* ─── Hook ──────────────────────────────────────────── */}
      <CdsContextPanel title="Keyboard Shortcut">
        <p>Use the useCdsSearchShortcut hook to bind a keyboard shortcut that focuses a search input.</p>
        <code className="mt-2 block rounded-md bg-(--fill) px-3 py-2 font-bold type-body-sm text-(--text)">
          useCdsSearchShortcut(ref, {'{'} key: 'k', meta: true {'}'})
        </code>
      </CdsContextPanel>

      {/* CdsTextarea */}
      <div className="space-y-2">
        <p className="type-caption font-medium text-(--muted)">CdsTextarea — with character counter</p>
        <CdsTextarea value={textareaVal} onChange={setTextareaVal} placeholder="Type your response..." maxLength={500} />
      </div>

      {/* CdsFileUpload — with uploading state demo */}
      <div className="space-y-2">
        <p className="type-caption font-medium text-(--muted)">CdsFileUpload — instant upload, max 5 files</p>
        <CdsFileUpload files={uploadFiles} onChange={setUploadFiles} onUpload={async (f) => { await new Promise(r => setTimeout(r, 1500)); return { id: `demo_${Date.now()}`, url: `https://cdn.mock.unifycamp.io/demo/${f.name}` } }} />
      </div>
    </section>
  )
}
