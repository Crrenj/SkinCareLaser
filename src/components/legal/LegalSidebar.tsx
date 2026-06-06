import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

interface LegalSidebarProps {
  activeSlug: 'cgv' | 'mentions-legales' | 'confidentialite' | 'cookies'
}

const ITEMS = [
  { slug: 'mentions-legales' as const, href: '/legal/mentions-legales', key: 'mentions' as const },
  { slug: 'cgv' as const, href: '/legal/cgv', key: 'cgv' as const },
  { slug: 'confidentialite' as const, href: '/legal/confidentialite', key: 'privacy' as const },
  { slug: 'cookies' as const, href: '/legal/cookies', key: 'cookies' as const },
]

export async function LegalSidebar({ activeSlug }: LegalSidebarProps) {
  const t = await getTranslations('Legal.sidebar')

  return (
    <aside className="lg:sticky lg:top-32 lg:self-start">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-500 font-semibold mb-4">
        {t('heading')}
      </div>
      <nav aria-label={t('heading')}>
        <ul className="flex flex-col gap-px">
          {ITEMS.map((item) => {
            const active = item.slug === activeSlug
            return (
              <li key={item.slug}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`block py-2.5 px-3 -mx-3 rounded-sm text-[14px] leading-snug border-l-2 transition-colors ${
                    active
                      ? 'border-clay-700 bg-sand-200 text-ink-900 font-semibold'
                      : 'border-transparent text-ink-700 hover:text-ink-900 hover:bg-sand-100'
                  }`}
                >
                  {t(`items.${item.key}`)}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
