import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/admin/dashboard/PageHeader'
import { BlogClient } from '@/components/admin/blog/BlogClient'

export const metadata: Metadata = {
  title: 'Blog · Admin · FARMAU',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function AdminBlogPage() {
  const t = await getTranslations('Admin.blog')

  return (
    <>
      <PageHeader
        crumbs={[
          { label: 'Admin', href: '/admin' },
          { label: t('title') },
        ]}
        title={t('title')}
      />
      <div className="bg-sand-100 px-5 lg:px-8 py-6 lg:py-7 min-h-[calc(100vh-90px)]">
        <BlogClient />
      </div>
    </>
  )
}
