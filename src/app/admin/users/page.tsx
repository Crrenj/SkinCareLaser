import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/dashboard/PageHeader'
import { UsersClient } from '@/components/admin/users/UsersClient'

export const metadata: Metadata = {
  title: 'Clientes · Admin · FARMAU',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function AdminUsersPage() {
  return (
    <>
      <PageHeader
        crumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Clientes' },
        ]}
        title="Clientes"
      />
      <div className="bg-sand-100 px-5 lg:px-8 py-6 lg:py-7 min-h-[calc(100vh-90px)]">
        <div className="max-w-[1240px] mx-auto">
          <UsersClient />
        </div>
      </div>
    </>
  )
}
