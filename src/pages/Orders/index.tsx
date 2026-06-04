// @ts-nocheck
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CdsPageHeader, CdsPillTabs } from '../../components/cds'
import type { BreadcrumbItem } from '../../components/cds'
import AllOrders from './AllOrders'
import AbnormalOrders from './AbnormalOrders'

const BREADCRUMBS: BreadcrumbItem[] = [{ label: 'Order Management' }]

const TABS = [
  { value: 'all',      label: 'All Orders' },
  { value: 'abnormal', label: 'Abnormal Orders' },
]

export default function OrderManagement() {
  const { t } = useTranslation()
  const [tab, setTab] = useState('all')

  return (
    <div className="flex flex-col gap-4">
      <CdsPageHeader
        breadcrumb={BREADCRUMBS}
        title="Order Management"
      />
      <CdsPillTabs value={tab} onChange={setTab} items={TABS} />
      {tab === 'all' ? <AllOrders embedded /> : <AbnormalOrders embedded />}
    </div>
  )
}
