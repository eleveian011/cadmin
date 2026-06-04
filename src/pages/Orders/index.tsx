// @ts-nocheck
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CdsPageHeader, CdsPillTabs } from '../../components/cds'
import type { BreadcrumbItem } from '../../components/cds'
import AllOrders from './AllOrders'
import AbnormalOrders from './AbnormalOrders'
import { ExportButton } from './shared/ExportButton'

const BREADCRUMBS: BreadcrumbItem[] = [{ label: 'Order Management' }]

export default function OrderManagement() {
  const { t } = useTranslation()
  const [tab, setTab] = useState('all')

  const TABS = [
    { value: 'all',      label: t('nav.allOrders') },
    { value: 'abnormal', label: t('nav.abnormalOrders') },
  ]

  return (
    <div className="flex flex-col gap-6">
      <CdsPageHeader
        breadcrumb={BREADCRUMBS}
        title={t('nav.orders')}
        actions={<ExportButton t={t} />}
      />
      <CdsPillTabs value={tab} onChange={setTab} items={TABS} />
      {tab === 'abnormal' ? <AbnormalOrders embedded /> : <AllOrders embedded />}
    </div>
  )
}
