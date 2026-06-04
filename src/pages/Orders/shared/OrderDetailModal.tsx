// @ts-nocheck
import { CdsModal, CdsBadge, CdsStatusTag, CdsCopyButton } from '../../../components/cds'
import { STATUS_TONE, fmtAmount, fmtDate } from './helpers'

/**
 * Read-only full detail of a deposit order (PRD §7.11 detail view).
 * Dense 4-per-row grid of fields, grouped by section. No edit/action controls —
 * operations live in the row actions menu to avoid duplicate entry points.
 */

/** One label/value cell. `span` widens it across the 4-col grid (e.g. remarks). */
function Field({ label, value, copyText, span = 1 }) {
  const empty = value == null || value === ''
  const colSpan = span === 4 ? 'col-span-4' : span === 2 ? 'col-span-2' : 'col-span-1'
  return (
    <div className={`flex flex-col gap-0.5 min-w-0 ${colSpan}`}>
      <span className="type-caption text-(--muted)">{label}</span>
      <span className="type-body text-(--text) inline-flex items-center gap-1 wrap-break-word">
        {empty ? <span className="text-(--subtle)">—</span> : value}
        {!empty && copyText && <CdsCopyButton text={copyText} />}
      </span>
    </div>
  )
}

function Group({ title, children }) {
  return (
    <section>
      <div className="type-body-lg font-semibold text-(--text) mb-2.5">{title}</div>
      <div className="grid grid-cols-4 gap-x-4 gap-y-3">{children}</div>
    </section>
  )
}

export function OrderDetailModal({ order, open, onClose, t }) {
  if (!order) return null
  const statusKey = order.status.replaceAll('.', '_')

  return (
    <CdsModal open={open} onClose={onClose} size="2xl" headerMode="close" title={t('depositOrder.detail.title')} dismissOnBackdrop>
      <div className="flex flex-col gap-5">
        {/* Summary header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <span className="type-h4 font-semibold text-(--text) tabular-nums">{order.transaction_id}</span>
            <CdsCopyButton text={order.transaction_id} />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <CdsStatusTag tone={STATUS_TONE[order.status] ?? 'neutral'}>{t(`depositOrder.status.${statusKey}`)}</CdsStatusTag>
            {order.anomalous_reason && (
              <CdsBadge tone="neutral">{t(`depositOrder.anomalousReason.${order.anomalous_reason}`)}</CdsBadge>
            )}
          </div>
        </div>

        <Group title={t('depositOrder.detail.transaction')}>
          <Field label={t('depositOrder.col.amount')} value={`${fmtAmount(order.amount_minor)} ${order.currency}`} />
          <Field label={t('depositOrder.col.paymentChannel')} value={order.payment_channel} />
          <Field label={t('depositOrder.col.referenceCode')} value={order.reference_code} />
          <Field label={t('depositOrder.col.partyClassification')} value={t(`depositOrder.party.${order.party_classification}`)} />
        </Group>

        <Group title={t('depositOrder.detail.sender')}>
          <Field label={t('depositOrder.col.senderName')} value={order.sender_name} span={2} />
          <Field label={t('depositOrder.col.senderAccount')} value={order.sender_account} span={2} />
          <Field label={t('depositOrder.col.senderBankName')} value={order.sender_bank_name} />
          <Field label={t('depositOrder.col.senderSwift')} value={order.sender_bank_swift} />
          <Field label={t('depositOrder.col.senderCountry')} value={order.sender_country} />
        </Group>

        <Group title={t('depositOrder.detail.beneficiary')}>
          <Field label={t('depositOrder.col.beneficiaryName')} value={order.beneficiary_name} span={2} />
          <Field label={t('depositOrder.col.beneficiaryAccount')} value={order.beneficiary_account} span={2} />
          <Field label={t('depositOrder.col.beneficiaryCode')} value={order.beneficiary_code} />
          <Field label={t('depositOrder.col.beneficiaryBank')} value={order.beneficiary_bank_name} span={2} />
        </Group>

        <Group title={t('depositOrder.detail.matching')}>
          <Field label={t('depositOrder.col.status')} value={t(`depositOrder.status.${statusKey}`)} />
          {order.anomalous_reason && (
            <Field label={t('depositOrder.col.anomalousReason')} value={t(`depositOrder.anomalousReason.${order.anomalous_reason}`)} />
          )}
          <Field label={t('depositOrder.col.matchedRuleStep')} value={order.matched_rule_step != null ? `Step ${order.matched_rule_step}` : null} />
          <Field label={t('depositOrder.col.screeningResult')} value={order.screening_result ? t(`depositOrder.screening.${order.screening_result}`) : null} />
        </Group>

        <Group title={t('depositOrder.detail.settlement')}>
          <Field label={t('depositOrder.col.valueDate')} value={order.value_date} />
          <Field label={t('depositOrder.col.creditDate')} value={fmtDate(order.credit_date)} />
          <Field label={t('depositOrder.col.createdAt')} value={fmtDate(order.created_at)} />
          <Field label={t('depositOrder.detail.updatedAt')} value={fmtDate(order.updated_at)} />
          <Field label={t('depositOrder.col.opsHandler')} value={order.ops_handler} />
          <Field label={t('depositOrder.col.remarks')} value={order.remarks} span={4} />
        </Group>

        {order.refund_info && (
          <Group title={t('depositOrder.detail.refund')}>
            <Field label={t('depositOrder.refund.orderNumber')} value={order.refund_info.refund_order_number} />
            <Field label={t('depositOrder.refund.date')} value={order.refund_info.refund_date} />
            <Field label={t('taskCenter.drawer.refundMarkedBy')} value={order.refund_info.marked_by} />
            <Field label={t('depositOrder.refund.notes')} value={order.refund_info.refund_notes} span={4} />
          </Group>
        )}
      </div>
    </CdsModal>
  )
}
