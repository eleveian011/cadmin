// Fiat deposit order — domain model

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

export type AnomalousReason =
  | 'unidentified'
  | 'status_exception'
  | 'classification'
  | 'missing_fields'
  | 'screening_review'

export type PaymentChannel = 'GLDB' | 'SGB' | 'TransferMate' | 'Tazapay'

export type PartyClassification = '1st_party' | '3rd_party' | 'unclassified'

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
  payment_channel:      PaymentChannel
  amount_minor:         number
  currency:             string
  status:               DepositStatus
  anomalous_reason?:    AnomalousReason
  party_classification: PartyClassification
  // Task Center integration
  task_center_id:       string | null
  // Sender
  sender_name:          string | null
  sender_account:       string | null
  sender_bank_swift:    string | null
  sender_bank_name:     string | null
  sender_country:       string | null
  // Beneficiary
  beneficiary_name:     string | null
  beneficiary_account:  string | null
  beneficiary_code:     string | null
  // Matching
  reference_code:       string | null
  matched_rule_step:    number | null
  // Settlement
  value_date:           string | null
  credit_date:          string | null
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
