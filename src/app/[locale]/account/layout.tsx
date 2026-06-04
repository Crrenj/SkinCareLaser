import { redirect } from 'next/navigation'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import { AccountSidebar } from '@/components/account/AccountSidebar'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export default async function AccountLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect(`/${locale}/login?redirectedFrom=${encodeURIComponent(`/${locale}/account/profile`)}`)
  }

  // Un admin reste un client : on lui propose un raccourci vers le panneau admin
  // depuis son espace compte (pont symétrique du « Mon compte » côté admin).
  const { data: isAdmin } = await supabase.rpc('is_user_admin', {
    check_user_id: session.user.id,
  })

  return (
    <div className="flex flex-col min-h-screen bg-sand-50">
      <NavBar />

      <main id="main-content" className="flex-grow">
        <div className="max-w-7xl mx-auto px-6 lg:px-14 py-10 lg:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-10 lg:gap-14">
            <AccountSidebar userEmail={session.user.email ?? ''} isAdmin={isAdmin === true} />
            <div className="min-w-0">{children}</div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
