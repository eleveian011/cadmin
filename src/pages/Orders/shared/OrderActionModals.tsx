// @ts-nocheck
import { useState } from 'react'
import { useMarkDepositRefunded } from '../../../services/hooks'
import { CdsModal, CdsInput, CdsTextarea, useToast } from '../../../components/cds'
import { fmtAmount, fmtDay } from './helpers'

/* ─── Mark Refunded modal (PRD §7.7.8) ──────────────────────── */

export function MarkRefundedModal({ order, open, onClose, t }) {
  const toast      = useToast()
  const markRefund = useMarkDepositRefunded()
  const [orderNo, setOrderNo] = useState('')
  const [date,    setDate]    = useState(fmtDay(new Date()))
  const [notes,   setNotes]   = useState('')

  const reset = () => { setOrderNo(''); setDate(fmtDay(new Date())); setNotes('') }
  const valid = orderNo.trim() && date

  const handleConfirm = () => {
    if (!valid) return
    markRefund.mutateAsync({
      id: order.id,
      refund_order_number: orderNo.trim(),
      refund_date: date,
      refund_notes: notes.trim() || undefined,
    })
      .then(() => { toast.show(t('depositOrder.toast.refundMarked')); reset(); onClose() })
      .catch(e => toast.show(e?.message || 'Failed to mark refunded'))
  }

  return (
    <CdsModal
      open={open}
      onClose={() => { reset(); onClose() }}
      size="md"
      headerMode="close"
      title={t('depositOrder.actions.markRefunded')}
      footer={[{ label: t('depositOrder.refund.confirm'), onClick: handleConfirm, loading: markRefund.isPending, disabled: !valid }]}
      dismissOnBackdrop
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-md bg-(--fill) px-3 py-2 type-body-sm text-(--muted)">
          {t('depositOrder.refund.intro')}
        </div>
        <div className="flex flex-col gap-3">
          <div className="type-body-sm text-(--muted)">
            {t('depositOrder.col.transactionId')}: <span className="text-(--text) font-medium">{order?.transaction_id}</span>
            <span className="mx-2">·</span>
            {fmtAmount(order?.amount_minor ?? 0)} {order?.currency}
          </div>
          <div>
            <label className="type-caption font-semibold text-(--text) mb-1 block">
              {t('depositOrder.refund.orderNumber')} <span className="text-(--danger)">*</span>
            </label>
            <CdsInput value={orderNo} onChange={e => setOrderNo(e.target.value)} onClear={() => setOrderNo('')} placeholder="RFND-…" size="md" />
          </div>
          <div>
            <label className="type-caption font-semibold text-(--text) mb-1 block">
              {t('depositOrder.refund.date')} <span className="text-(--danger)">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full rounded-md border border-(--border) bg-(--surface) px-3 py-2 type-body text-(--text) outline-none focus:border-(--accent)"
            />
          </div>
          <div>
            <label className="type-caption font-semibold text-(--text) mb-1 block">{t('depositOrder.refund.notes')}</label>
            <CdsTextarea value={notes} onChange={setNotes} placeholder={t('depositOrder.refund.notesPlaceholder')} />
          </div>
        </div>
      </div>
    </CdsModal>
  )
}
