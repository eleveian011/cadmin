// @ts-nocheck
import { useState } from 'react'
import { Download } from 'lucide-react'
import { useExport } from '../../../services/hooks'
import {
  CdsButton, CdsModal, CdsStackedListbox, CdsDateRangePicker, useToast,
} from '../../../components/cds'
import { fmtDay } from './helpers'

const EXPORT_STATUS_OPTS = [
  { value: 'all', label: 'All statuses' },
  { value: 'successful', label: 'Successful' },
  { value: 'processing.auto', label: 'Processing (Auto)' },
  { value: 'processing.manual_review', label: 'Processing (Manual)' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
]

/**
 * Export button + modal for the Orders page header. Self-contained: owns its
 * open state, date range, status, and the export mutation.
 */
export function ExportButton({ t }) {
  const toast = useToast()
  const exportMutation = useExport()

  const today         = new Date()
  const thirtyDaysAgo = new Date(today.getTime() - 29 * 86400000)
  const [open,      setOpen]      = useState(false)
  const [status,    setStatus]    = useState('all')
  const [dateRange, setDateRange] = useState({ from: fmtDay(thirtyDaysAgo), to: fmtDay(today) })
  const [error,     setError]     = useState('')

  const handleExport = () => {
    if (!dateRange.from || !dateRange.to) {
      toast.show(t('depositOrder.export.selectRange'))
      return
    }
    setError('')
    const filters: Record<string, string> = { from: dateRange.from, to: dateRange.to }
    if (status !== 'all') filters.status = status
    exportMutation.mutate(
      { type: 'deposit', filters },
      {
        onSuccess: (result) => {
          if (result.download_url) window.open(result.download_url, '_blank')
          setOpen(false)
          toast.show(t('depositOrder.export.ready'))
        },
        onError: (err) => setError(err?.message ?? t('depositOrder.export.failed')),
      }
    )
  }

  return (
    <>
      <CdsButton variant="primary" size="md" icon={<Download size={16} />} onClick={() => setOpen(true)}>
        {t('common.export')}
      </CdsButton>

      <CdsModal
        open={open}
        onClose={() => setOpen(false)}
        size="md"
        headerMode="close"
        title={t('depositOrder.export.title')}
        footer={[{
          label: exportMutation.isPending ? t('depositOrder.export.generating') : t('common.export'),
          onClick: handleExport,
          loading: exportMutation.isPending,
        }]}
        dismissOnBackdrop
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="type-caption font-semibold text-(--text) mb-1 block">
              {t('depositOrder.filter.dateRange')} <span className="text-(--danger)">*</span>
            </label>
            <CdsDateRangePicker size="md" value={dateRange} onChange={setDateRange} />
          </div>
          <div>
            <label className="type-caption font-semibold text-(--text) mb-1 block">{t('depositOrder.filter.status')}</label>
            <CdsStackedListbox size="md" buttonWidthClass="w-full" value={status} onChange={setStatus} options={EXPORT_STATUS_OPTS} />
          </div>
          {error && <span className="type-body-sm text-(--danger)">{error}</span>}
        </div>
      </CdsModal>
    </>
  )
}
