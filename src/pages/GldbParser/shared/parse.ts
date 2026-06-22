// Pure parsing + formatting helpers for the GLDB Webhook Parser (§6.1).
// Deterministic, no side effects — mirrors the "no AI" rationale in the PRD.
import type {
  GldbWebhookPayload, ParsedField, ParseResult,
} from '../../../types/gldb-webhook'

/** Field display order + labels (PRD §6.1 "Displayed Fields" table). */
const FIELD_LABELS: { key: keyof GldbWebhookPayload; label: string }[] = [
  { key: 'acctNo',          label: 'Receiving Account No' },
  { key: 'receiverAcctNm',  label: 'Receiving Account Name' },
  { key: 'receiverBankCd',  label: 'Receiving Bank Code' },
  { key: 'amount',          label: 'Amount' },
  { key: 'currencyTypeCd',  label: 'Currency' },
  { key: 'direction',       label: 'Direction' },
  { key: 'senderAcctNm',    label: 'Sender Name' },
  { key: 'senderAcctNo',    label: 'Sender Account No' },
  { key: 'senderBankCd',    label: 'Sender Bank Code' },
  { key: 'paymentRef',      label: 'Payment Reference' },
  { key: 'remark',          label: 'Remark' },
  { key: 'valueDate',       label: 'Value Date' },
  { key: 'tradeDate',       label: 'Trade Date' },
  { key: 'tradeTime',       label: 'Trade Time' },
  { key: 'eventReference',  label: 'Event Reference' },
  { key: 'coreTradeSerlNo', label: 'Core Trade Serial No' },
  { key: 'source',          label: 'Source' },
]

/** Minimal ISO-4217 set for the unknown-currency warning (extend as needed). */
const KNOWN_CURRENCIES = new Set([
  'USD', 'SGD', 'EUR', 'GBP', 'JPY', 'CNY', 'CNH', 'HKD', 'AUD', 'IDR',
  'MYR', 'THB', 'PHP', 'VND', 'INR', 'KRW', 'CHF', 'CAD', 'NZD', 'AED',
])

/** YYYYMMDD → YYYY-MM-DD. Returns the input unchanged if it doesn't match. */
export function formatYmd(raw: string | undefined | null): string | null {
  if (!raw) return null
  const m = /^(\d{4})(\d{2})(\d{2})$/.exec(raw.trim())
  if (!m) return raw
  return `${m[1]}-${m[2]}-${m[3]}`
}

/** Format a numeric amount string with thousand separators + 2 decimals. */
export function formatAmount(raw: string | undefined | null): { text: string | null; valid: boolean } {
  if (raw == null || String(raw).trim() === '') return { text: null, valid: true }
  const n = Number(raw)
  if (!Number.isFinite(n)) return { text: String(raw), valid: false }
  return { text: n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), valid: true }
}

/** Direction code → human label. */
function formatDirection(raw: string | undefined | null): string | null {
  if (!raw) return null
  const v = raw.trim().toUpperCase()
  if (v === 'I') return 'Inward (I)'
  if (v === 'O') return 'Outward (O)'
  return raw
}

/** The account number used to look up the payee: acctNo, falling back to receiverAcctNo. */
export function lookupKeyOf(p: GldbWebhookPayload): string | null {
  return (p.acctNo?.trim() || p.receiverAcctNo?.trim() || null)
}

/**
 * Parse a pasted GLDB webhook JSON string into labelled display fields (§6.1).
 * Returns { ok:false, error } for invalid JSON or missing required fields.
 */
export function parseWebhook(input: string): ParseResult {
  const text = input.trim()
  if (!text) return { ok: false, error: 'empty' }

  let payload: GldbWebhookPayload
  try {
    payload = JSON.parse(text)
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Invalid JSON' }
  }
  if (typeof payload !== 'object' || payload == null || Array.isArray(payload)) {
    return { ok: false, error: 'Payload must be a JSON object.' }
  }

  // Required fields (§6.1): at minimum acctNo (or receiverAcctNo) and senderAcctNm.
  const lookupAccountNo = lookupKeyOf(payload)
  if (!lookupAccountNo) {
    return { ok: false, error: 'missing-account', payload }
  }
  if (!payload.senderAcctNm?.trim()) {
    return { ok: false, error: 'missing-sender', payload }
  }

  const amount = formatAmount(payload.amount)
  const currency = payload.currencyTypeCd?.trim()
  const currencyWarn = currency && !KNOWN_CURRENCIES.has(currency.toUpperCase())
    ? 'unknown-currency' : undefined

  const fields: ParsedField[] = FIELD_LABELS.map(({ key, label }) => {
    let value: string | null
    let warning: string | undefined

    switch (key) {
      case 'acctNo':
        value = lookupAccountNo
        break
      case 'amount':
        value = amount.text
        if (!amount.valid) warning = 'invalid-amount'
        break
      case 'currencyTypeCd':
        value = currency || null
        warning = currencyWarn
        break
      case 'direction':
        value = formatDirection(payload.direction)
        break
      case 'valueDate':
      case 'tradeDate':
        value = formatYmd(payload[key])
        break
      default: {
        const raw = payload[key]
        value = raw != null && String(raw).trim() !== '' ? String(raw) : null
      }
    }
    return { key, label, value, warning }
  })

  return { ok: true, payload, fields, lookupAccountNo }
}

/** A ready-to-paste sample webhook (PRD Appendix A) for the "load sample" toggle. */
export const SAMPLE_WEBHOOK = JSON.stringify(
  {
    acctNo: '11020018879',
    amount: '4000617.16',
    coreTradeSerlNo: '0209131107FF',
    currencyTypeCd: 'USD',
    direction: 'I',
    eventReference: '8597a46f-4852-4f56-b6c5-b6bb3d5265bd',
    paymentRef: 'SGL26107FKFBLDCC',
    receiverAcctNm: 'METACOMP PTE. LTD.',
    receiverAcctNo: '11020018879',
    receiverBankCd: 'GLDTSGSG',
    remark: 'OPENFX - 7138496A-6323-4AD8-8179-5FF4C834C6F8',
    senderAcctNm: 'RED ENVELOPE ALPHA INC',
    senderAcctNo: '4395608',
    senderBankCd: '',
    source: 'SWIFTMX',
    tradeDate: '20260417',
    tradeTime: '203810598',
    valueDate: '20260420',
  },
  null,
  2,
)
