// @ts-nocheck
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Download } from 'lucide-react'
import {
  CdsPageHeader, CdsPillTabs, CdsButton,
  CdsTable, CdsTableState, CdsPagination, CdsStatusState, useToast,
} from '../../components/cds'
import type { BreadcrumbItem } from '../../components/cds'
import { useReconResults } from '../../services/hooks'
import { ReconFilters } from './shared/ReconFilters'
import { buildReconColumns } from './shared/columns'
import { ReconDetailModal, ResolveModal } from './shared/ReconModals'
import { CycleResultsTab } from './shared/CycleResultsTab'
import {
  toReconQuery, hasReconFilters, EMPTY_RECON_FILTERS,
} from './shared/helpers'

const BREADCRUMBS: BreadcrumbItem[] = [{ label: 'Reconciliation Report' }]
const PER_PAGE_DEFAULT = 20

/* ─── Open / Resolved tab body (shared list pattern) ───────────── */
function ResultsTab({ tab, t }) {
  const toast = useToast()
  const [filters, setFilters] = useState(EMPTY_RECON_FILTERS)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PER_PAGE_DEFAULT)

  const [detail, setDetail] = useState(null)
  const [resolveTarget, setResolveTarget] = useState(null)

  const resolved = tab === 'resolved' ? 'resolved' : 'open'
  const { data, isLoading, isFetching, isError, refetch } = useReconResults({
    resolved,
    ...toReconQuery(filters),
    page,
    per_page: pageSize,
  })

  const rows       = data?.items ?? []
  const total      = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const hasQuery   = hasReconFilters(filters)

  const columns = useMemo(
    () => buildReconColumns({ variant: tab === 'resolved' ? 'resolved' : 'open', onResolve: setResolveTarget, t }),
    [tab, t],
  )

  const handleExport = () => toast.show(t('recon.export.done'))

  return (
    <div className="flex flex-col gap-4">
      <ReconFilters
        tab={resolved}
        applied={filters}
        onApply={(next) => { setFilters(next); setPage(1) }}
        onReset={() => { setFilters(EMPTY_RECON_FILTERS); setPage(1) }}
        t={t}
      />

      <div className="flex justify-end">
        <CdsButton variant="ghost" size="sm" icon={<Download size={15} />} onClick={handleExport}>
          {t('recon.export.button')}
        </CdsButton>
      </div>

      <CdsTableState isLoading={isLoading} isFetching={isFetching} isError={isError} onRetry={refetch}>
        {rows.length === 0
          ? <CdsStatusState type={hasQuery ? 'no-results' : 'empty'}
              title={tab === 'resolved' ? t('recon.empty.resolved') : t('recon.empty.open')} />
          : (
            <>
              <CdsTable
                columns={columns}
                data={rows}
                rowKey="id"
                hover
                stickyHeader
                onRowClick={setDetail}
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

      <ReconDetailModal
        result={detail}
        open={!!detail}
        onClose={() => setDetail(null)}
        onResolve={(r) => { setDetail(null); setResolveTarget(r) }}
        t={t}
      />
      <ResolveModal result={resolveTarget} open={!!resolveTarget} onClose={() => setResolveTarget(null)} t={t} />
    </div>
  )
}

export default function Reconciliation() {
  const { t } = useTranslation()
  const [tab, setTab] = useState('open')

  const TABS = [
    { value: 'open',     label: t('recon.tab.open') },
    { value: 'cycle',    label: t('recon.tab.cycle') },
    { value: 'resolved', label: t('recon.tab.resolved') },
  ]

  return (
    <div className="flex flex-col gap-6">
      <CdsPageHeader
        breadcrumb={BREADCRUMBS}
        title={t('recon.title')}
        subtitle={t('recon.subtitle')}
      />
      <CdsPillTabs value={tab} onChange={setTab} items={TABS} />

      {tab === 'cycle'
        ? <CycleResultsTab t={t} />
        : <ResultsTab key={tab} tab={tab} t={t} />}
    </div>
  )
}
