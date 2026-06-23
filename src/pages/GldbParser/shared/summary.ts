// @ts-nocheck
// Manual Booking Summary builder (§6.4) — produces a labelled field list Ops can
// copy line-by-line (or all at once) into the booking workflow. Static placeholder
// values ("to be determined" / "to be calculated by the system" / "Paid by Me")
// are intentional — they're filled later by the system or Ops.
import { formatAmount, lookupKeyOf } from './parse'

export interface SummaryRow { label: string; value: string }

/** Build the ordered booking-summary rows from the webhook + payee match. */
export function buildSummaryRows(payload, matches, t): SummaryRow[] {
  const na = (v) => (v && String(v).trim() ? String(v) : t('gldbParser.notProvided'))
  const acct = lookupKeyOf(payload)
  const currency = payload.currencyTypeCd?.trim()
  const amount = formatAmount(payload.amount).text
  const accountType = matches.length
    ? `${t(`channelAccount.accountType.${matches[0].account_type}`)} ${t('gldbParser.booking.accountWord')}`
    : t('gldbParser.booking.payeeNotIdentified')

  return [
    { label: t('gldbParser.booking.account'),              value: accountType },
    { label: t('gldbParser.booking.currency'),             value: na(currency) },
    { label: t('gldbParser.booking.serviceFees'),          value: t('gldbParser.booking.paidByMe') },
    { label: t('gldbParser.booking.amountSent'),           value: amount ? `${amount}${currency ? ' ' + currency : ''}` : t('gldbParser.notProvided') },
    { label: t('gldbParser.booking.coboFeeRate'),          value: t('gldbParser.booking.toBeDetermined') },
    { label: t('gldbParser.booking.serviceFees'),          value: t('gldbParser.booking.toBeCalculated') },
    { label: t('gldbParser.booking.amountReceived'),       value: t('gldbParser.booking.toBeCalculated') },
    { label: t('gldbParser.booking.transactionReference'), value: na(payload.paymentRef) },
    { label: t('gldbParser.booking.purposeOfDeposit'),     value: na(payload.remark) },
    { label: t('gldbParser.booking.destinationLabel'),     value: na(acct) },
  ]
}

/** Flatten rows to copyable text ("Label: Value" per line) for the Copy-all button. */
export function summaryRowsToText(rows: SummaryRow[]): string {
  return rows.map(r => `${r.label}: ${r.value}`).join('\n')
}
