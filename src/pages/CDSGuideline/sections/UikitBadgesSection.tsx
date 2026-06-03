// @ts-nocheck
import { CheckCircle, AlertTriangle, AlertOctagon, Info, Bookmark } from 'lucide-react'
import { CdsBadge, CdsStatusTag } from '../../../components/cds'

export default function UikitBadgesSection() {
  return (
    <section className="space-y-5">
      <h3 className="type-body font-semibold text-(--text)">Badges</h3>

      <div className="space-y-3">
        <p className="type-caption font-medium text-(--muted)">Tones</p>
        <div className="flex flex-wrap gap-2">
          <CdsBadge tone="neutral">Neutral</CdsBadge>
          <CdsBadge tone="primary">Primary</CdsBadge>
          <CdsBadge tone="success">Success</CdsBadge>
          <CdsBadge tone="warning">Warning</CdsBadge>
          <CdsBadge tone="danger">Danger</CdsBadge>
          <CdsBadge tone="info">Info</CdsBadge>
        </div>
      </div>

      <div className="space-y-3">
        <p className="type-caption font-medium text-(--muted)">Soft</p>
        <div className="flex flex-wrap gap-2">
          <CdsBadge tone="neutral" soft>Neutral</CdsBadge>
          <CdsBadge tone="primary" soft>Primary</CdsBadge>
          <CdsBadge tone="success" soft>Success</CdsBadge>
          <CdsBadge tone="warning" soft>Warning</CdsBadge>
          <CdsBadge tone="danger" soft>Danger</CdsBadge>
          <CdsBadge tone="info" soft>Info</CdsBadge>
        </div>
      </div>

      <div className="space-y-3">
        <p className="type-caption font-medium text-(--muted)">With icon</p>
        <div className="flex flex-wrap gap-2">
          <CdsBadge tone="neutral" icon={<Bookmark />}>Default</CdsBadge>
          <CdsBadge tone="primary" icon={<Bookmark />}>Primary</CdsBadge>
          <CdsBadge tone="success" icon={<CheckCircle />}>Success</CdsBadge>
          <CdsBadge tone="warning" icon={<AlertTriangle />}>Warning</CdsBadge>
          <CdsBadge tone="danger" icon={<AlertOctagon />}>Danger</CdsBadge>
          <CdsBadge tone="info" icon={<Info />}>Info</CdsBadge>
        </div>
      </div>

      {/* CdsStatusTag */}
      <div className="space-y-2">
        <p className="type-caption font-medium text-(--muted)">CdsStatusTag — diamond indicator</p>
        <div className="flex flex-wrap gap-4">
          <CdsStatusTag tone="neutral">Pending</CdsStatusTag>
          <CdsStatusTag tone="primary">In Progress</CdsStatusTag>
          <CdsStatusTag tone="success">Completed</CdsStatusTag>
          <CdsStatusTag tone="warning">Awaiting</CdsStatusTag>
          <CdsStatusTag tone="danger">Abnormal</CdsStatusTag>
        </div>
      </div>
    </section>
  )
}
