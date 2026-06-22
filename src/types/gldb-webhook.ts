/**
 * GLDB Webhook Parser types (GLDB Webhook Parser & Payee Lookup Tool PRD §6.1).
 *
 * Models the raw GLDB deposit webhook payload, the parsed/labelled field set the
 * Ops UI displays, and the payee-lookup result against the Fiat Account Mapping
 * Reference Table (§6.2). Phase 1 only — same-name verification (§6.3) is deferred.
 */
import type { ChannelAccount } from './channel-account'

/** Raw GLDB webhook payload (Appendix A). All fields are strings as received. */
export interface GldbWebhookPayload {
  acctNo?:          string
  receiverAcctNo?:  string
  receiverAcctNm?:  string
  receiverBankCd?:  string
  amount?:          string
  currencyTypeCd?:  string
  direction?:       string
  senderAcctNm?:    string
  senderAcctNo?:    string
  senderBankCd?:    string
  paymentRef?:      string
  remark?:          string
  valueDate?:       string
  tradeDate?:       string
  tradeTime?:       string
  eventReference?:  string
  coreTradeSerlNo?: string
  source?:          string
}

/** One displayed field after parsing: a label, the value (or null = "not provided"). */
export interface ParsedField {
  key:      keyof GldbWebhookPayload
  label:    string
  /** Display-ready value; null renders as "(not provided)" in grey. */
  value:    string | null
  /** Optional note shown beside the value (e.g. a currency warning). */
  warning?: string
}

/** Outcome of parsing the pasted JSON. */
export interface ParseResult {
  ok:       boolean
  /** Parse error message (invalid JSON or missing required fields) when !ok. */
  error?:   string
  /** The raw parsed object (present when JSON was syntactically valid). */
  payload?: GldbWebhookPayload
  /** Labelled display fields (present when ok). */
  fields?:  ParsedField[]
  /** The account number used as the lookup key (acctNo, falling back to receiverAcctNo). */
  lookupAccountNo?: string | null
}

/** Match confidence for the payee lookup (§6.2). */
export type MatchConfidence = 'exact' | 'multiple' | 'none'

/** Payee lookup result against the Fiat Account Mapping Reference Table. */
export interface PayeeLookupResult {
  confidence:   MatchConfidence
  /** Account number that was searched. */
  searchedAccountNo: string
  /** Matched mapping entries (0, 1, or many). */
  matches:      ChannelAccount[]
}
