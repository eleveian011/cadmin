// @ts-nocheck
import * as Icons from 'lucide-react'
import { CdsTable, CdsContextPanel } from '../../../components/cds'

const ICON_CATALOG = [
  { name: 'AlertTriangle',     usage: 'Warning / danger state indicator',           context: 'Notices, deposit warnings, balance alerts' },
  { name: 'ArrowDownUp',       usage: 'Transaction group toggle',                   context: 'Sidebar nav — Transactions section' },
  { name: 'ArrowLeftRight',    usage: 'Transfer / swap action',                     context: 'Client actions, config center' },
  { name: 'ArrowRight',        usage: 'Directional indicator / proceed',            context: 'Swap flow, checkout, send funds' },
  { name: 'BookUser',          usage: 'Recipients / contacts',                      context: 'Sidebar nav — Recipients' },
  { name: 'Calendar',          usage: 'Date / period selector',                     context: 'Statement page date picker' },
  { name: 'Check',             usage: 'Selection confirmed / success',              context: 'Listbox selected item, checkmarks, copy confirmation' },
  { name: 'ChevronDown',       usage: 'Dropdown trigger / expand',                  context: 'Select menus, collapsible sections' },
  { name: 'ChevronLeft',       usage: 'Navigate back / previous',                   context: 'Pagination, detail page back button' },
  { name: 'ChevronRight',      usage: 'Navigate forward / expand group',            context: 'Sidebar group expand, breadcrumb separator, pagination' },
  { name: 'ChevronsUpDown',    usage: 'Listbox sort indicator',                     context: 'CDS Listbox trigger' },
  { name: 'Circle',            usage: 'Radio / unselected state',                   context: 'Dropdown menu radio items, profile settings' },
  { name: 'Coins',             usage: 'Currency / fees',                            context: 'Config center — fee settings' },
  { name: 'Construction',      usage: 'Under construction / placeholder',           context: 'Placeholder pages, investment coming soon' },
  { name: 'Copy',              usage: 'Copy to clipboard',                          context: 'API keys, deposit account details, recipient addresses' },
  { name: 'CreditCard',        usage: 'Card / payment method',                      context: 'Sidebar nav — Checkout (future: Card module)' },
  { name: 'Download',          usage: 'Export / download file',                     context: 'Statement export, log export, transaction CSV' },
  { name: 'FileText',          usage: 'Document / statement / order',               context: 'Sidebar nav — Statements, Order History' },
  { name: 'Globe',             usage: 'Language / international',                   context: 'Language switcher, API key webhook URL' },
  { name: 'Home',              usage: 'Home / root breadcrumb',                     context: 'Breadcrumb home link' },
  { name: 'Inbox',             usage: 'Notifications / inbox',                      context: 'Topbar notification bell' },
  { name: 'IndentDecrease',    usage: 'Collapse sidebar',                           context: 'Sidebar collapse toggle (expanded state)' },
  { name: 'IndentIncrease',    usage: 'Expand sidebar',                             context: 'Sidebar collapse toggle (collapsed state)' },
  { name: 'Key',               usage: 'API key / secret',                           context: 'API Keys page — key row icon' },
  { name: 'Layers3',           usage: 'Multi-layer / hierarchy',                    context: 'Config center — organization layers' },
  { name: 'LayoutDashboard',   usage: 'Dashboard / overview',                       context: 'Sidebar nav — Overview' },
  { name: 'LayoutGrid',        usage: 'Workspace section',                          context: 'Sidebar section icon — Workspace' },
  { name: 'ListTodo',          usage: 'Tasks / to-do list',                         context: 'Sidebar nav — Task Center, Inbox tasks' },
  { name: 'Menu',              usage: 'Hamburger menu (mobile)',                    context: 'Topbar mobile menu toggle' },
  { name: 'Moon',              usage: 'Dark mode',                                  context: 'Sidebar theme toggle (switch to dark)' },
  { name: 'MoreHorizontal',    usage: 'More actions / overflow menu',               context: 'Profile menu trigger, table row actions' },
  { name: 'Palette',           usage: 'Colors / design',                            context: 'CDS Guideline — Palette section' },
  { name: 'Plus',              usage: 'Add / create new',                           context: 'Create buttons (client, API key, recipient, etc.)' },
  { name: 'Ruler',             usage: 'Measurements / spacing',                     context: 'CDS Guideline — Breakpoints section' },
  { name: 'ScrollText',        usage: 'Log / history / transaction record',         context: 'Sidebar nav — Log Center, Transaction History' },
  { name: 'Search',            usage: 'Search / filter',                            context: 'Global search, table filters, currency picker search' },
  { name: 'Shield',            usage: 'Security / permissions',                     context: 'Config center — security, People page roles' },
  { name: 'SlidersHorizontal', usage: 'Settings / configuration',                   context: 'Sidebar nav — Configuration' },
  { name: 'Sparkles',          usage: 'AI / magic / premium feature',               context: 'Topbar AgentX button' },
  { name: 'Sun',               usage: 'Light mode',                                 context: 'Sidebar theme toggle (switch to light)' },
  { name: 'SwatchBook',        usage: 'Design system / style guide',                context: 'Sidebar nav — CDS Guideline' },
  { name: 'Trash2',            usage: 'Delete / remove',                            context: 'API key revoke, role delete, recipient remove' },
  { name: 'TrendingUp',        usage: 'Growth / investment / performance',          context: 'Sidebar nav — Investment, asset trend charts' },
  { name: 'Type',              usage: 'Typography',                                 context: 'CDS Guideline — Typography section' },
  { name: 'Users',             usage: 'People / organizations',                     context: 'Sidebar nav — Organizations' },
  { name: 'Vault',             usage: 'Secure storage / accounts',                  context: 'Sidebar nav — Fund Services (accounts)' },
  { name: 'Wallet',            usage: 'Wallet / funds / balance',                   context: 'Sidebar nav — Assets, client wallet actions, Login logo' },
  { name: 'Webhook',           usage: 'Webhook / integration endpoint',             context: 'Config center — webhooks' },
  { name: 'X',                 usage: 'Close / dismiss / cancel',                   context: 'Modal close, drawer close, tag remove' },
  { name: 'Zap',               usage: 'Instant / webhook event / power',            context: 'Inbox urgency, API webhook row icon' },
]

const columns = [
  {
    key: 'icon', header: '', width: '40px', align: 'center',
    render: (_, row) => {
      const Ic = Icons[row.name]
      return Ic ? <Ic size={18} /> : null
    },
  },
  {
    key: 'name', header: 'Name', width: '160px',
    render: (v) => <code className="font-bold type-body-sm text-(--accent-text)">{v}</code>,
  },
  { key: 'usage',   header: 'Usage' },
  { key: 'context', header: 'Context' },
]

export default function IconsSection() {

  return (
    <section className="space-y-5">
      <div>
        <h2 className="type-h4 font-semibold text-(--text)">Icons</h2>
        <p className="mt-1 type-body-sm text-(--muted)">
          All icons currently in use. Source: <code className="font-bold">lucide-react</code>.
          Custom replacements go in <code className="font-bold">src/components/icons/</code> and
          must export the same interface (<code className="font-bold">size</code> + <code className="font-bold">className</code> props).
        </p>
      </div>

      <CdsTable
        columns={columns}
        data={ICON_CATALOG}
        rowKey="name"
        compact
      />

      <CdsContextPanel title="Custom icon pack integration">
        <p>
          To replace a lucide icon with a custom-drawn one, create a component in
          <code className="font-bold mx-1">src/components/icons/</code> that accepts
          <code className="font-bold mx-1">size?: number</code> and
          <code className="font-bold mx-1">className?: string</code> props.
          Then update the import in the consuming file — no other changes needed.
          Both lucide and custom icons coexist seamlessly.
        </p>
      </CdsContextPanel>
    </section>
  )
}
