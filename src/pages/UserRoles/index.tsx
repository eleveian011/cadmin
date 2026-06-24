// @ts-nocheck
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { CdsPageHeader, CdsTabs, CdsTableState, CdsStatusState } from '../../components/cds'
import type { BreadcrumbItem } from '../../components/cds'
import { useRoles } from '../../services/hooks'
import { RolePanel } from './shared/RolePanel'

const BREADCRUMBS: BreadcrumbItem[] = [{ label: 'Manage User Role' }]

export default function UserRoles() {
  const { t } = useTranslation()
  const { data: roles, isLoading, isFetching, isError, refetch } = useRoles()

  const [activeKey, setActiveKey] = useState('maker')

  // Keep the selected tab valid once roles load.
  useEffect(() => {
    if (roles?.length && !roles.some(r => r.key === activeKey)) setActiveKey(roles[0].key)
  }, [roles])

  const tabs = (roles ?? []).map(r => ({ value: r.key, label: r.name }))
  const activeRole = roles?.find(r => r.key === activeKey)

  return (
    <div className="flex flex-col gap-6">
      <CdsPageHeader
        breadcrumb={BREADCRUMBS}
        title={t('userRole.title')}
        subtitle={t('userRole.subtitle')}
      />

      <CdsTableState isLoading={isLoading} isFetching={isFetching} isError={isError} onRetry={refetch}>
        {!roles?.length
          ? <CdsStatusState type="empty" />
          : (
            <div className="flex flex-col gap-6">
              <CdsTabs value={activeKey} onChange={setActiveKey} items={tabs} className="self-start" />
              {activeRole && <RolePanel key={activeRole.key} role={activeRole} t={t} />}
            </div>
          )
        }
      </CdsTableState>
    </div>
  )
}
