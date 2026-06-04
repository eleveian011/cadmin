// @ts-nocheck
import { AlertTriangle } from 'lucide-react'
import {
  CdsStatusTag, CdsSwitch, CdsCopyButton, CdsTooltip,
} from '../../../components/cds'
import {
  STATUS_TONE, hasStatusException, isExceptionStatus,
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

  // Leading header-less column: carries the status-exception indicator so the
  // signal sits at the row start, separate from the data columns.
  const exceptionFlag = {
    key: '_exception', header: '', width: '44px', frozen: 'left',
    align: 'center',
    render: (_, row) => {
      if (!hasStatusException(row.participant_status, row.member_status)) return null
      return (
        <CdsTooltip content={t('channelAccount.exception.rowTooltip')}>
          <AlertTriangle size={14} className="shrink-0 text-(--warning-text)" />
        </CdsTooltip>
      )
    },
  }
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
  const mcaAccountNumber = {
    key: 'mca_account_number', header: t('channelAccount.col.mcaAccountNumber'), width: '160px',
    render: (_, row) => <span className="type-body text-(--text) tabular-nums">{row.mca_account_number}</span>,
  }
  const currency = {
    key: 'currency', header: t('channelAccount.col.currency'), width: '90px',
    hidden: has('currency'),
    render: (_, row) => <span className="type-body font-bold text-(--text)">{row.currency}</span>,
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
  const memberId = {
    key: 'member_id', header: t('channelAccount.col.memberId'), width: '140px',
    hidden: has('member_id'),
    render: (_, row) => <span className="type-body text-(--muted)">{row.member_id ?? '—'}</span>,
  }
  const participantStatus = {
    key: 'participant_status', header: t('channelAccount.col.participantStatus'), width: '150px',
    render: (_, row) => <StatusBadge status={row.participant_status} label={t(`channelAccount.clientStatus.${row.participant_status}`)} t={t} />,
  }
  const memberStatus = {
    key: 'member_status', header: t('channelAccount.col.memberStatus'), width: '140px',
    render: (_, row) => <StatusBadge status={row.member_status} label={t(`channelAccount.clientStatus.${row.member_status}`)} t={t} />,
  }
  const mappingStatus = {
    key: 'mapping_status', header: t('channelAccount.col.mappingStatus'), width: '120px',
    frozen: 'left', align: 'center',
    render: (_, row) => (
      <span className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <CdsSwitch
          checked={row.mapping_status === 'active'}
          onChange={(next) => onToggleMapping(row, next ? 'active' : 'inactive')}
          ariaLabel={t('channelAccount.col.mappingStatus')}
        />
      </span>
    ),
  }
  const actions = {
    key: '_actions', header: '', width: '1%', frozen: 'right',
    render: (_, row) => actionsCell(row),
  }

  return [
    exceptionFlag, mappingStatus,
    channel, accountType,
    participantStatus, memberStatus,
    channelAccountNumber, referenceCode, mcaAccountNumber,
    currency, clientName, participantCode, memberId,
    actions,
  ]
}

