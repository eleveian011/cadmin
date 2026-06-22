// @ts-nocheck
// Human-readable summary builder + copy-to-clipboard text (§6.4).
import type { GldbWebhookPayload } from '../../../types/gldb-webhook'
import type { ChannelAccount } from '../../../types/channel-account'
import { formatAmount, formatYmd, lookupKeyOf } from './parse'

/** Build the plain-text "Manual Booking Summary" Ops can paste into Lark (§6.4). */
export function buildSummaryText(
  payload: GldbWebhookPayload,
  matches: ChannelAccount[],
): string {
  const acct = lookupKeyOf(payload) ?? '(not provided)'
  const amount = formatAmount(payload.amount).text ?? '(not provided)'
  const na = (v?: string | null) => (v && String(v).trim() ? String(v) : '(not provided)')

  const lines: string[] = []
  lines.push('═══════════════════════════════════════════')
  lines.push('  GLDB Deposit — Manual Booking Summary')
  lines.push('═══════════════════════════════════════════')
  lines.push(`  Transaction ID    : ${na(payload.eventReference)}`)
  lines.push(`  Sender            : ${na(payload.senderAcctNm)} (${na(payload.senderAcctNo)})`)
  lines.push(`  Amount            : ${amount} ${na(payload.currencyTypeCd)}`)
  lines.push(`  Value Date        : ${formatYmd(payload.valueDate) ?? '(not provided)'}`)
  lines.push(`  Trade Date        : ${formatYmd(payload.tradeDate) ?? '(not provided)'}`)
  lines.push(`  Payment Ref       : ${na(payload.paymentRef)}`)
  lines.push(`  Receiving Account : ${acct} (${na(payload.receiverAcctNm)})`)
  lines.push(`  Bank Code         : ${na(payload.receiverBankCd)}`)
  lines.push(`  Source            : ${na(payload.source)}`)
  lines.push('')

  if (matches.length === 0) {
    lines.push('  ┌─ Payee: NOT FOUND ─────────────────────┐')
    lines.push(`  Account Searched  : ${acct}`)
    lines.push('  No mapping entry found for this account number.')
    lines.push('')
    lines.push('  Action Items:')
    lines.push('  - Investigate the account number / check GLDB portal')
    lines.push(`  - Sender name   : ${na(payload.senderAcctNm)}`)
    lines.push(`  - Receiver name : ${na(payload.receiverAcctNm)}`)
    lines.push('  - After identifying the payee, update the Mapping Table')
    return lines.join('\n')
  }

  matches.forEach((m, i) => {
    const head = matches.length > 1 ? `  ┌─ Payee Match ${i + 1} of ${matches.length} ──────────────┐` : '  ┌─ Payee: FOUND ─────────────────────────┐'
    lines.push(head)
    lines.push(`  Client Name       : ${m.client_name}`)
    lines.push(`  Participant Code  : ${m.participant_code ?? '(not provided)'}`)
    lines.push(`  User Channel Acct : ${m.user_channel_account_number}`)
    lines.push(`  Account Type      : ${m.account_type === 'fiat' ? 'Fiat' : 'Investment Fiat'}`)
    lines.push(`  Reference Code    : ${m.reference_code ?? '(none)'}`)
    lines.push(`  Status            : Participant ${m.participant_status} / Member ${m.member_status}`)
    lines.push('')
  })

  lines.push('  Action Items:')
  if (matches.length > 1) {
    lines.push('  - Multiple Account Types matched — select the correct one based on deposit context')
  }
  lines.push('  - Proceed to CAMP Admin → Manual Booking')
  lines.push(`  - Credit to: ${matches[0].client_name} (${matches[0].participant_code ?? '—'})`)
  return lines.join('\n')
}
