import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/dashboard/PageHeader'
import { NewsletterClient } from '@/components/admin/newsletter/NewsletterClient'

export const metadata: Metadata = {
  title: 'Newsletter · Admin · FARMAU',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function AdminNewsletterPage() {
  return (
    <>
      <PageHeader
        crumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Newsletter' },
        ]}
        title="Newsletter"
      />
      <div className="bg-sand-100 px-5 lg:px-8 py-6 lg:py-7 min-h-[calc(100vh-90px)]">
        <div className="max-w-[1240px] mx-auto">
          <NewsletterClient />
        </div>
      </div>
    </>
  )
}
