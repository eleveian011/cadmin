// @ts-nocheck
import { useEffect, useState } from 'react'
import { Palette } from 'lucide-react'

const FULL_STEPS = [0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950, 1000]
const GRAPHIC_STEPS = [200, 300, 400, 500, 600, 700, 800]

const FULL_SCALE_NAMES = [
  { key: 'purple' },
  { key: 'cyan' },
  { key: 'neutral' },
  { key: 'blue', label: 'Blue (info)' },
  { key: 'green', label: 'Green (success)' },
  { key: 'amber', label: 'Amber (warning)' },
  { key: 'orange', label: 'Orange (critical)' },
  { key: 'red', label: 'Red (danger)' },
]

const GRAPHIC_NAMES = [
  { key: 'graphic-blue' },
  { key: 'graphic-teal' },
  { key: 'graphic-mint' },
  { key: 'graphic-avocado' },
  { key: 'graphic-sunset' },
]

function readPaletteColors(key, steps) {
  const style = getComputedStyle(document.documentElement)
  const colors = {}
  for (const step of steps) {
    colors[step] = style.getPropertyValue(`--${key}-${step}`).trim() || '#000'
  }
  return colors
}

export default function PaletteSection() {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const root = document.documentElement
    const update = () => setTick((t) => t + 1)
    const observer = new MutationObserver(update)
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  const fullPalettes = FULL_SCALE_NAMES.map((p) => ({
    ...p,
    colors: readPaletteColors(p.key, FULL_STEPS),
  }))

  const graphicPalettes = GRAPHIC_NAMES.map((p) => ({
    ...p,
    colors: readPaletteColors(p.key, GRAPHIC_STEPS),
  }))

  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-(--text)">
          <Palette size={17} className="text-(--accent-text)" />
          <h2 className="type-h4 font-semibold">Palette</h2>
        </div>
        <p className="type-body text-(--muted)">Theme-agnostic primitive color scales. Always map to semantic tokens — never reference these stops directly in components.</p>
      </div>

      {/* Full-scale palettes (0–1000, 13 stops) */}
      <div className="space-y-4">
        {fullPalettes.map((palette) => (
          <div key={palette.key} className="space-y-2">
            <p className="type-body font-semibold text-(--text)">{palette.label || palette.key}</p>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 xl:grid-cols-13">
              {FULL_STEPS.map((step) => (
                <div key={`${palette.key}-${step}`} className="space-y-1">
                  <div className="h-10 rounded border border-(--border)" style={{ background: palette.colors[step] }} />
                  <p className="type-caption font-medium text-(--muted)">{step}</p>
                  <p className="type-caption text-(--subtle)">{palette.colors[step]}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-(--border) pt-4">
        <p className="type-body-sm text-(--muted) mb-4">
          Graphic palettes (200–800) are reserved for charts and data visualization.
        </p>
      </div>

      {/* Graphic palettes (200–800, chart/data-viz only) */}
      <div className="space-y-4">
        {graphicPalettes.map((palette) => (
          <div key={palette.key} className="space-y-2">
            <p className="type-body font-semibold text-(--text)">{palette.key}</p>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 xl:grid-cols-7">
              {GRAPHIC_STEPS.map((step) => (
                <div key={`${palette.key}-${step}`} className="space-y-1">
                  <div className="h-10 rounded border border-(--border)" style={{ background: palette.colors[step] }} />
                  <p className="type-caption font-medium text-(--muted)">{step}</p>
                  <p className="type-caption text-(--subtle)">{palette.colors[step]}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
