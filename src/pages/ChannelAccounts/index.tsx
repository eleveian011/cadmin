// @ts-nocheck
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Upload, Trash2 } from 'lucide-react'
import {
  CdsPageHeader, CdsButton,
  CdsTable, CdsTableState, CdsPagination, CdsStatusState,
  CdsDialog, useToast,
} from '../../components/cds'
import type { BreadcrumbItem } from '../../components/cds'
import {
  useChannelAccounts, useSetMappingStatus, useDeleteChannelAccount,
} from '../../services/hooks'
import type { ChannelAccount } from '../../types/channel-account'
import { buildChannelAccountColumns } from './shared/columns'
import { RowActions } from './shared/RowActions'
import { AccountFilters } from './shared/AccountFilters'
import { toAccountQuery, hasAccountFilters, EMPTY_ACCOUNT_FILTERS } from './shared/helpers'
import { AccountDetailModal } from './shared/AccountDetailModal'
import { AccountFormModal } from './shared/AccountFormModal'
import { BulkUploadModal } from './shared/BulkUploadModal'

const BREADCRUMBS: BreadcrumbItem[] = [{ label: 'Fiat Account Mapping Reference Table' }]
const PER_PAGE_DEFAULT = 20

export default function ChannelAccounts() {
  const { t } = useTranslation()
  const toast  = useToast()
  const setMapping = useSetMappingStatus()
  const deleteAcct = useDeleteChannelAccount()

  // Filter board state — draft lives in AccountFilters; committed on Apply.
  const [filters,  setFilters]  = useState(EMPTY_ACCOUNT_FILTERS)
  const [page,     setPage]     = useState(1)
  const [pageSize, setPageSize] = useState(PER_PAGE_DEFAULT)

  // Modal targets
  const [detailAcct, setDetailAcct] = useState<ChannelAccount | null>(null)
  const [formAcct,   setFormAcct]   = useState<ChannelAccount | null>(null)
  const [formOpen,   setFormOpen]   = useState(false)
  const [deleteAcctTarget, setDeleteAcctTarget] = useState<ChannelAccount | null>(null)
  const [bulkOpen,   setBulkOpen]   = useState(false)

  const { data, isLoading, isFetching, isError, refetch } = useChannelAccounts({
    ...toAccountQuery(filters),
    page,
    per_page: pageSize,
  })

  const rows       = data?.items ?? []
  const total      = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const hasQuery   = hasAccountFilters(filters)

  const handleApply = (next) => { setFilters(next); setPage(1) }
  const handleReset = () => { setFilters(EMPTY_ACCOUNT_FILTERS); setPage(1) }

  const handleToggleMapping = (row: ChannelAccount, status: 'active' | 'inactive') => {
    setMapping.mutateAsync({ id: row.id, status })
      .then(() => toast.show(status === 'active' ? t('channelAccount.toast.mappingActivated') : t('channelAccount.toast.mappingDeactivated')))
      .catch(e => toast.show(e?.message || 'Failed to update mapping'))
  }

  const handleDelete = () => {
    if (!deleteAcctTarget) return
    deleteAcct.mutateAsync(deleteAcctTarget.id)
      .then(() => { toast.show(t('channelAccount.toast.deleted')); setDeleteAcctTarget(null) })
      .catch(e => toast.show(e?.message || 'Failed to delete'))
  }

  const openAdd  = () => { setFormAcct(null); setFormOpen(true) }
  const openEdit = (row: ChannelAccount) => { setFormAcct(row); setFormOpen(true) }

  const columns = useMemo(
    () => buildChannelAccountColumns({
      hiddenCols: new Set(),
      onToggleMapping: handleToggleMapping,
      actionsCell: (row) => (
        <RowActions row={row} onEdit={openEdit} onDelete={setDeleteAcctTarget} t={t} />
      ),
      t,
    }),
    [t], // handlers are stable enough for the demo; rebuild on locale change
  )

  return (
    <div className="flex flex-col gap-6">
      <CdsPageHeader
        breadcrumb={BREADCRUMBS}
        title={t('channelAccount.title')}
        subtitle={t('channelAccount.subtitle')}
        actions={
          <div className="flex items-center gap-2">
            <CdsButton variant="ghost" size="md" icon={<Upload size={16} />} onClick={() => setBulkOpen(true)}>
              {t('channelAccount.actions.bulkUpload')}
            </CdsButton>
            <CdsButton variant="primary" size="md" icon={<Plus size={16} />} onClick={openAdd}>
              {t('channelAccount.actions.addEntry')}
            </CdsButton>
          </div>
        }
      />

      <AccountFilters applied={filters} onApply={handleApply} onReset={handleReset} count={total} t={t} />

      <CdsTableState isLoading={isLoading} isFetching={isFetching} isError={isError} onRetry={refetch}>
        {rows.length === 0
          ? <CdsStatusState type={hasQuery ? 'no-results' : 'empty'} title={t('channelAccount.empty')} description={t('channelAccount.emptyDesc')} />
          : (
            <>
              <CdsTable
                columns={columns}
                data={rows}
                rowKey="id"
                hover
                stickyHeader
                onRowClick={setDetailAcct}
              />
              <CdsPagination
                page={page}
                totalPages={totalPages}
                onChange={setPage}
                pageSize={pageSize}
                onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
              />
            </>
          )
        }
      </CdsTableState>

      <AccountDetailModal account={detailAcct} open={!!detailAcct} onClose={() => setDetailAcct(null)} t={t} />

      <AccountFormModal account={formAcct} open={formOpen} onClose={() => { setFormOpen(false); setFormAcct(null) }} t={t} />

      <BulkUploadModal open={bulkOpen} onClose={() => setBulkOpen(false)} t={t} />

      <CdsDialog
        open={!!deleteAcctTarget}
        onClose={() => setDeleteAcctTarget(null)}
        icon={<Trash2 />}
        tone="danger"
        title={t('channelAccount.delete.title')}
        description={deleteAcctTarget ? t('channelAccount.delete.desc', { account: deleteAcctTarget.channel_account_number }) : ''}
        confirmLabel={t('channelAccount.actions.delete')}
        confirmVariant="danger"
        onConfirm={handleDelete}
        confirmLoading={deleteAcct.isPending}
        cancelLabel={t('common.cancel')}
        onCancel={() => setDeleteAcctTarget(null)}
      />
    </div>
  )
}
