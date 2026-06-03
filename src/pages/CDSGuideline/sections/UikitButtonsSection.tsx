// @ts-nocheck
import { ArrowRight } from 'lucide-react'
import { CdsButton, CdsCopyButton } from '../../../components/cds'

export default function UikitButtonsSection() {
  return (
    <section className="space-y-6">
      <h3 className="type-body font-semibold text-(--text)">Buttons</h3>

      {/* Sizes */}
      <div className="space-y-3">
        <p className="type-caption font-medium text-(--muted)">Sizes</p>
        <div className="flex flex-wrap items-center gap-2">
          <CdsButton size="xs">24px</CdsButton>
          <CdsButton size="sm">32px</CdsButton>
          <CdsButton size="md">40px</CdsButton>
          <CdsButton size="lg">48px</CdsButton>
        </div>
      </div>

      {/* Weights */}
      <div className="space-y-3">
        <p className="type-caption font-medium text-(--muted)">Weights</p>
        <div className="flex flex-wrap items-center gap-2">
          <CdsButton variant="subtle" weight="bold">Bold (default)</CdsButton>
          <CdsButton variant="subtle" weight="normal">Normal</CdsButton>
        </div>
      </div>

      {/* Primary — all states */}
      <div className="space-y-3">
        <p className="type-caption font-medium text-(--muted)">Primary</p>
        <div className="flex flex-wrap items-center gap-2">
          <CdsButton>Default</CdsButton>
          <CdsButton loading>Default</CdsButton>
          <CdsButton disabled>Disabled</CdsButton>
          <CdsButton icon={<ArrowRight size={14} />} iconPosition="right">Right icon</CdsButton>
        </div>
      </div>

      {/* Secondary — all states */}
      <div className="space-y-3">
        <p className="type-caption font-medium text-(--muted)">Secondary</p>
        <div className="flex flex-wrap items-center gap-2">
          <CdsButton variant="secondary">Default</CdsButton>
          <CdsButton variant="secondary" loading>Default</CdsButton>
          <CdsButton variant="secondary" disabled>Disabled</CdsButton>
          <CdsButton variant="secondary" icon={<ArrowRight size={14} />} iconPosition="right">Right icon</CdsButton>
        </div>
      </div>

      {/* Ghost — all states */}
      <div className="space-y-3">
        <p className="type-caption font-medium text-(--muted)">Ghost</p>
        <div className="flex flex-wrap items-center gap-2">
          <CdsButton variant="ghost">Default</CdsButton>
          <CdsButton variant="ghost" loading>Default</CdsButton>
          <CdsButton variant="ghost" disabled>Disabled</CdsButton>
          <CdsButton variant="ghost" icon={<ArrowRight size={14} />} iconPosition="right">Right icon</CdsButton>
        </div>
      </div>

      {/* Subtle — all states */}
      <div className="space-y-3">
        <p className="type-caption font-medium text-(--muted)">Subtle</p>
        <div className="flex flex-wrap items-center gap-2">
          <CdsButton variant="subtle">Default</CdsButton>
          <CdsButton variant="subtle" loading>Default</CdsButton>
          <CdsButton variant="subtle" disabled>Disabled</CdsButton>
          <CdsButton variant="subtle" icon={<ArrowRight size={14} />} iconPosition="right">Right icon</CdsButton>
          <span className="relative inline-flex">
            <CdsButton variant="subtle">Notifications</CdsButton>
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-(--danger) px-1 type-caption font-bold text-white">3</span>
          </span>
          <span className="relative inline-flex">
            <CdsButton variant="subtle">Messages</CdsButton>
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-(--danger)" />
          </span>
        </div>
      </div>

      {/* Text — all states */}
      <div className="space-y-3">
        <p className="type-caption font-medium text-(--muted)">Text</p>
        <div className="flex flex-wrap items-center gap-2">
          <CdsButton variant="text">Default</CdsButton>
          <CdsButton variant="text" loading>Default</CdsButton>
          <CdsButton variant="text" disabled>Disabled</CdsButton>
          <CdsButton variant="text" icon={<ArrowRight size={14} />} iconPosition="right">Text icon</CdsButton>
        </div>
      </div>

      {/* Inverse — for use on accent / colored backgrounds */}
      <div className="space-y-3">
        <p className="type-caption font-medium text-(--muted)">Inverse — outlined button for accent / colored backgrounds</p>
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-linear-to-br from-(--accent) to-(--accent-secondary) p-4">
          <CdsButton variant="inverse">Default</CdsButton>
          <CdsButton variant="inverse" loading>Default</CdsButton>
          <CdsButton variant="inverse" disabled>Disabled</CdsButton>
          <CdsButton variant="inverse" icon={<ArrowRight size={14} />} iconPosition="right">Right icon</CdsButton>
        </div>
      </div>

      {/* CdsCopyButton */}
      <div className="space-y-2">
        <p className="type-caption font-semibold text-(--muted)">CdsCopyButton — click to copy with toast</p>
        <div className="flex items-center gap-4">
          <span className="type-body text-(--text)">SG8012345678901</span>
          <CdsCopyButton text="SG8012345678901" />
        </div>
      </div>
    </section>
  )
}
