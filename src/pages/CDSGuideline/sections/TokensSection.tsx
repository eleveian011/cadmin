// @ts-nocheck
import { useEffect, useState } from 'react'
import { Sparkles, Sun, Moon } from 'lucide-react'

/* Since the palette is theme-agnostic (0=light, 1000=dark, no flipping),
   reading a palette stop from getComputedStyle always returns the same hex
   regardless of the active theme. Only semantic tokens change per theme. */
function readPaletteColor(name, step) {
  return getComputedStyle(document.documentElement).getPropertyValue(`--${name}-${step}`).trim() || '#000'
}

const TOKEN_GROUPS = [
  { title: 'Text', items: [
    { name: '--text',     ref: 'neutral-1000', refDark: 'neutral-0',   usage: 'Default text color' },
    { name: '--muted',    ref: 'neutral-600',  refDark: 'neutral-400', usage: 'Secondary / muted text' },
    { name: '--subtle',   ref: 'neutral-400',  refDark: 'neutral-600', usage: 'Subtle / tertiary text' },
    { name: '--disabled',   ref: 'neutral-500', refDark: 'neutral-500', usage: 'Disabled text' },
    { name: '--on-primary',  ref: 'neutral-0', refDark: 'neutral-0', usage: 'Text on primary / accent surfaces' },
  ]},
  { title: 'Accent', items: [
    { name: '--accent',            ref: 'purple-700', refDark: 'purple-300', usage: 'Primary accent / brand color' },
    { name: '--accent-hover',      ref: 'purple-500', refDark: 'purple-500', usage: 'Accent hover state' },
    { name: '--accent-text',       ref: 'purple-600', refDark: 'purple-400', usage: 'Accent-colored text and icons' },
    { name: '--accent-secondary',  ref: 'purple-300', refDark: 'purple-700', usage: 'Secondary accent' },
    { name: '--accent-subtle',     ref: 'purple-50',  refDark: 'purple-900', usage: 'Subtle accent background' },
  ]},
  { title: 'Border', items: [
    { name: '--border',        ref: 'neutral-100', refDark: 'neutral-900', usage: 'Default border' },
    { name: '--border-strong', ref: 'neutral-200', refDark: 'neutral-800', usage: 'Stronger / emphasized border' },
  ]},
  { title: 'Surface', items: [
    { name: '--bg',              ref: 'neutral-50',  refDark: 'neutral-950',  usage: 'Page background' },
    { name: '--surface',         ref: 'neutral-50',  refDark: 'neutral-950',  usage: 'Surface background' },
    { name: '--surface-overlay', ref: 'neutral-0',   refDark: 'neutral-1000', usage: 'Overlay / popover surface' },
    { name: '--fill',            ref: 'neutral-100', refDark: 'neutral-900',  usage: 'Subtle fill background' },
    { name: '--fill-hover',      ref: 'neutral-0',   refDark: 'neutral-1000', usage: 'Fill hover state' },
    { name: '--item-hover',      ref: 'neutral-100', refDark: 'neutral-900', usage: 'List item hover background' },
    { name: '--surface-glass',   ref: 'custom', custom: 'rgba(250,250,250,0.85)', customDark: 'rgba(24,24,24,0.85)', usage: 'Frosted glass surface (topbar)' },
    { name: '--surface-disabled', ref: 'neutral-200', refDark: 'neutral-800', usage: 'Disabled surface background' },
  ]},
  { title: 'Status', items: [
    { name: '--success',        ref: 'green-500', refDark: 'green-500', usage: 'Success / positive state' },
    { name: '--success-bg',     ref: 'green-100', refDark: 'green-950', usage: 'Success background' },
    { name: '--success-border', ref: 'green-200', refDark: 'green-800', usage: 'Success border' },
    { name: '--success-text',   ref: 'green-700', refDark: 'green-300', usage: 'Success text on soft background' },
    { name: '--danger',         ref: 'red-500',   refDark: 'red-500',   usage: 'Danger / error state' },
    { name: '--danger-bg',      ref: 'red-50',    refDark: 'red-950',   usage: 'Danger background' },
    { name: '--danger-border',  ref: 'red-200',   refDark: 'red-800',   usage: 'Danger border' },
    { name: '--danger-text',    ref: 'red-600',   refDark: 'red-400',   usage: 'Danger text on soft background' },
    { name: '--warning',        ref: 'amber-600', refDark: 'amber-500', usage: 'Warning state' },
    { name: '--warning-bg',     ref: 'amber-50',  refDark: 'amber-950', usage: 'Warning background' },
    { name: '--warning-border', ref: 'amber-200', refDark: 'amber-800', usage: 'Warning border' },
    { name: '--warning-text',   ref: 'amber-700', refDark: 'amber-300', usage: 'Warning text on soft background' },
    { name: '--info',           ref: 'blue-500',  refDark: 'blue-500',  usage: 'Info state' },
    { name: '--info-bg',        ref: 'blue-50',   refDark: 'blue-950',  usage: 'Info background' },
    { name: '--info-border',    ref: 'blue-200',  refDark: 'blue-800',  usage: 'Info border' },
    { name: '--info-text',      ref: 'blue-600',  refDark: 'blue-400',  usage: 'Info text on soft background' },
    { name: '--primary',        ref: 'purple-700', refDark: 'purple-300', usage: 'Primary status color' },
    { name: '--primary-bg',     ref: 'purple-50',  refDark: 'purple-950', usage: 'Primary status background' },
    { name: '--primary-border', ref: 'purple-200', refDark: 'purple-800', usage: 'Primary status border' },
    { name: '--primary-text',   ref: 'purple-600', refDark: 'purple-400', usage: 'Primary status text on soft background' },
    { name: '--neutral',        ref: 'neutral-500', refDark: 'neutral-500', usage: 'Neutral status color' },
    { name: '--neutral-bg',     ref: 'neutral-100', refDark: 'neutral-900', usage: 'Neutral status background' },
    { name: '--neutral-border', ref: 'neutral-200', refDark: 'neutral-800', usage: 'Neutral status border' },
    { name: '--neutral-text',   ref: 'neutral-600', refDark: 'neutral-400', usage: 'Neutral status text on soft background' },
  ]},
  { title: 'Overlay', items: [
    { name: '--overlay-backdrop', ref: 'custom', custom: 'rgba(0,0,0,0.45)', customDark: 'rgba(0,0,0,0.45)', usage: 'Modal / dialog backdrop' },
    { name: '--logo-fill',        ref: 'purple-900', refDark: 'neutral-0', usage: 'Logo fill color' },
  ]},
  { title: 'Shadow', items: [
    { name: '--shadow-sm',      type: 'shadow', usage: 'Small elevation shadow' },
    { name: '--shadow',         type: 'shadow', usage: 'Default elevation shadow' },
    { name: '--shadow-lg',      type: 'shadow', usage: 'Large elevation shadow' },
    { name: '--shadow-overlay', type: 'shadow', usage: 'Overlay / popover shadow' },
  ]},
  { title: 'Shape & layout', items: [
    { name: '--cds-radius',      type: 'value', ref: '8px',    usage: 'Default corner radius (rounded-md)' },
    { name: '--cds-radius-lg',   type: 'value', ref: '12px',   usage: 'Large corner radius (rounded-lg)' },
    { name: '--cds-radius-full', type: 'value', ref: '9999px', usage: 'Fully rounded (pill / circle)' },
    { name: '--header-h',        type: 'value', ref: '60px',   usage: 'Topbar height' },
    { name: '--sidebar-w',       type: 'value', ref: '220px',  usage: 'Sidebar width' },
  ]},
]

function resolveRef(ref) {
  if (!ref || ref === 'custom' || ref === 'shadow') return null
  const [palette, step] = ref.split('-')
  return readPaletteColor(palette, step)
}

export default function TokensSection() {
  const [, setTick] = useState(0)

  useEffect(() => {
    const root = document.documentElement
    const update = () => setTick((t) => t + 1)
    const observer = new MutationObserver(update)
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-(--text)">
          <Sparkles size={17} className="text-(--accent-text)" />
          <h2 className="type-h4 font-semibold">Tokens</h2>
        </div>
        <p className="type-body text-(--muted)">Semantic design tokens. Each maps to a palette stop per theme — always reference the token, never the raw palette stop.</p>
      </div>
      <div className="space-y-6">
        {TOKEN_GROUPS.map((group) => (
          <div key={group.title} className="space-y-2">
            <h3 className="type-body font-semibold text-(--text)">{group.title}</h3>
            <div className="overflow-hidden rounded-lg border border-(--border)">
              <div className="grid grid-cols-[152px_48px_108px_48px_108px_1fr] items-center gap-3 bg-(--fill) px-3 py-2 type-caption font-medium uppercase text-(--muted)">
                <span>Token</span>
                <span className="flex items-center gap-1"><Sun size={11} /> Light</span>
                <span className="type-caption font-medium uppercase text-(--subtle)">Ref</span>
                <span className="flex items-center gap-1"><Moon size={11} /> Dark</span>
                <span className="type-caption font-medium uppercase text-(--subtle)">Ref</span>
                <span>Usage</span>
              </div>
              <div className="divide-y divide-(--border)">
                {group.items.map((item) => {
                  const isValue = item.type === 'value'
                  const isShadow = item.type === 'shadow'
                  const lightColor = item.custom || resolveRef(item.ref)
                  const darkColor  = item.customDark || (item.refDark === 'custom' ? item.customDark : resolveRef(item.refDark))

                  return (
                    <div key={item.name} className="grid grid-cols-[152px_48px_108px_48px_108px_1fr] items-center gap-3 px-3 py-2">
                      <code className="type-caption font-bold text-(--accent-text)">{item.name}</code>

                      {/* Light swatch */}
                      {isShadow || isValue
                        ? <span className="type-caption text-(--subtle)">—</span>
                        : <div className="h-9 rounded border border-(--border)" style={{ background: lightColor }} />
                      }

                      {/* Light ref */}
                      <span className="type-caption font-bold text-(--muted)">
                        {isValue ? item.ref : isShadow ? '—' : item.ref}
                      </span>

                      {/* Dark swatch */}
                      {isShadow || isValue
                        ? <span className="type-caption text-(--subtle)">—</span>
                        : <div className="h-9 rounded border border-(--border)" style={{ background: darkColor }} />
                      }

                      {/* Dark ref */}
                      <span className="type-caption font-bold text-(--muted)">
                        {isValue ? item.ref : isShadow ? '—' : (item.refDark === 'custom' ? 'custom' : item.refDark)}
                      </span>

                      <span className="type-body-sm text-(--muted)">{item.usage}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
