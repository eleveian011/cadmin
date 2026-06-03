// @ts-nocheck
import { useState } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { Trash2 } from 'lucide-react'
import { CdsButton, CdsInlineStatus, CdsModal, CdsDialog, CdsTooltip, CdsNotificationBar, useToast } from '../../../components/cds'

export default function UikitFeedbackSection() {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [modalClose, setModalClose] = useState(false)
  const [modalBackClose, setModalBackClose] = useState(false)
  const [modalSingle, setModalSingle] = useState(false)
  const [modalDouble, setModalDouble] = useState(false)
  const [modalLink, setModalLink] = useState(false)
  const [modalSplit, setModalSplit] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <section className="space-y-6">
      <h3 className="type-body font-semibold text-(--text)">Feedback</h3>

      {/* Dialog */}
      <div className="space-y-2">
        <p className="type-caption font-semibold text-(--muted)">Dialog</p>
        <CdsButton onClick={() => setOpen(true)}>Open dialog</CdsButton>
      </div>

      <Dialog open={open} onClose={setOpen} className="relative z-1200">
        <div className="fixed inset-0 z-1200 bg-(--overlay-backdrop)" aria-hidden="true" />
        <div className="fixed inset-0 z-1210 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md rounded-xl border border-(--border) bg-(--surface) p-6 shadow-(--shadow-overlay)">
            <DialogTitle className="type-h4 font-semibold text-(--text)">Confirm action</DialogTitle>
            <p className="mt-2 type-body text-(--muted)">Are you sure you want to proceed? This is a sample dialog.</p>
            <div className="mt-5 flex justify-end gap-2">
              <CdsButton variant="secondary" onClick={() => setOpen(false)}>Cancel</CdsButton>
              <CdsButton onClick={() => setOpen(false)}>Confirm</CdsButton>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Toast */}
      <div className="space-y-2">
        <p className="type-caption font-semibold text-(--muted)">Toast — top-center notification (2.5s auto-dismiss)</p>
        <CdsButton size="sm" variant="subtle" onClick={() => toast.show('This is a toast notification')}>Show Toast</CdsButton>
      </div>

      {/* Tooltip */}
      <div className="space-y-2">
        <p className="type-caption font-semibold text-(--muted)">CdsTooltip</p>
        <div className="flex flex-wrap gap-4">
          <CdsTooltip content="This is a top tooltip"><CdsButton size="sm" variant="subtle">Hover me (top)</CdsButton></CdsTooltip>
          <CdsTooltip content="This is a bottom tooltip" position="bottom"><CdsButton size="sm" variant="subtle">Hover me (bottom)</CdsButton></CdsTooltip>
          <CdsTooltip content="Tooltips can contain longer text to explain a feature or provide context."><span className="type-body-sm text-(--accent) underline cursor-pointer">What is this?</span></CdsTooltip>
        </div>
      </div>

      {/* Table Row States */}
      <div className="space-y-2">
        <p className="type-caption font-semibold text-(--muted)">Table Row States</p>
        <div className="rounded-lg border border-(--border) overflow-hidden divide-y divide-(--border)">
          <CdsInlineStatus status="loading" />
          <CdsInlineStatus status="error" onRetry={() => alert('Retry clicked')} />
          <CdsInlineStatus status="complete" />
        </div>
      </div>

      {/* CdsModal */}
      <div className="space-y-2">
        <p className="type-caption font-semibold text-(--muted)">CdsModal — header modes + footer variants</p>
        <div className="flex flex-wrap gap-2">
          <CdsButton size="sm" variant="subtle" onClick={() => setModalClose(true)}>Header: close</CdsButton>
          <CdsButton size="sm" variant="subtle" onClick={() => setModalBackClose(true)}>Header: back + close</CdsButton>
          <CdsButton size="sm" variant="subtle" onClick={() => setModalSingle(true)}>Footer: 1 button</CdsButton>
          <CdsButton size="sm" variant="subtle" onClick={() => setModalDouble(true)}>Footer: CTA + sub-action</CdsButton>
          <CdsButton size="sm" variant="subtle" onClick={() => setModalLink(true)}>Footer: button + link</CdsButton>
          <CdsButton size="sm" variant="subtle" onClick={() => setModalSplit(true)}>Wide: custom header + split body (2xl)</CdsButton>
        </div>
      </div>

      <CdsModal open={modalClose} onClose={() => setModalClose(false)} title="Close only" size="sm">
        <p className="type-body text-(--muted)">Header with close button only.</p>
      </CdsModal>
      <CdsModal open={modalBackClose} onClose={() => setModalBackClose(false)} onBack={() => alert('back')} headerMode="back-close" title="Back + Close" size="sm">
        <p className="type-body text-(--muted)">Header with back and close buttons.</p>
      </CdsModal>
      <CdsModal open={modalSingle} onClose={() => setModalSingle(false)} title="Single button" size="sm" footer={[{ label: 'Confirm', onClick: () => setModalSingle(false) }]}>
        <p className="type-body text-(--muted)">Footer with one full-width button.</p>
      </CdsModal>
      <CdsModal open={modalDouble} onClose={() => setModalDouble(false)} title="CTA + sub-action" size="sm" footer={[{ label: 'Confirm', onClick: () => setModalDouble(false) }, { label: 'Cancel', onClick: () => setModalDouble(false) }]}>
        <p className="type-body text-(--muted)"><code className="type-body-sm">footer[0]</code> is the full-width primary CTA; <code className="type-body-sm">footer[1+]</code> render as centered text links below it (same treatment as <code className="type-body-sm">footerLink</code>) for a lighter footer.</p>
      </CdsModal>
      <CdsModal open={modalLink} onClose={() => setModalLink(false)} title="Button + link" size="sm" footer={[{ label: 'Submit', onClick: () => setModalLink(false) }]} footerLink={{ label: 'Skip this step', onClick: () => setModalLink(false) }}>
        <p className="type-body text-(--muted)">Footer with button and text link below.</p>
      </CdsModal>

      {/* size="2xl" (920px) + custom header slot + bodyClassName takes over padding/overflow for a split layout */}
      <CdsModal
        open={modalSplit}
        onClose={() => setModalSplit(false)}
        size="2xl"
        className="h-[480px]"
        header={
          <div className="flex flex-col">
            <span className="type-h5 font-semibold text-(--text)">Custom header slot</span>
            <span className="type-caption text-(--muted)">Pass any node as `header` — the X close button stays</span>
          </div>
        }
        bodyClassName="flex p-0 overflow-hidden"
      >
        <div className="w-56 shrink-0 overflow-y-auto border-r border-(--border) p-3">
          <p className="type-caption font-semibold uppercase text-(--subtle)">Left panel</p>
          <p className="mt-2 type-body-sm text-(--muted)">bodyClassName = "flex p-0 overflow-hidden" lets the body host a split layout.</p>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <p className="type-body text-(--muted)">Right detail pane. Panel height controlled via `className="h-[480px]"`, width via `size="2xl"` (920px).</p>
        </div>
      </CdsModal>

      {/* CdsDialog */}
      <div className="space-y-2">
        <p className="type-caption font-semibold text-(--muted)">CdsDialog — centered confirmation (icon + title + description + full-width CTA + centered text-link sub-action, with extra spacing before the action zone). Layers above modals/drawers (z-1300).</p>
        <CdsButton size="sm" variant="subtle" onClick={() => setDialogOpen(true)}>Open destructive dialog</CdsButton>
      </div>

      <CdsDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        tone="danger"
        icon={<Trash2 />}
        title="Delete this address?"
        description="This will permanently remove the saved beneficiary. This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={() => setDialogOpen(false)}
        cancelLabel="Cancel"
        onCancel={() => setDialogOpen(false)}
      />

      {/* Notification Bar */}
      <div className="space-y-2">
        <p className="type-caption font-semibold text-(--muted)">CdsNotificationBar — 4 tones</p>
        <div className="flex flex-col gap-2">
          <CdsNotificationBar tone="neutral">Neutral: general information message</CdsNotificationBar>
          <CdsNotificationBar tone="info">Info: operation completed successfully</CdsNotificationBar>
          <CdsNotificationBar tone="warning">Warning: please review before proceeding</CdsNotificationBar>
          <CdsNotificationBar tone="danger">Danger: sender on sanctions list (OFAC SDN)</CdsNotificationBar>
        </div>
      </div>
    </section>
  )
}
