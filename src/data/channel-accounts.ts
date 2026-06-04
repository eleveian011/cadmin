import type { ChannelAccount } from '../types/channel-account'

/**
 * Fiat Account Mapping Reference Table seed (PRD §7.4).
 *
 * Maps payment-channel account numbers → CAMP client accounts (MCA), with client
 * identity, account status (allowlist: only `active` auto-credits), and bank info.
 * Covers all channels, both account types, Named VAs (null reference code), and
 * status exceptions (initial / suspended / closed) so the table page can exercise
 * its colour-coded exception states.
 *
 * In a real system this is sourced from CAMP + channel webhooks; here it is a
 * static fixture mutated in-memory by the store.
 */

function daysAgo(n: number, offsetHours = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(d.getHours() - offsetHours)
  return d.toISOString()
}

const ACTOR = { id: 'ops_002', name: 'Alex Chen' }

/** Build a single creation-history entry `n` days ago. */
function created(n: number) {
  return [{ action: 'ACCOUNT_CREATED', actorId: ACTOR.id, actorName: ACTOR.name, timestamp: daysAgo(n) }]
}

export const channelAccounts: ChannelAccount[] = [
  // ── GLDB · Fiat · Active (healthy mapping, with intermediary bank) ──────────
  {
    id: 'ca_001',
    payment_channel: 'GLDB',
    channel_account_number: 'GLDB-8800-1234-5678',
    mca_account_number: 'MCA-ALI-001',
    account_type: 'fiat',
    reference_code: 'REF-ALI-001',
    currency: 'SGD',
    client_name: 'Alibaba Group Holding Limited',
    participant_code: 'PART-ALI-001',
    member_id: 'MBR-ALI-001',
    participant_status: 'active',
    member_status: 'active',
    mapping_status: 'active',
    beneficiary: {
      name: 'Alibaba Group Holding Limited',
      address: '969 West Wen Yi Road, Hangzhou, China',
      country: 'China',
    },
    bank_details: {
      bank_name: 'Standard Chartered',
      account_number: 'SC6083-0112-8456-78',
      swift_code: 'SCBLGB2L',
      country_code: 'GB',
      bank_address: '1 Basinghall Avenue, London EC2V 5DD, United Kingdom',
    },
    intermediary_bank: {
      bank_name: 'Green Link Digital Bank (GLDB)',
      swift_code: 'GLDBSGSG',
      country_code: 'SG',
      bank_address: '88 Market Street, Floor 30, CapitaSpring, Singapore 048948',
    },
    archived: false,
    history: created(40),
    created_at: daysAgo(40),
    updated_at: daysAgo(40),
  },
  // ── GLDB · Investment Fiat · Active (same client, different account type) ───
  {
    id: 'ca_002',
    payment_channel: 'GLDB',
    channel_account_number: 'GLDB-8800-1234-9012',
    mca_account_number: 'MCA-ALI-002',
    account_type: 'investment_fiat',
    reference_code: 'REF-ALI-002',
    currency: 'USD',
    client_name: 'Alibaba Group Holding Limited',
    participant_code: 'PART-ALI-001',
    member_id: 'MBR-ALI-001',
    participant_status: 'active',
    member_status: 'active',
    mapping_status: 'active',
    beneficiary: {
      name: 'Alibaba Group Holding Limited',
      address: '969 West Wen Yi Road, Hangzhou, China',
      country: 'China',
    },
    bank_details: {
      bank_name: 'Standard Chartered',
      account_number: 'SC6083-0112-8456-99',
      swift_code: 'SCBLGB2L',
      country_code: 'GB',
      bank_address: '1 Basinghall Avenue, London EC2V 5DD, United Kingdom',
    },
    intermediary_bank: {
      bank_name: 'Green Link Digital Bank (GLDB)',
      swift_code: 'GLDBSGSG',
      country_code: 'SG',
      bank_address: '88 Market Street, Floor 30, CapitaSpring, Singapore 048948',
    },
    archived: false,
    history: created(40),
    created_at: daysAgo(40),
    updated_at: daysAgo(40),
  },
  // APPEND_HERE
  // ── SGB · Fiat · Active (no intermediary bank) ──────────────────────────────
  {
    id: 'ca_003',
    payment_channel: 'SGB',
    channel_account_number: 'SGB-9988-7766-55',
    mca_account_number: 'MCA-SHP-001',
    account_type: 'fiat',
    reference_code: 'REF-SHP-001',
    currency: 'USD',
    client_name: 'Shopee Pte Ltd',
    participant_code: 'PART-SHP-001',
    member_id: 'MBR-SHP-001',
    participant_status: 'active',
    member_status: 'active',
    mapping_status: 'active',
    beneficiary: {
      name: 'Shopee Pte Ltd',
      address: '5 Science Park Drive, Shopee Building, Singapore 118265',
      country: 'Singapore',
    },
    bank_details: {
      bank_name: 'Singapore Gulf Bank',
      account_number: 'SGB-0099-8877-66',
      swift_code: 'SGBKSGSG',
      country_code: 'SG',
      bank_address: '12 Marina Boulevard, Marina Bay Financial Centre, Singapore 018982',
    },
    intermediary_bank: null,
    archived: false,
    history: created(32),
    created_at: daysAgo(32),
    updated_at: daysAgo(32),
  },
  // ── TransferMate · Fiat · Active ────────────────────────────────────────────
  {
    id: 'ca_004',
    payment_channel: 'TransferMate',
    channel_account_number: 'TM-4455-6677-88',
    mca_account_number: 'MCA-GRB-001',
    account_type: 'fiat',
    reference_code: 'REF-GRB-001',
    currency: 'EUR',
    client_name: 'Grab Financial Group',
    participant_code: 'PART-GRB-001',
    member_id: 'MBR-GRB-001',
    participant_status: 'active',
    member_status: 'active',
    mapping_status: 'active',
    beneficiary: {
      name: 'Grab Financial Group',
      address: '3 Media Close, Singapore 138498',
      country: 'Singapore',
    },
    bank_details: {
      bank_name: 'TransferMate',
      account_number: 'TM-IE-2200-3311',
      swift_code: 'TRMTIE2D',
      country_code: 'IE',
      bank_address: 'Fenian Street, Dublin 2, D02 EH02, Ireland',
    },
    intermediary_bank: {
      bank_name: 'Citibank Europe',
      swift_code: 'CITIIE2X',
      country_code: 'IE',
      bank_address: '1 North Wall Quay, Dublin 1, Ireland',
    },
    archived: false,
    history: created(28),
    created_at: daysAgo(28),
    updated_at: daysAgo(28),
  },
  // ── Tazapay · Fiat · Active · Named VA (null reference code) ────────────────
  {
    id: 'ca_005',
    payment_channel: 'Tazapay',
    channel_account_number: 'TZP-VA-7001-2345',
    mca_account_number: 'MCA-LZD-001',
    account_type: 'fiat',
    reference_code: null,
    currency: 'SGD',
    client_name: 'Lazada SEA Holding',
    participant_code: 'PART-LZD-001',
    member_id: 'MBR-LZD-001',
    participant_status: 'active',
    member_status: 'active',
    mapping_status: 'active',
    beneficiary: {
      name: 'Lazada SEA Holding Pte Ltd',
      address: '51 Bras Basah Road, Lazada One, Singapore 189554',
      country: 'Singapore',
    },
    bank_details: {
      bank_name: 'Tazapay',
      account_number: 'TZP-SG-5510-8842',
      swift_code: 'TAZPSGSG',
      country_code: 'SG',
      bank_address: '68 Circular Road, Singapore 049422',
    },
    intermediary_bank: null,
    archived: false,
    history: created(21),
    created_at: daysAgo(21),
    updated_at: daysAgo(21),
  },
  // APPEND_HERE_2
  // ── GLDB · Fiat · Member status INITIAL (status exception → blocks credit) ──
  {
    id: 'ca_006',
    payment_channel: 'GLDB',
    channel_account_number: 'GLDB-8800-5566-77',
    mca_account_number: 'MCA-TKP-001',
    account_type: 'fiat',
    reference_code: 'REF-TKP-001',
    currency: 'IDR',
    client_name: 'Tokopedia Seller Centre',
    participant_code: 'PART-TKP-001',
    member_id: 'MBR-TKP-001',
    participant_status: 'active',
    member_status: 'initial',
    mapping_status: 'active',
    beneficiary: {
      name: 'PT Tokopedia',
      address: 'Ciputra World 2, Jakarta 12940, Indonesia',
      country: 'Indonesia',
    },
    bank_details: {
      bank_name: 'Green Link Digital Bank (GLDB)',
      account_number: 'GLDB-ID-3344-5566',
      swift_code: 'GLDBSGSG',
      country_code: 'SG',
      bank_address: '88 Market Street, Floor 30, CapitaSpring, Singapore 048948',
    },
    intermediary_bank: null,
    archived: false,
    history: created(14),
    created_at: daysAgo(14),
    updated_at: daysAgo(14),
  },
  // ── SGB · Investment Fiat · Participant SUSPENDED (status exception) ─────────
  {
    id: 'ca_007',
    payment_channel: 'SGB',
    channel_account_number: 'SGB-1122-3344-55',
    mca_account_number: 'MCA-PCT-001',
    account_type: 'investment_fiat',
    reference_code: 'REF-PCT-001',
    currency: 'USD',
    client_name: 'Pacific Trade Co',
    participant_code: 'PART-PCT-001',
    member_id: 'MBR-PCT-001',
    participant_status: 'suspended',
    member_status: 'active',
    mapping_status: 'active',
    beneficiary: {
      name: 'Pacific Trade Co Ltd',
      address: '8 Marina View, Asia Square Tower 1, Singapore 018960',
      country: 'Singapore',
    },
    bank_details: {
      bank_name: 'Singapore Gulf Bank',
      account_number: 'SGB-0011-2233-44',
      swift_code: 'SGBKSGSG',
      country_code: 'SG',
      bank_address: '12 Marina Boulevard, Marina Bay Financial Centre, Singapore 018982',
    },
    intermediary_bank: null,
    archived: false,
    history: created(10),
    created_at: daysAgo(10),
    updated_at: daysAgo(10),
  },
  // ── TransferMate · Fiat · BOTH statuses non-active (participant+member CLOSED) ──
  {
    id: 'ca_008',
    payment_channel: 'TransferMate',
    channel_account_number: 'TM-9900-1122-33',
    mca_account_number: 'MCA-GMB-001',
    account_type: 'fiat',
    reference_code: 'REF-GMB-001',
    currency: 'EUR',
    client_name: 'Global Merchants BV',
    participant_code: 'PART-GMB-001',
    member_id: 'MBR-GMB-001',
    participant_status: 'closed',
    member_status: 'closed',
    mapping_status: 'active',
    beneficiary: {
      name: 'Global Merchants BV',
      address: 'Gustav Mahlerlaan 10, 1082 PP Amsterdam, Netherlands',
      country: 'Netherlands',
    },
    bank_details: {
      bank_name: 'TransferMate',
      account_number: 'TM-NL-7788-9900',
      swift_code: 'TRMTIE2D',
      country_code: 'IE',
      bank_address: 'Fenian Street, Dublin 2, D02 EH02, Ireland',
    },
    intermediary_bank: null,
    archived: false,
    history: created(8),
    created_at: daysAgo(8),
    updated_at: daysAgo(8),
  },
  // ── GLDB · Fiat · Active client but mapping toggled INACTIVE (excluded from engine) ──
  {
    id: 'ca_009',
    payment_channel: 'GLDB',
    channel_account_number: 'GLDB-8800-7788-99',
    mca_account_number: 'MCA-NIO-001',
    account_type: 'fiat',
    reference_code: 'REF-NIO-001',
    currency: 'SGD',
    client_name: 'Ninja Van Holdings',
    participant_code: 'PART-NIO-001',
    member_id: 'MBR-NIO-001',
    participant_status: 'active',
    member_status: 'active',
    mapping_status: 'inactive',
    beneficiary: {
      name: 'Ninja Van Holdings Pte Ltd',
      address: '30 Pioneer Crescent, Singapore 628559',
      country: 'Singapore',
    },
    bank_details: {
      bank_name: 'Green Link Digital Bank (GLDB)',
      account_number: 'GLDB-SG-1010-2020',
      swift_code: 'GLDBSGSG',
      country_code: 'SG',
      bank_address: '88 Market Street, Floor 30, CapitaSpring, Singapore 048948',
    },
    intermediary_bank: null,
    archived: false,
    history: created(6),
    created_at: daysAgo(6),
    updated_at: daysAgo(2),
  },
  // ── Tazapay · Investment Fiat · Active (Named VA, second client) ────────────
  {
    id: 'ca_010',
    payment_channel: 'Tazapay',
    channel_account_number: 'TZP-VA-7002-6789',
    mca_account_number: 'MCA-SEA-001',
    account_type: 'investment_fiat',
    reference_code: null,
    currency: 'USD',
    client_name: 'SeaMoney Capital',
    participant_code: 'PART-SEA-001',
    member_id: 'MBR-SEA-001',
    participant_status: 'active',
    member_status: 'active',
    mapping_status: 'active',
    beneficiary: {
      name: 'SeaMoney Capital Pte Ltd',
      address: '1 Fusionopolis Place, Galaxis, Singapore 138522',
      country: 'Singapore',
    },
    bank_details: {
      bank_name: 'Tazapay',
      account_number: 'TZP-SG-9921-4410',
      swift_code: 'TAZPSGSG',
      country_code: 'SG',
      bank_address: '68 Circular Road, Singapore 049422',
    },
    intermediary_bank: null,
    archived: false,
    history: created(4),
    created_at: daysAgo(4),
    updated_at: daysAgo(4),
  },
]
