// @ts-nocheck
import { ResponsiveContainer, AreaChart, Area } from 'recharts'
import { CdsMetricCard } from '../../../components/cds'

function genSparkline(base, variance, days = 30) {
  return Array.from({ length: days }, (_, i) => ({
    d: i,
    v: Math.max(0, base + (Math.random() - 0.45) * variance),
  }))
}

const SPARK_A = genSparkline(480, 260)
const SPARK_B = genSparkline(54, 30)

function Sparkline({ data, color = 'var(--accent)', height = 36 }) {
  const gradId = `sg-guide-${color.replace(/[^a-z0-9]/gi, '')}`
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
              fill={`url(#${gradId})`} dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default function UikitMetricCardSection() {
  return (
    <section className="space-y-4">
      <h3 className="type-body font-semibold text-(--text)">Metric Card</h3>
      <p className="type-body-sm text-(--muted)">
        Summary stat cards with optional badge and chart. Chart renders flush to the card border.
      </p>

      <div className="grid grid-cols-3 gap-3">
        <CdsMetricCard
          label="Total Organizations"
          value={11}
          badge="+2 new"
          badgeTone="info"
          sub="9 active"
          chart={<Sparkline data={SPARK_A} color="var(--accent)" />}
        />
        <CdsMetricCard
          label="Monthly Volume"
          value="$14.2M"
          badge="+8.7%"
          badgeTone="success"
          sub="640 transactions"
          chart={<Sparkline data={SPARK_B} color="var(--success)" />}
        />
        <CdsMetricCard
          label="In-Transit"
          value="$1.08M"
          sub="funds pending settlement"
        />
      </div>

      <h4 className="type-body-sm font-semibold text-(--text) pt-2">Props</h4>
      <div className="overflow-hidden rounded-lg border border-(--border)">
        <table className="w-full type-body-sm">
          <thead>
            <tr className="bg-(--fill)">
              <th className="px-3 py-2 text-left type-caption font-semibold uppercase text-(--subtle)">Prop</th>
              <th className="px-3 py-2 text-left type-caption font-semibold uppercase text-(--subtle)">Type</th>
              <th className="px-3 py-2 text-left type-caption font-semibold uppercase text-(--subtle)">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--border)">
            <tr><td className="px-3 py-2 font-bold text-(--accent-text)">label</td><td className="px-3 py-2 text-(--muted)">string</td><td className="px-3 py-2">Top label text</td></tr>
            <tr><td className="px-3 py-2 font-bold text-(--accent-text)">value</td><td className="px-3 py-2 text-(--muted)">string | number</td><td className="px-3 py-2">Primary metric value</td></tr>
            <tr><td className="px-3 py-2 font-bold text-(--accent-text)">badge</td><td className="px-3 py-2 text-(--muted)">string?</td><td className="px-3 py-2">Optional tag next to value</td></tr>
            <tr><td className="px-3 py-2 font-bold text-(--accent-text)">badgeTone</td><td className="px-3 py-2 text-(--muted)">BadgeTone?</td><td className="px-3 py-2">Badge color tone (default: neutral)</td></tr>
            <tr><td className="px-3 py-2 font-bold text-(--accent-text)">sub</td><td className="px-3 py-2 text-(--muted)">string?</td><td className="px-3 py-2">Secondary description text</td></tr>
            <tr><td className="px-3 py-2 font-bold text-(--accent-text)">chart</td><td className="px-3 py-2 text-(--muted)">ReactNode?</td><td className="px-3 py-2">Chart rendered flush to bottom border</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
