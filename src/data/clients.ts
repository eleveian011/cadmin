import type { ClientSearchResult } from '../types/task'

/**
 * CAMP client directory — backs the manual recipient search fallback in the
 * Task Center (PRD §7.7.3 item 3 / §7.7.4 step 3b). Search-as-you-type matches
 * client name (partial) and participant code (partial). In a real system this is
 * a real-time query against CAMP's client index; here it is a static fixture.
 */
export const clients: ClientSearchResult[] = [
  { participant_code: 'PART-ALI-001', client_name: 'Alibaba SG Master',        parent_node: 'Alibaba Group',     account_number: 'MCA-ALI-001' },
  { participant_code: 'PART-TAO-001', client_name: 'Taobao Sub',               parent_node: 'Alibaba Group',     account_number: 'MCA-TAO-001' },
  { participant_code: 'PART-TMT-001', client_name: 'Tmall Tech Sub',           parent_node: 'Alibaba Group',     account_number: 'MCA-TMT-001' },
  { participant_code: 'PART-FLG-001', client_name: 'Fliggy Travel Sub',        parent_node: 'Alibaba Group',     account_number: 'MCA-FLG-001' },
  { participant_code: 'PART-AEO-001', client_name: 'AE Outlet Sub',            parent_node: 'Alibaba Group',     account_number: 'MCA-AEO-001' },
  { participant_code: 'PART-XYV-001', client_name: 'Xianyu Vintage Sub',       parent_node: 'Alibaba Group',     account_number: 'MCA-XYV-001' },
  { participant_code: 'PART-LZD-001', client_name: 'Lazada SEA Holding',       parent_node: 'Lazada Group',      account_number: 'MCA-LZD-001' },
  { participant_code: 'PART-LZD-002', client_name: 'Lazada SG Operations',     parent_node: 'Lazada Group',      account_number: 'MCA-LZD-002' },
  { participant_code: 'PART-RDM-001', client_name: 'RedMart Logistics',        parent_node: 'Lazada Group',      account_number: 'MCA-RDM-001' },
  { participant_code: 'PART-SHP-001', client_name: 'Shopee Pte Ltd',           parent_node: 'Sea Limited',       account_number: 'MCA-SHP-001' },
  { participant_code: 'PART-SHP-002', client_name: 'Shopee Express',           parent_node: 'Sea Limited',       account_number: 'MCA-SHP-002' },
  { participant_code: 'PART-GRB-001', client_name: 'Grab Financial Group',     parent_node: 'Grab Holdings',     account_number: 'MCA-GRB-001' },
  { participant_code: 'PART-GRB-002', client_name: 'GrabPay Merchant Svcs',    parent_node: 'Grab Holdings',     account_number: 'MCA-GRB-002' },
  { participant_code: 'PART-GJK-001', client_name: 'Gojek Tech Sub',           parent_node: 'GoTo Group',        account_number: 'MCA-GJK-001' },
  { participant_code: 'PART-TKP-001', client_name: 'Tokopedia Seller Centre',  parent_node: 'GoTo Group',        account_number: 'MCA-TKP-001' },
  { participant_code: 'PART-SEA-001', client_name: 'SeaMoney Capital',         parent_node: 'Sea Limited',       account_number: 'MCA-SEA-001' },
  { participant_code: 'PART-NIO-001', client_name: 'Ninja Van Holdings',       parent_node: 'Ninja Logistics',   account_number: 'MCA-NIO-001' },
  { participant_code: 'PART-PCT-001', client_name: 'Pacific Trade Co',         parent_node: 'Pacific Holdings',  account_number: 'MCA-PCT-001' },
  { participant_code: 'PART-PCT-002', client_name: 'Pacific Trade (HK)',       parent_node: 'Pacific Holdings',  account_number: 'MCA-PCT-002' },
  { participant_code: 'PART-GMB-001', client_name: 'Global Merchants BV',      parent_node: 'Global Holdings',   account_number: 'MCA-GMB-001' },
]
