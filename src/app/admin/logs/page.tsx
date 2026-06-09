import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/admin/dashboard/PageHeader'
import { LogsClient } from '@/components/admin/logs/LogsClient'

export const metadata: Metadata = {
  title: 'Registro · Admin · FARMAU',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function AdminLogsPage() {
  const t = await getTranslations('Admin.logs')

  return (
    <>
      <PageHeader
        crumbs={[
          { label: 'Admin', href: '/admin' },
          { label: t('crumb') },
        ]}
        title={t('title')}
      />
      <div className="bg-sand-100 px-5 lg:px-8 py-6 lg:py-7 min-h-[calc(100vh-90px)]">
        <div className="max-w-[1240px] mx-auto">
          <LogsClient />
        </div>
      </div>
    </>
  )
}
