// @ts-nocheck
import { AlertTriangle, Ban } from 'lucide-react'
import {
  CdsModal, CdsBadge, CdsStatusTag, CdsCopyButton, CdsDetailList, CdsDetailRow,
} from '../../../components/cds'
import {
  STATUS_TONE, CHANNEL_TONE, ACCOUNT_TYPE_TONE, fmtDate,
  isExceptionStatus, hasStatusException,
} from './helpers'

/* ─── Bank-info row (matches the provided DOM: label/value + copy button) ──── */

function InfoRow({ label, value }) {
  const empty = value == null || value === '' || value === '—'
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-(--border) last:border-b-0">
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="type-caption text-(--muted)">{label}</span>
        <span className="type-body font-bold text-(--text) wrap-break-word">
          {empty ? <span className="font-normal text-(--subtle)">—</span> : value}
        </span>
      </div>
      {!empty && <CdsCopyButton text={String(value)} />}
    </div>
  )
}

/** Grouped, bordered card of InfoRows — the "Bank Information" pattern. */
function InfoCard({ title, children }) {
  return (
    <div>
      <div className="type-caption font-semibold text-(--muted) uppercase tracking-wide mb-2">{title}</div>
      <div className="rounded-md border border-(--border) px-3">{children}</div>
    </div>
  )
}

/* ─── Status exception banner (§7.4 detail view) ────────────── */

function ExceptionBanner({ account, t }) {
  const blocking = []
  if (isExceptionStatus(account.participant_status)) blocking.push({ key: 'participant', status: account.participant_status })
  if (!blocking.length) return null

  return (
    <div className="rounded-lg border border-(--danger-border) bg-(--danger-bg) p-4">
      <div className="flex items-center gap-2 mb-2">
        <Ban size={16} className="text-(--danger) shrink-0" />
        <span className="type-body font-semibold text-(--danger)">{t('channelAccount.exception.bannerTitle')}</span>
      </div>
      <div className="flex flex-wrap gap-2 mb-2">
        {blocking.map(b => (
          <CdsBadge key={b.key} tone={STATUS_TONE[b.status]}>
            {t(`channelAccount.statusField.${b.key}`)}: {t(`channelAccount.clientStatus.${b.status}`)}
          </CdsBadge>
        ))}
      </div>
      <p className="type-body-sm text-(--muted)">{t('channelAccount.exception.bannerAction')}</p>
    </div>
  )
}
// DETAIL_MODAL_BODY

/* ─── Audit-log labels + timeline (mirrors Task Center audit trail) ────────── */

const AUDIT_LABEL: Record<string, string> = {
  ACCOUNT_CREATED:        'created',
  ACCOUNT_UPDATED:        'updated',
  ACCOUNT_MAPPING_STATUS: 'mappingStatus',
  ACCOUNT_ARCHIVED:       'archived',
  ACCOUNT_BULK_CREATED:   'bulkCreated',
  ACCOUNT_BULK_UPDATED:   'bulkUpdated',
}

function titleCase(s: string) {
  return s.toLowerCase().split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function AuditTimeline({ history, t }) {
  if (!history?.length) return <p className="type-body-sm text-(--subtle)">{t('channelAccount.detail.noAudit')}</p>
  return (
    <div className="relative" style={{ paddingLeft: '24px' }}>
      {[...history].reverse().map((entry, i, arr) => (
        <div key={i} className="relative flex flex-col gap-0.5 pb-4 last:pb-0">
          {i < arr.length - 1 && (
            <div className="absolute border-l border-(--border-strong)" style={{ left: '-19px', top: '15px', bottom: '0' }} />
          )}
          {i > 0 && (
            <div className="absolute border-l border-(--border-strong)" style={{ left: '-19px', top: '0', height: '4px' }} />
          )}
          <div
            className={`absolute rounded-full border-2 border-(--surface) ${i === 0 ? 'bg-(--success)' : 'bg-(--border-strong)'}`}
            style={{ width: '11px', height: '11px', left: '-24px', top: '4px' }}
          />
          <div className="flex items-center justify-between">
            <span className="type-body font-bold text-(--text)">{entry.actorName}</span>
            <span className="type-caption text-(--subtle)">{fmtDate(entry.timestamp)}</span>
          </div>
          <span className="type-body text-(--muted)">
            {AUDIT_LABEL[entry.action] ? t(`channelAccount.audit.${AUDIT_LABEL[entry.action]}`) : titleCase(entry.action)}
          </span>
          {entry.comment && <span className="type-body-sm text-(--subtle)">{entry.comment}</span>}
        </div>
      ))}
    </div>
  )
}

/* ─── Detail Modal ──────────────────────────────────────────── */

export function AccountDetailModal({ account, open, onClose, t }) {
  if (!account) return null

  const exception = hasStatusException(account.participant_status)
  const ruleActive = account.mapping_status === 'active' && !exception

  return (
    <CdsModal open={open} onClose={onClose} size="2xl" headerMode="close" title={t('channelAccount.detail.title')} dismissOnBackdrop>
      <div className="flex flex-col gap-5">
        {/* Summary header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <span className="type-h4 font-semibold text-(--text) tabular-nums">{account.channel_account_number}</span>
            <CdsCopyButton text={account.channel_account_number} />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <CdsBadge tone={CHANNEL_TONE[account.payment_channel] ?? 'neutral'}>{account.payment_channel}</CdsBadge>
            <CdsBadge tone={ACCOUNT_TYPE_TONE[account.account_type] ?? 'neutral'}>{t(`channelAccount.accountType.${account.account_type}`)}</CdsBadge>
            <CdsStatusTag tone={account.mapping_status === 'active' ? 'success' : 'neutral'}>
              {t(`channelAccount.mappingStatus.${account.mapping_status}`)}
            </CdsStatusTag>
          </div>
        </div>

        {/* Exception banner (if blocking) */}
        <ExceptionBanner account={account} t={t} />

        {/* Rule engine impact indicator */}
        <div className={`flex items-center gap-2 rounded-md px-3 py-2.5 ${ruleActive ? 'bg-(--success-bg)' : 'bg-(--fill)'}`}>
          {ruleActive
            ? <span className="type-body-sm text-(--success-text) font-medium">{t('channelAccount.detail.ruleActive')}</span>
            : <span className="flex items-center gap-1.5 type-body-sm text-(--muted)"><AlertTriangle size={14} /> {t('channelAccount.detail.ruleBlocked')}</span>}
        </div>

        {/* Mapping fields + bank details (bank info is part of the channel account) */}
        <div>
          <div className="type-body-sm font-semibold text-(--text) mb-2.5">{t('channelAccount.detail.mapping')}</div>
          <CdsDetailList>
            <CdsDetailRow label={t('channelAccount.col.userChannelAccountNumber')} value={account.user_channel_account_number} copyText={account.user_channel_account_number} />
            {account.channel_account_number && (
              <CdsDetailRow label={t('channelAccount.col.channelAccountNumber')} value={account.channel_account_number} copyText={account.channel_account_number} />
            )}
            <CdsDetailRow label={t('channelAccount.col.accountType')} value={t(`channelAccount.accountType.${account.account_type}`)} />
            <CdsDetailRow label={t('channelAccount.col.referenceCode')} value={account.reference_code ?? '—'} />
            <CdsDetailRow label={t('channelAccount.col.currency')} value={account.currency.join(', ')} />
            <CdsDetailRow label={t('channelAccount.bank.bankName')} value={account.bank_details.bank_name} />
            <CdsDetailRow label={t('channelAccount.bank.accountNumber')} value={account.bank_details.account_number} copyText={account.bank_details.account_number} />
            <CdsDetailRow label={t('channelAccount.bank.swiftCode')} value={account.bank_details.swift_code} />
            <CdsDetailRow label={t('channelAccount.bank.countryCode')} value={account.bank_details.country_code} />
            <CdsDetailRow label={t('channelAccount.bank.bankAddress')} value={account.bank_details.bank_address} />
          </CdsDetailList>
        </div>

        {/* Client identity */}
        <div>
          <div className="type-body-sm font-semibold text-(--text) mb-2.5">{t('channelAccount.detail.client')}</div>
          <CdsDetailList>
            <CdsDetailRow label={t('channelAccount.col.clientName')} value={account.client_name} />
            <CdsDetailRow label={t('channelAccount.col.participantCode')} value={account.participant_code ?? '—'} />
            <CdsDetailRow
              label={t('channelAccount.col.clientStatusCol')}
              value={<CdsStatusTag tone={STATUS_TONE[account.participant_status]}>{t(`channelAccount.clientStatus.${account.participant_status}`)}</CdsStatusTag>}
            />
          </CdsDetailList>
        </div>

        {account.intermediary_bank && (
          <InfoCard title={t('channelAccount.bank.intermediary')}>
            <InfoRow label={t('channelAccount.bank.bankName')} value={account.intermediary_bank.bank_name} />
            <InfoRow label={t('channelAccount.bank.swiftCode')} value={account.intermediary_bank.swift_code} />
            <InfoRow label={t('channelAccount.bank.countryCode')} value={account.intermediary_bank.country_code} />
            <InfoRow label={t('channelAccount.bank.bankAddress')} value={account.intermediary_bank.bank_address} />
          </InfoCard>
        )}

        {/* Audit log */}
        <div>
          <div className="type-body-sm font-semibold text-(--text) mb-2.5">{t('channelAccount.detail.audit')}</div>
          <AuditTimeline history={account.history} t={t} />
        </div>
      </div>
    </CdsModal>
  )
}

