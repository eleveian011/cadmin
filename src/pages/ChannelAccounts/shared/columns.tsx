// @ts-nocheck
import {
  CdsStatusTag, CdsCopyButton, CdsTooltip,
} from '../../../components/cds'
import {
  STATUS_TONE, isExceptionStatus,
} from './helpers'

/* ─── Status badge with exception tooltip ───────────────────── */

function StatusBadge({ status, label, t }) {
  const badge = <CdsStatusTag tone={STATUS_TONE[status]}>{label}</CdsStatusTag>
  if (!isExceptionStatus(status)) return badge
  return (
    <CdsTooltip content={t('channelAccount.exception.tooltip', { status: label })}>
      <span className="inline-flex items-center gap-1">
        {badge}
      </span>
    </CdsTooltip>
  )
}

/**
 * Build the ordered column array for the Channel Accounts table (§7.4 display columns).
 * `onToggleMapping` flips the inline Active/Inactive switch; row actions are wired
 * through onView / onEdit / onDelete via the RowActions component (passed by caller
 * as the `actionsCell` render prop to keep this factory presentation-only).
 */
export function buildChannelAccountColumns({ hiddenCols, onToggleMapping, actionsCell, t }) {
  const has = (k: string) => hiddenCols?.has(k)

  const channel = {
    key: 'payment_channel', header: t('channelAccount.col.channel'), width: '150px',
    render: (_, row) => <span className="type-body text-(--text)">{row.payment_channel}</span>,
  }
  const accountType = {
    key: 'account_type', header: t('channelAccount.col.accountType'), width: '140px',
    hidden: has('account_type'),
    render: (_, row) => (
      <span className="type-body text-(--text)">{t(`channelAccount.accountType.${row.account_type}`)}</span>
    ),
  }
  const channelAccountNumber = {
    key: 'channel_account_number', header: t('channelAccount.col.channelAccountNumber'), width: '200px',
    render: (_, row) => (
      <span className="flex items-center gap-1.5 min-w-0">
        <CdsTooltip content={row.channel_account_number}>
          <span className="type-body text-(--text) tabular-nums truncate">{row.channel_account_number}</span>
        </CdsTooltip>
        <CdsCopyButton text={row.channel_account_number} />
      </span>
    ),
  }
  const referenceCode = {
    key: 'reference_code', header: t('channelAccount.col.referenceCode'), width: '150px',
    hidden: has('reference_code'),
    render: (_, row) => row.reference_code
      ? <span className="type-body text-(--muted) tabular-nums">{row.reference_code}</span>
      : <span className="text-(--subtle)">—</span>,
  }
  const userChannelAccountNumber = {
    key: 'user_channel_account_number', header: t('channelAccount.col.userChannelAccountNumber'), width: '180px',
    hidden: has('user_channel_account_number'),
    render: (_, row) => (
      <span className="flex items-center gap-1.5 min-w-0">
        <CdsTooltip content={row.user_channel_account_number}>
          <span className="type-body text-(--text) tabular-nums truncate">{row.user_channel_account_number}</span>
        </CdsTooltip>
        <CdsCopyButton text={row.user_channel_account_number} />
      </span>
    ),
  }
  const currency = {
    key: 'currency', header: t('channelAccount.col.currency'), width: '120px',
    hidden: has('currency'),
    render: (_, row) => <span className="type-body font-bold text-(--text)">{row.currency.join(', ')}</span>,
  }
  const clientName = {
    key: 'client_name', header: t('channelAccount.col.clientName'), width: '200px',
    render: (_, row) => <span className="type-body text-(--text) truncate">{row.client_name}</span>,
  }
  const participantCode = {
    key: 'participant_code', header: t('channelAccount.col.participantCode'), width: '150px',
    hidden: has('participant_code'),
    render: (_, row) => <span className="type-body text-(--muted)">{row.participant_code ?? '—'}</span>,
  }
  const participantStatus = {
    key: 'participant_status', header: t('channelAccount.col.clientStatusCol'), width: '140px',
    render: (_, row) => <StatusBadge status={row.participant_status} label={t(`channelAccount.clientStatus.${row.participant_status}`)} t={t} />,
  }
  const mappingStatus = {
    key: 'mapping_status', header: t('channelAccount.col.channelAccountStatus'), width: '160px',
    render: (_, row) => (
      <CdsStatusTag tone={row.mapping_status === 'active' ? 'success' : 'neutral'}>
        {t(`channelAccount.mappingStatus.${row.mapping_status}`)}
      </CdsStatusTag>
    ),
  }
  const actions = {
    key: '_actions', header: '', width: '1%', frozen: 'right',
    render: (_, row) => actionsCell(row),
  }

  // Column order mirrors the filter field order (§7.4):
  // Channel · Account Type · Channel Account Number · Internal · Client/Participant ·
  // Reference Code · Currency · Client Status · Channel Account Status.
  return [
    channel, accountType,
    userChannelAccountNumber, channelAccountNumber,
    clientName, participantCode,
    referenceCode, currency,
    participantStatus, mappingStatus,
    actions,
  ]
}

