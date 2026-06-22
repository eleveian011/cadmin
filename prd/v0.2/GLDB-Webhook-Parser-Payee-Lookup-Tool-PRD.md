# GLDB Webhook Parser & Payee Lookup Tool — Product Requirements Document

**Version**: 1.1 | **Author**: Product | **Date**: 2026-06-05 | **Status**: DRAFT

---

## 1. Executive Summary

MetaComp processes fiat deposits from GLDB (Green Link Digital Bank) into client ledgers. The full Fiat Deposit STP system (defined in `fiat-deposit-automation-stp-prd.md`) is a large, multi-phase project covering an automated rule engine, transaction screening, auto-crediting, and multi-channel integrations.

Before the full STP system is ready, Operations needs a **lightweight standalone tool** to reduce the cognitive load and error risk of manual deposit processing. This tool allows Ops to paste a GLDB webhook JSON into an input box, automatically look up the payee in the Fiat Account Mapping Reference Table, and output a clear human-readable summary for manual booking. The tool also includes full CRUD maintenance for the mapping table, with GLDB bulk upload support.

**Target outcome**: Reduce Ops lookup and verification time per GLDB deposit from 5-15 minutes to <1 minute, while reducing manual lookup errors and providing consistent output.

---

## 2. Context and Background

### 2.1 Company Context

| Attribute | Detail |
|-----------|--------|
| **Company** | MetaComp Pte. Ltd. |
| **Licenses** | MAS MPI (Major Payment Institution) + DPT (Digital Payment Token) |
| **Back-office System** | CAMP Admin (Client Asset Management Platform) |
| **Payment Channel** | GLDB (Green Link Digital Bank) — focus of this tool |
| **Existing Reference** | Full STP PRD: `outputs/fiat-deposit-automation-stp-prd.md` |

### 2.2 Problem Statement

When a GLDB deposit webhook arrives, Operations currently:

1. Reads the Lark notification with the raw JSON
2. Manually identifies the correct client ledger in CAMP Admin
3. Cross-references GLDB's account numbers against internal mapping files (spreadsheets, emails)
4. Fills in all required fields for crediting

This process is:
- **Time-consuming**: Each deposit takes 5-15 minutes of cross-referencing
- **Error-prone**: Manual account number matching leads to misidentification
- **Non-scalable**: As deposit volume grows, this manual process does not scale linearly

### 2.3 Business Objectives

| Objective | Metric | Current | Target |
|-----------|--------|---------|--------|
| Reduce Ops lookup time per GLDB deposit | Minutes from webhook to manual booking readiness | 5-15 min | <1 min |
| Reduce lookup errors | % of deposits with incorrect payee identification | Unknown | <1% |
| Build mapping table foundation | Mapping entries created and maintained | Sparse spreadsheets | Structured, queryable table |

### 2.4 Relationship to Full STP System

This tool is a **preliminary standalone tool** that:
- Uses the same **Fiat Account Mapping Reference Table** schema defined in the STP PRD (§7.4)
- Shares the database schema so the mapping table built and maintained by Ops through this tool can be directly consumed by the STP rule engine later (Step 2 — Account Match)
- Does **NOT** depend on the full STP rule engine, VisionX screening, auto-crediting, or CAMP Task Center
- Defers same-name verification (1st/3rd party classification) to a later phase or to the full STP system — name matching uses the same `NameMatchService` algorithm as STP PRD §7.2, but is not required for this tool's core lookup functionality

---

## 3. Stakeholder Analysis

| Stakeholder | Role | Primary Concerns | Success Criteria |
|-------------|------|------------------|-----------------|
| **Operations Officer** | Primary user — processes GLDB deposits manually | Reducing lookup time, avoiding errors, clear output | Can process a deposit in <1 min using the tool. Output clearly shows payee. |
| **Ops Admin** | Mapping table maintainer — uploads GLDB data and manages entries | Easy bulk upload, clear validation errors, audit trail | Can upload a GLDB mapping file and see results in <2 min. All changes logged. |
| **Engineering Lead** | Implementation — builds and maintains the tool | Clean separation from STP codebase, shared schema | Mapping table schema and database are compatible with future STP system. |
| **Product Manager** | Scope definition — ensures this tool fits the STP roadmap | Tool does not create tech debt that blocks STP; mapping table carries forward | Tool uses same schema as STP PRD. Migration path is smooth. |

---

## 4. User Personas

### 4.1 Operations Analyst (Primary User)

- **Role**: Processes incoming GLDB deposits manually
- **Goal**: Quickly and accurately identify the payee for each deposit
- **Pain Points**: Manual account number lookup in spreadsheets, switching between multiple systems
- **Technical Proficiency**: LOW-MEDIUM — comfortable with form-based web tools, not technical
- **Success**: Paste a webhook → see payee info → proceed to manual booking with confidence

### 4.2 Ops Admin (Mapping Table Maintainer)

- **Role**: Maintains the mapping table from GLDB data dumps
- **Goal**: Upload GLDB mapping files and manage individual entries
- **Pain Points**: Currently manages mappings in offline spreadsheets with no version control
- **Technical Proficiency**: MEDIUM
- **Success**: Upload a GLDB Excel file → system validates and imports entries → errors clearly reported

---

## 5. Scope Definition

### 5.1 In Scope

| Feature Area | Description |
|-------------|-------------|
| **Webhook JSON Parsing** | Accept a GLDB webhook JSON payload pasted into a text input. Parse and display all key fields with human-readable labels. Auto-parses on paste. |
| **Mapping Table Query** | Look up the receiver account number in the Fiat Account Mapping Reference Table. Display the matched client info including name, participant code, User Channel Account Number, account type, currencies, statuses. |
| **Human-Readable Output Summary** | Display a structured, readable summary: transaction details, payee info (found or not-found), and Ops action items for manual booking. |
| **Mapping Table Maintenance** | Full CRUD UI for the Fiat Account Mapping Reference Table: view/search, add, edit, soft delete. Follow the schema defined in STP PRD §7.4. |
| **GLDB Bulk Upload** | Upload Excel/CSV files from GLDB to populate the mapping table in batch. Validation, duplicate handling, and result reporting. |
| **Audit Logging** | All lookups and mapping table changes logged with timestamp and Ops identity. |
| **NameMatchService Module** (Phase 2) | A reusable, standalone fuzzy name matching module. Spec defined in `design/name-match-score-algorithm.md`, shared with the STP system. Not required for this tool's core lookup flow. |

### 5.2 Out of Scope

| Item | Rationale |
|------|-----------|
| Same-name verification / 1st-3rd party classification | Phase 2 feature. Not needed for payee lookup. |
| Auto-crediting or ledger integration | Reserved for full STP system. This tool outputs info for manual booking only. |
| VisionX / Lexis Nexis screening | Full STP system handles screening. |
| Multi-channel support (SGB, TransferMate, Tazapay) | Phase 2 of full STP covers these. This tool is GLDB-focused. |
| Lark notification integration | Already exists. This tool is a supplement, not a replacement. |
| CAMP Admin integration | This tool is standalone. No need to embed in CAMP Admin for MVP. |
| Reference code matching (Step 3 of STP rule engine) | Manual Ops identification handles this. Tool focuses on account number lookup. |
| Account exclusion / ALF filtering | Manual Ops judgment handles this in the current workflow. |
| Deferred scheduling / value date handling | Manual Ops handles this. |
| Full STP rule engine | This is deliberately a simpler tool — parse → lookup → output. |

### 5.3 Assumptions

1. Ops has access to the database where the mapping table is stored (shared with future STP system).
2. The NameMatchService module's Chinese pinyin matching scope (per STP PRD §7.2) applies to personal names only — not needed for this tool but ensures future compatibility.
3. GLDB provides mapping files in a consistent format (Excel or CSV) for bulk uploads.
4. The mapping table schema defined in STP PRD §7.4 is stable enough to start building against.
5. Ops will use this tool in a browser-based web interface.
6. This tool does NOT need high availability (99.9%) — it's an internal productivity tool.

### 5.4 Dependencies

| Dependency | Owner | Status |
|------------|-------|--------|
| Fiat Account Mapping Reference Table schema finalization | Product / Engineering | Defined in STP PRD §7.4 |
| NameMatchService algorithm design | Product / Engineering | Defined in `design/name-match-score-algorithm.md` |
| Database/backend infrastructure for the tool | Engineering | TBD |
| GLDB bulk upload file format confirmation | Ops | TBD |
| Ops user authentication mechanism | Engineering | TBD |

---

## 6. Feature Specifications

### 6.1 Webhook JSON Input & Parsing

**Description**: A clean, simple input interface where Ops can paste a GLDB webhook JSON payload. The tool parses it automatically and displays the structured fields.

**UI Layout**:
- **Top section**: Large multi-line text input with label "Paste GLDB Webhook JSON"
- **Auto-parses on paste** (debounced 500ms). A "Parse" button is also available for re-parsing or manual trigger.
- Sample webhook template toggle for reference
- Clear error handling for invalid JSON

**Displayed Fields** (parsed and labelled):

| Webhook Field | Display Label | Example |
|--------------|---------------|---------|
| acctNo | Receiving Account No | 11020018879 |
| receiverAcctNo | Receiving Account No (alt) | 11020018879 |
| receiverAcctNm | Receiving Account Name | METACOMP PTE. LTD. |
| receiverBankCd | Receiving Bank Code | GLDTSGSG |
| amount | Amount | 4000617.16 |
| currencyTypeCd | Currency | USD |
| direction | Direction | I (Inward) |
| senderAcctNm | Sender Name | RED ENVELOPE ALPHA INC |
| senderAcctNo | Sender Account No | 4395608 |
| senderBankCd | Sender Bank Code | (blank) |
| paymentRef | Payment Reference | SGL26107FKFBLDCC |
| remark | Remark | OPENFX - 7138496A-... |
| valueDate | Value Date | 2026-04-20 |
| tradeDate | Trade Date | 2026-04-17 |
| tradeTime | Trade Time | 203810598 |
| eventReference | Event Reference | 8597a46f-... |
| coreTradeSerlNo | Core Trade Serial No | 0209131107FF |
| source | Source | SWIFTMX |

> **Note**: `tradeTime` is the raw value from the GLDB webhook (GLDB-specific timestamp format with ms granularity). Displayed as-is for Ops reference. `tradeDate`/`valueDate` are in YYYYMMDD format in the raw webhook and displayed as YYYY-MM-DD.

**Validation**:
- Input must be valid JSON — display syntax error with line/position if not
- Required fields: at minimum `acctNo` (or `receiverAcctNo`) and `senderAcctNm` must be present
- Missing optional fields are displayed as "(not provided)" rather than causing an error
- Amount must be a valid number
- Currency should match ISO 4217 (display warning if unknown)

**Acceptance Criteria**:
- [ ] Valid webhook JSON auto-parses and displays structured fields within 1 second (on paste)
- [ ] Invalid JSON shows clear error message with line/position of parse failure
- [ ] Missing non-critical fields shown as "(not provided)" with grey styling
- [ ] Amount formatted with thousand separators and currency symbol
- [ ] Dates converted from YYYYMMDD to YYYY-MM-DD display format
- [ ] Sample webhook toggle available for demo/testing

#### AI Consideration
- **AI Applicability**: NO
- **AI Approach**: Deterministic JSON parsing with field mapping. No AI/ML.
- **Data Requirements**: GLDB webhook JSON schema.
- **Fallback Strategy**: Show raw JSON as fallback if structured parsing fails for a specific field.
- **Rationale**: JSON parsing is a fully deterministic operation. AI would add unnecessary complexity and potential hallucination of field values.

---

### 6.2 Payee Lookup via Mapping Table

**Description**: After parsing the webhook, automatically query the Fiat Account Mapping Reference Table using the receiver account number. Display all matching records.

**Lookup Logic**:
1. Primary lookup key: `acctNo` from webhook → mapped against `channel_account_number` in mapping table
2. Fallback: if `acctNo` is not present, use `receiverAcctNo` (defensive — these are typically identical in GLDB webhooks)
3. If multiple mapping entries match the same account number (same account, different Account Types like Fiat / Investment Fiat), display all matches
4. If no match found, clearly indicate payee NOT found and show the account number searched

**Output Display** (when payee is found):

| Field | Source |
|-------|--------|
| Client Name | From mapping table |
| Participant Code | From mapping table |
| User Channel Account Number | From mapping table |
| Account Type | Fiat / Investment Fiat |
| Currency | From mapping table |
| Reference Code | From mapping table (if any) |
| Participant Status | From mapping table, colour-coded |
| Member Status | From mapping table, colour-coded |
| Mapping Status | Active / Inactive |

**Status indicators**:
- Active status → green badge
- Non-Active (Initial / Suspended / Closed) → red/orange badge with note: "Account is [status] — confirm with Ops Admin before proceeding"
- Inactive mapping → grey badge with note: "Mapping is inactive — check if this account should be re-activated"

**Match Confidence Indicator**:
- "Exact Match" (green): Single mapping entry found for this account number
- "Multiple Matches" (amber): Multiple Account Types or entries found — Ops selects the correct one
- "No Match" (red): No mapping entry — proceed to "unidentified payee" output mode

**Acceptance Criteria**:
- [ ] Lookup completes in <2 seconds
- [ ] Exact single match → display client info immediately
- [ ] Multiple matches → display all entries with Account Type differentiation
- [ ] No match → display "Payee Not Found" with searched account number
- [ ] Non-Active participant/member status clearly flagged with visual warning
- [ ] Mapping Status = Inactive shown as greyed out with warning
- [ ] Clicking a client name opens a "view details" panel with full row data

#### AI Consideration
- **AI Applicability**: NO
- **AI Approach**: Deterministic key-value database lookup. No AI/ML.
- **Data Requirements**: `channel_account_number` from mapping table, `acctNo`/`receiverAcctNo` from webhook.
- **Fallback Strategy**: No match → proceed to "Payee Not Found" output mode. Provide manual search fallback if needed.
- **Rationale**: Account number matching must be 100% deterministic. Zero tolerance for hallucinated or fuzzy account number lookups.

---

### 6.3 Same-Name Verification (1st/3rd Party Classification) — Phase 2

**Description**: When a payee is identified from the mapping table, compare the sender name (`senderAcctNm`) against the client's registered name in the mapping table. Apply the fuzzy matching algorithm defined in STP PRD §7.2 to classify the deposit as 1st party (一方) or 3rd party (三方).

> **Phase note**: This feature is **not included in the initial release** (Phase 1) of this standalone tool. However, in the full STP system (defined in `fiat-deposit-automation-stp-prd.md`), the `NameMatchService` module is a **Phase 1 requirement** driven by PSN04 regulatory reporting — see STP PRD §7.2. This means the NameMatchService algorithm and module are already being built in the STP system's Phase 1, but the GLDB tool's UI integration for same-name verification is deferred to Phase 2 of this tool.

**Algorithm**: Implement the `NameMatchService` module as defined in `design/name-match-score-algorithm.md`. Key elements:
- Unicode normalization and transliteration
- Tokenization and token-level comparison
- Subset/token containment detection
- Token reordering tolerance
- Edit distance for typo handling
- Chinese pinyin support for **personal names only** (per STP PRD §7.2 — enterprise Chinese names use registered English name only)
- Returns a `MatchResult` object containing: normalized score S ∈ [0.0, 1.0], normalized names, match method, and debug details (token-level breakdown)

**Classification Rules** (matching STP PRD §7.2 thresholds, configurable):

| Score Range | Classification | Display |
|-------------|---------------|---------|
| S ≥ 0.85 | 1st Party (一方) | Green badge |
| 0.5 ≤ S < 0.85 | Ambiguous | Amber badge — Ops must determine manually |
| S < 0.5 | 3rd Party (三方) | Red badge |

**Output Detail**:
- Match score displayed as percentage
- Token-level breakdown: which parts of the name matched
- Side-by-side name comparison with highlighted matching/differing tokens

**No Payee Found Case**: If payee was not found in the mapping table:
- "Payee not identified from mapping table. Cannot perform same-name verification."
- Show sender name and receiver account name as reference

**Acceptance Criteria**:
- [ ] Name match score computed and displayed within 1 second
- [ ] Classification threshold matches STP PRD §7.2 (configurable 0.85/0.5 boundaries)
- [ ] Token-level breakdown visible for Ops review
- [ ] Ambiguous classification clearly indicates Ops must decide manually
- [ ] Chinese pinyin matching for personal names only (enterprise names excluded)
- [ ] Match score recorded in the audit log

#### AI Consideration
- **AI Applicability**: NO
- **AI Approach**: Fully deterministic Unicode normalization → tokenization → similarity matrix → score calculation. Pure algorithmic — no AI/ML. Same algorithm as defined in STP PRD §7.2.
- **Data Requirements**: `senderAcctNm` from webhook, client registered name from mapping table.
- **Fallback Strategy**: Ambiguous range (0.5-0.85) → route to Ops manual decision. No auto-classification for unsure cases.
- **Rationale**: Financial classification must be fully deterministic, explainable, and auditable. Every match outcome must be attributable to specific token-level comparisons.

---

### 6.4 Human-Readable Output Summary

**Description**: After parsing and lookup, display a consolidated human-readable summary that Ops can use directly to perform manual booking in CAMP Admin.

**Output Sections**:

#### Section 1: Transaction Summary
```
═══════════════════════════════════════════
  GLDB Deposit — Manual Booking Summary
═══════════════════════════════════════════
  Transaction ID      : {eventReference}
  Amount              : $4,000,617.16 USD
  Value Date          : 2026-04-20
  Trade Date          : 2026-04-17
  Payment Ref         : SGL26107FKFBLDCC
  Receiving Account   : 11020018879 (METACOMP PTE. LTD.)
  Bank Code           : GLDTSGSG
  Source              : SWIFTMX
  Direction           : Inward
```

#### Section 2: Payee Information
```
  ┌─ Payee: FOUND ─────────────────────────┐
  │  Client Name     : ACME PTE. LTD.       │
  │  Participant Code: P-12345              │
  │  User Channel Account: 11020012345          │
  │  Account Type    : Fiat                 │
  │  Status          : Active               │
  └─────────────────────────────────────────┘
```

OR (if not found):
```
  ┌─ Payee: NOT FOUND ─────────────────────┐
  │  Account Searched: 11020018879          │
  │  No mapping entry found for this        │
  │  account number.                        │
  │                                         │
  │  Action: Check if the account number    │
  │  is correct, or search manually in the  │
  │  Mapping Table tab.                     │
  └─────────────────────────────────────────┘
```

#### Section 3: Classification Result — Added in Phase 2
> This section is added in Phase 2 when same-name verification is implemented. Phase 1 output consists of Sections 1, 2, and 4 only.

#### Section 4: Ops Action Items
```
  ┌─ Action Items ──────────────────────────┐
  │  ✅ Payee identified: ACME PTE. LTD.    │
  │  ☐ Proceed to CAMP Admin → Manual       │
  │    Booking                                │
  │  ☐ Use these sender details:            │
  │    - Name:     RED ENVELOPE ALPHA INC   │
  │    - Account:  4395608                  │
  │  ☐ Credit to: ACME PTE. LTD.            │
  │    (Participant: P-12345)               │
  └─────────────────────────────────────────┘
```

OR (payee not found):
```
  ┌─ Action Items ──────────────────────────┐
  │  ❌ Payee NOT identified                │
  │  ☐ Investigate account 11020018879      │
  │  ☐ Check GLDB portal for more info      │
  │  ☐ Sender name: RED ENVELOPE ALPHA INC  │
  │  ☐ Receiver name: METACOMP PTE. LTD.    │
  │  ☐ After identifying payee, update the  │
  │    mapping table (Mapping Table tab)     │
  └─────────────────────────────────────────┘
```

**Copy to Clipboard**: A button to copy a formatted text summary that Ops can paste into Lark or booking notes.

**Acceptance Criteria**:
- [ ] Output clearly shows whether payee was found or not
- [ ] Action items are specific and actionable, not generic
- [ ] "Copy Summary" button copies formatted text to clipboard
- [ ] Output fits on a single screen without scrolling (for common cases)
- [ ] Empty/null fields are shown as "(not provided)" — never blank

#### AI Consideration
- **AI Applicability**: NO
- **AI Approach**: Template-based structured output assembly. Content determined by deterministic parsing and lookup results.
- **Data Requirements**: Webhook fields, mapping table query results.
- **Fallback Strategy**: If parsing or lookup fails, the summary clearly shows what is known and what is unknown.
- **Rationale**: Ops action items must be fully deterministic. AI-generated suggestions could mislead Ops into incorrect booking actions.

---

### 6.5 Mapping Table Maintenance

**Description**: A full CRUD interface for the Fiat Account Mapping Reference Table. This is the tool Ops Admin uses to maintain the mapping data that powers the payee lookup.

**Table Schema** (matches STP PRD §7.4 exactly):

| Column | Type | Editable? |
|--------|------|-----------|
| Payment Channel | Select (GLDB default) | On create |
| Channel Account Number (Internal) | Text | Editable for GLDB entries (allows Ops to correct mappings); read-only for non-GLDB entries |
| User Channel Account Number | Text | Editable for GLDB entries; read-only for non-GLDB entries |
| Account Type | Select (Fiat / Investment Fiat) | On create & edit |
| Reference Code | Text (read-only, system-populated) | Read-only |
| Currency | Text | On create & edit |
| Client Name | Lookup (auto-populated from CAMP) | Read-only |
| Participant Code | Lookup (auto-populated from CAMP) | Read-only |
| Participant Status | Lookup (refreshed from CAMP) | Read-only |
| Member Status | Lookup (refreshed from CAMP) | Read-only |
| Mapping Status | Toggle (Active / Inactive) | Always editable |

> **Schema alignment**: This table uses the same schema as STP PRD §7.4. The `User Channel Account Number` column (formerly referred to as "MCA Account Number" in earlier STP drafts — see STP PRD Glossary) represents the user-facing external channel account number. Building this table here means the full STP system can consume it without migration. The `Reference Code` field is system-populated (generated when a reference code is created) and is not editable via the tool's UI — matching STP PRD behaviour.

**Views**:

#### 6.5.1 Table List View
- Paginated table with all columns
- Search/filter bar:
  - Channel Account Number (Internal) (text, partial match)
  - User Channel Account Number (text, partial match)
  - Client Name (text, partial match)
  - Participant Code (text, partial match)
  - Payment Channel (dropdown — GLDB default, multi-channel support for future)
  - Account Type (dropdown: Fiat / Investment Fiat / All)
  - Participant Status (multi-select: Active / Initial / Suspended / Closed / All)
  - Member Status (multi-select: Active / Initial / Suspended / Closed / All)
  - Mapping Status (dropdown: Active / Inactive / All)
- Sortable columns
- Row colour coding:
  - Non-Active status → amber/orange background
  - Inactive mapping → grey background
- Actions column: Edit, Delete (soft), View Detail
- "Add New Entry" button
- "Bulk Upload" button (GLDB only)
- "Export" button (current filtered view to CSV/Excel)

#### 6.5.2 Add/Edit Entry Form
- All editable fields displayed as form inputs
- Validation on save:
  - The combination of (Payment Channel + Channel Account Number (Internal) + Account Type) must be unique
  - User Channel Account Number is required
  - Participant Code must be provided
  - Currency must be valid ISO 4217
- On save: validate all fields, confirm with user, write to database
- On edit: pre-populate all existing values

#### 6.5.3 Soft Delete
- Confirmation dialog: "Are you sure you want to delete this mapping entry? It will be archived (soft-deleted) and excluded from payee lookups."
- Archived entries are hidden from default view (can be shown with "Include Archived" toggle)
- Audit trail records: who deleted, when, and the full entry data before deletion

#### 6.5.4 Bulk Upload (GLDB)
- Upload button opens dialog with:
  - File picker (accepts .xlsx, .xls, .csv)
  - Template download link (blank Excel with correct column headers)
  - Duplicate handling mode selector:
    - **Ignore**: Skip duplicate rows (Payment Channel + Channel Account Number (Internal) + Account Type), keep existing data
    - **Overwrite**: Update existing rows with new values from the file
  - Upload button
- **Template columns**: Payment Channel, Channel Account Number (Internal), User Channel Account Number, Currency, Account Type (Fiat / Investment Fiat), Participant Code. Reference Code is **not** included — it is system-generated. Participant Code must be provided for client identification; Client Name and statuses are auto-populated on upload via CAMP lookup.
- Validation before commit:
  - All rows validated before any row is committed (all-or-nothing)
  - Per-row validation: required fields, format checks, duplicate detection
  - Rejected rows are reported with specific error reasons
- Result report after processing:
  - Total rows in file
  - Rows added (new insertions)
  - Rows updated (overwritten)
  - Rows ignored (duplicate, Ignore mode)
  - Rows rejected (with per-row error message)

**Acceptance Criteria**:
- [ ] Add new entry creates a record visible in list view immediately
- [ ] Edit changes are persisted and reflected in subsequent lookups
- [ ] Soft-deleted entries excluded from payee lookup but preserved in database
- [ ] Search/filter across 6+ dimensions works with combined conditions
- [ ] Bulk upload validates all rows before commit — no partial updates
- [ ] Bulk upload result report shows clear breakdown (added/updated/ignored/rejected)
- [ ] Duplicate (Payment Channel + Channel Account Number (Internal) + Account Type) rejected at add time
- [ ] Non-GLDB bulk upload attempts rejected with clear error message
- [ ] Exported CSV contains the same columns as the current table view
- [ ] Row colour coding correctly reflects status conditions
- [ ] All changes logged in audit trail with timestamp and Ops identity

#### AI Consideration
- **AI Applicability**: NO
- **AI Approach**: Deterministic CRUD operations. Standard form validation. No AI/ML.
- **Data Requirements**: Mapping table schema fields, upload file.
- **Fallback Strategy**: Database transaction rollback on failed bulk upload. Manual add/edit as fallback when upload fails.
- **Rationale**: Financial account mapping must be 100% accurate and operator-controlled. AI-driven suggestions for mappings could introduce incorrect account linkages.

---

### 6.6 Audit Log

**Description**: Record all user actions in the tool for auditing and traceability. A single unified audit log stores both mapping table changes and webhook lookup records — no separate lookup history store.

**Audited Events**:
- Every webhook parse + lookup attempt (with input JSON, lookup results)
- Every mapping table change (add, edit, soft delete)
- Every bulk upload attempt (file metadata, row counts, success/failure)

**Audit Record Fields**:
- Timestamp
- Ops identity (username / session)
- Action type (WEBHOOK_LOOKUP, MAPPING_ADD, MAPPING_EDIT, MAPPING_DELETE, BULK_UPLOAD)
- Input data (webhook JSON or mapping row data)
- Output data (lookup result, upload result)
- Success/failure status

**Audit View** (admin-only):
- Searchable table sorted by timestamp descending
- Filter by action type, Ops identity, date range
- Read-only — cannot edit or delete audit records

**Retention**: Audit log retained for minimum 5 years (MAS regulatory requirement). No separate webhook lookup history with shorter retention — all lookups live in the same audit log. Daily database backup.

**Acceptance Criteria**:
- [ ] Every webhook lookup is logged with full input and output
- [ ] Every mapping table change is logged with before and after values
- [ ] Audit log is append-only — no deletion or editing
- [ ] Admin can search and filter audit records
- [ ] Audit log exportable to CSV/Excel

---

## 7. Non-Functional Requirements

### 7.1 Performance

| Requirement | Target |
|-------------|--------|
| Webhook parse → lookup → output | <3 seconds end-to-end |
| Mapping table search results | <2 seconds for filtered queries |
| Bulk upload processing | <10 seconds for 10,000 rows |
| Page load time | <3 seconds |

### 7.2 Availability

- Internal tool — target 99% uptime (acceptable for non-production-critical internal tool)
- Graceful degradation: if the mapping table DB is unavailable, the tool should show an error message but still display the parsed webhook data
- Stateless frontend — can be refreshed without data loss

### 7.3 Security

| Requirement | Detail |
|-------------|--------|
| Authentication | Ops must log in to access the tool (SSO or simple auth per Engineering choice) |
| Authorization | Ops Analyst: view mapping tables, use webhook parser. Ops Admin: add/edit/delete mapping entries, bulk upload. |
| Audit | All actions logged with user identity |
| Data at rest | Mapping table stored in database with access controls |
| Data in transit | HTTPS required for all communications |

### 7.4 Data Requirements

| Requirement | Detail |
|-------------|--------|
| Mapping table retention | Permanent — reference data that feeds the future STP system |
| Audit log retention | Minimum 5 years (MAS regulatory requirement) |
| Backup | Daily database backup |

### 7.5 Browser Support

- Modern browsers only: Chrome (latest 2 versions), Firefox (latest 2 versions), Edge (latest 2 versions)
- No IE11 support required

---

## 8. System Architecture Overview

### 8.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────┐
│              Ops Browser (Web UI)                     │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │ Webhook     │  │ Lookup       │  │ Mapping      ││
│  │ Input       │  │ Result       │  │ Table Mgmt   ││
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘│
└─────────┼─────────────────┼─────────────────┼────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌──────────────────────────────────────────────────────┐
│            Web App (Flask/FastAPI + Auth)             │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ Auth     │  │ Lookup       │  │ Mapping Table  │ │
│  │ Middleware│  │ Service      │  │ Service        │ │
│  └──────────┘  └──────┬───────┘  └───────┬────────┘ │
│                       │                  │          │
│                 ┌─────┴──────────────────┴─────┐    │
│                 │       Audit Service          │    │
│                 └─────────────┬─────────────────┘    │
└───────────────────────────────┼──────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────┐
│              Data Store (PostgreSQL)                   │
│  ┌─────────────────────┐  ┌────────────────────────┐ │
│  │ Fiat Account        │  │ Audit Log              │ │
│  │ Mapping Table       │  │                        │ │
│  └─────────────────────┘  └────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

**Auth integration**: Auth middleware handles Ops login (session- or token-based). Operations Analyst vs Admin roles enforced at service layer.

### 8.2 Component Description

| Component | Responsibility |
|-----------|---------------|
| **Web App (Flask/FastAPI)** | Serves the web UI, handles auth, routes API requests. |
| **Auth Middleware** | Ops login, session management, role-based access control. |
| **Lookup Service** | Parse webhook JSON, query mapping table, format output. |
| **Mapping Table Service** | CRUD operations for the Fiat Account Mapping Reference Table. Bulk upload with validation. Search/filter logic. |
| **Audit Service** | Append-only event logger. Records all user actions with full input/output snapshots. |
| **Data Store** | PostgreSQL — same database engine as the future STP system for compatibility. The mapping table schema matches STP PRD §7.4 exactly. |

### 8.3 Deployment

**Recommendation**: Standalone web application (Python FastAPI + lightweight frontend or server-rendered templates). Deployed as a simple web service accessible within the internal network.

This approach:
- Isolates development from the CAMP Admin release cycle
- Uses the same database engine (PostgreSQL) as the future STP system
- Can share the same database instance (separate schema) or a separate database — Engineering decision
- The mapping table schema is identical to STP PRD §7.4, enabling direct consumption by the STP rule engine later

### 8.4 NameMatchService Module Design (Phase 2)

The NameMatchService module should be implemented as a standalone, stateless, pure function, shared with the full STP system. It is **not required for this tool's Phase 1** but is specified here to ensure compatibility.

```python
class MatchResult:
    score: float                    # [0.0, 1.0] normalized match score
    normalized_name_a: str          # normalized input A
    normalized_name_b: str          # normalized input B
    method: str                     # match method: exact | subset | token_fuzzy | pinyin
    details: dict                   # debug details: token breakdown, match matrix

class NameMatchOptions:
    enable_transliteration: bool    # ASCII transliteration (default true)
    enable_pinyin: bool             # Chinese pinyin matching (default true)
    user_type: str                  # "individual" | "enterprise"
    custom_abbreviations: dict      # additional abbreviation mappings

def calculate_name_match_score(
    sender_name: str,
    client_name: str,
    options: NameMatchOptions = None
) -> MatchResult:
    """
    Compare sender name against client registered name.
    Returns MatchResult with score and token-level breakdown.
    """
    pass
```

**Key design properties**:
- Zero external dependencies (no API calls, no ML models)
- Stateless — pure function, idempotent
- Same codebase for both this tool and the future STP system
- Chinese pinyin matching for personal names only (per STP PRD §7.2)
- Configurable thresholds via parameters, not hardcoded
- Returns token-level match details for explainability

---

## 9. Release Strategy

### 9.1 Phasing

| Phase | Features | Timeline | Success Gate |
|-------|----------|----------|-------------|
| **Phase 1 — MVP** | Webhook input & parsing, mapping table query, human-readable output (Sections 1, 2, 4 only — no classification), mapping table CRUD, GLDB bulk upload, basic audit logging | 2-3 weeks | Ops can paste a webhook and see payee info. Mapping table is populated and maintained. |
| **Phase 2 — Classification** | Same-name verification (NameMatchService), 1st/3rd party classification, token-level breakdown, classification section in output summary | +1-2 weeks | NameMatchService correctly classifies known test cases. |
| **Phase 3 — Polish** | Audit log admin views, export capabilities, authentication integration, performance tuning, Ops feedback incorporation | +1 week | All acceptance criteria pass. Ops team sign-off. |

### 9.2 Rollout Plan

1. **Internal demo**: Engineering team demos the tool to Product and Ops lead
2. **Pilot**: 2-3 Ops staff use the tool for 1 week alongside their existing workflow
3. **Feedback**: Collect feedback on output format, missing features, UX issues
4. **Refine**: Address Phase 3 feedback items
5. **Full adoption**: All Ops staff use the tool as primary GLDB deposit processing tool

### 9.3 Migration Path to Full STP

| Artifact | How It Carries Forward |
|----------|----------------------|
| **Fiat Account Mapping Reference Table** | Same table, same schema (STP PRD §7.4) — consumed by STP rule engine Step 2 |
| **NameMatchService Module** (Phase 2) | Extracted as shared library — consumed by STP rule engine Step 6 |
| **Operator familiarity** | Ops already familiar with the lookup concepts when STP launches |
| **Webhook field mappings** | Field parsing logic reusable by STP webhook ingestion |

---

## 10. Success Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|------------|
| Ops lookup time per GLDB deposit | 5-15 min | <1 min | Tool-embedded timer (webhook paste → output displayed) |
| Mapping table coverage | Sparse spreadsheets | >90% of active GLDB accounts mapped | Mapping table row count vs known GLDB accounts |
| Ops satisfaction | N/A | >80% of Ops prefer tool over manual process | Ops survey |
| Daily active users | 0 | All Ops staff processing GLDB deposits use the tool | Tool analytics |

---

## 11. Open Questions & Resolutions

The following questions have been reviewed for the lightweight MVP scope. Resolutions are chosen to minimize complexity while maintaining STP compatibility.

| # | Item | Owner | Resolution |
|---|------|-------|------------|
| 1 | Tech stack choice: standalone web app vs CAMP Admin plugin? | Engineering | **Standalone web app** (FastAPI + simple frontend or Jinja2 templates). Fastest to build, independent of CAMP release cycle. Database uses PostgreSQL (same engine as STP). |
| 2 | Authentication mechanism? | Engineering / Ops | **Simple username/password for MVP**, or reuse existing internal SSO if available. Role-based: Ops Analyst (lookup only), Ops Admin (CRUD + upload). |
| 3 | Database: same PostgreSQL as STP or separate? | Engineering | **Same PostgreSQL instance, separate schema or database**. Keeps schema identical for STP compatibility while allowing independent deployment. |
| 4 | GLDB bulk upload file format confirmed? | Ops | Ops to provide a sample file. Tool provides a downloadable template with correct column headers. Accept .xlsx, .xls, .csv. |
| 5 | Should lookup history be stored separately from audit? | Ops / Product | **Audit-only for now**. All webhook lookups logged to the audit log (5-year retention). No separate lookup history store. |
| 6 | Chinese pinyin matching scope? | Product / Compliance | **Personal names only** — per STP PRD §7.2. Enterprise Chinese names use registered English name. Not needed for tool's Phase 1 but ensures algorithm compatibility. |
| 7 | Should Reference Code be editable in mapping table? | Product | **Keep read-only** — per STP PRD §7.4. System-populated field. Not needed for Phase 1. |
| 8 | Classification thresholds (0.85 / 0.5): confirm or configurable? | Product / Compliance | **Configurable** via settings/database (not hardcoded). Defaults per STP PRD: ≥0.85 (1st), 0.5-0.85 (ambiguous), <0.5 (3rd). Not used in Phase 1 — resolved before Phase 2. |

---

## 12. Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Mapping table bulk upload format mismatch with GLDB file | Medium | Medium | Provide downloadable template. Show clear validation errors per row. Support CSV and Excel formats. |
| Tool diverges from STP mapping table schema | Low | High | Lock schema to match STP PRD §7.4 exactly. Schema changes in STP PRD must be synced to this tool before implementation. |
| Ops bypasses tool and continues manual process | Medium | Medium | Tool must be clearly faster than manual process. Incorporate Ops feedback during Pilot phase. |
| NameMatchService module diverges from STP implementation | Low | Medium | Share the same module/package from day one. Both tool and STP system import from the same codebase. |

---

## 13. Appendix

### A. Sample Webhook (GLDB)

```json
{
  "acctNo": "11020018879",
  "amount": "4000617.16",
  "coreTradeSerlNo": "0209131107FF",
  "currencyTypeCd": "USD",
  "direction": "I",
  "eventReference": "8597a46f-4852-4f56-b6c5-b6bb3d5265bd",
  "paymentRef": "SGL26107FKFBLDCC",
  "receiverAcctNm": "METACOMP PTE. LTD.",
  "receiverAcctNo": "11020018879",
  "receiverBankCd": "GLDTSGSG",
  "remark": "OPENFX - 7138496A-6323-4AD8-8179-5FF4C834C6F8",
  "senderAcctNm": "RED ENVELOPE ALPHA INC",
  "senderAcctNo": "4395608",
  "senderBankCd": "",
  "source": "SWIFTMX",
  "tradeDate": "20260417",
  "tradeTime": "203810598",
  "valueDate": "20260420"
}
```

> **Note**: `tradeTime` value `203810598` is the raw GLDB timestamp format. Displayed as-is in the tool for Ops reference.

### B. Sample Output Scenarios

#### Scenario 1: Payee Found
- Webhook: acctNo = "11020018879"
- Mapping table: Client name = "ACME PTE. LTD."
- Result: Payee FOUND
- Action: Proceed to manual booking with client identified

#### Scenario 2: Payee Not Found
- Webhook: acctNo = "99999999999" (no mapping entry)
- Result: Payee NOT FOUND
- Action: Ops investigates account number, checks GLDB portal, updates mapping table

#### Scenario 3: Multiple Account Types (Phase 1)
- Webhook: acctNo = "11020018879"
- Mapping table: Two entries — Fiat (USD) and Investment Fiat (USD)
- Result: Payee FOUND with 2 matches. Ops selects correct Account Type.
- Action: Ops selects Fiat or Investment Fiat based on the deposit context, then proceeds to manual booking.

### C. References

- `outputs/fiat-deposit-automation-stp-prd.md` — Full STP PRD (Fiat Account Mapping Reference Table §7.4, 1st/3rd Party Classification §7.2)
- `design/name-match-score-algorithm.md` — Detailed NameMatchService algorithm design
- `fiat-deposit-brd/` — Reference webhook payloads for all payment channels

### D. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.1 | 2026-06-05 | Lightweight rewrite: removed Phase 2 classification from MVP scope, fixed logical inconsistencies (NameMatchService interface, retention policy, auto-parse spec), resolved open questions with lightweight decisions, aligned mapping table schema with STP PRD §7.4 |
| 1.0 | 2026-06-05 | Initial PRD — standalone tool spec derived from full STP PRD context |
