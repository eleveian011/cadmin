// Fiat deposit order — domain model (PRD §7.12 orders schema, v0.2)

export type DepositStatus =
  | 'processing.auto'
  | 'processing.manual_review'
  | 'processing.deferred'
  | 'pending.rfi_missing_fields'
  | 'pending.rfi_screening'
  | 'successful'
  | 'failed'
  | 'refunding'
  | 'refunded'

/** Internal reason a deposit needs Ops attention (drives the Pending tab + Task Center). */
export type InternalReason =
  | 'unidentified'
  | 'status_exception'
  | 'classification'
  | 'missing_fields'
  | 'screening_review'

export type PaymentChannel = 'GLDB' | 'SGB' | 'TransferMate' | 'Tazapay'

/** Order type — only deposits exist today; reserved for future order kinds. */
export type OrderType = 'deposit'

/** Order category — internal (Ops query surface) vs excluded (ALF etc.). */
export type OrderCategory = 'internal' | 'excluded'

/** Bank transfer rail. */
export type BankTransferType = 'SWIFT' | 'FAST' | 'ACH' | 'SEPA' | 'FPS'

export type AccountType = 'fiat' | 'investment_fiat'

/** 1st / 3rd party classification (formerly party_classification). */
export type Classification = '1st_party' | '3rd_party' | 'unclassified'

export type ScreeningResult = 'pass' | 'pending_review' | 'rejected' | 'rfi'

/** Manual refund record (PRD §7.7.8 — Mark as Refunded for prolonged unclaimed deposits) */
export interface RefundInfo {
  refund_order_number: string
  refund_date:         string
  refund_notes:        string | null
  marked_by:           string
  marked_at:           string
}

export interface DepositOrder {
  id:                   string
  transaction_id:       string
  channel_transaction_id: string | null
  /** Order kind — currently always 'deposit'; reserved for future expansion. */
  order_type:           OrderType
  transaction_type:     string
  order_category:       OrderCategory
  bank_transfer_type:   BankTransferType | null
  payment_channel:      PaymentChannel
  channel_account_no:   string | null
  account_type:         AccountType
  amount_minor:         number
  currency:             string
  status:               DepositStatus
  sub_status:           string | null
  /** Internal reason for manual handling (formerly anomalous_reason). */
  internal_reason?:     InternalReason
  // Task Center integration
  task_center_id:       string | null
  // Sender (the external payer)
  sender_name:        string | null
  sender_account_no:  string | null
  sender_bank_name:   string | null
  sender_bank_swift_bic: string | null
  sender_bank_country: string | null
  sender_country:     string | null
  payment_reference:        string | null
  // Recipient (the MetaComp client receiving funds)
  recipient_name:     string | null
  recipient_account_no: string | null
  recipient_bank_name: string | null
  recipient_bank_swift_bic: string | null
  participant_code:     string | null
  // Matching
  reference_code:       string | null
  matched_rule_step:    number | null
  classification:       Classification
  // Settlement
  value_date:           string | null
  credit_date:          string | null
  credited_amount_minor: number | null
  credited_currency:    string | null
  channel_fee_amount_minor: number | null
  channel_fee_currency: string | null
  service_fee_amount_minor: number | null
  service_fee_currency: string | null
  // Compliance
  screening_result:     ScreeningResult | null
  // Ops
  ops_handler:          string | null
  remarks:              string | null
  /** Manual refund record — set when Ops marks an unclaimed deposit refunded (§7.7.8) */
  refund_info?:         RefundInfo | null
  // Timestamps
  created_at:           string
  updated_at:           string
}
