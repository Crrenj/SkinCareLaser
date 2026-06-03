import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import { Link } from '@/i18n/navigation'
import { buildLanguageAlternates, localizedPath } from '@/lib/seo'
import Image from 'next/image'

export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Blog' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: {
      canonical: localizedPath(locale, '/blog'),
      languages: buildLanguageAlternates('/blog'),
    },
  }
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Blog')
  const supabase = await createSupabaseServerClient()

  const { data: posts } = await supabase
    .from('posts')
    .select('id, slug, title, excerpt, cover_image_url, author_name, locale, published_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(50)

  // Affiche tous les articles publiés, toutes langues confondues : le contenu
  // du blog est en espagnol (marché RD) et doit rester visible sur /fr et /en.
  const filtered = posts ?? []

  return (
    <div className="flex flex-col min-h-screen bg-sand-50">
      <NavBar />
      <main id="main-content" className="flex-grow">
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <h1 className="font-serif text-5xl sm:text-7xl lg:text-[88px] text-ink-900 mb-4">
            {t('heading')}
          </h1>
          <p className="text-ink-500 font-mono text-sm mb-12">
            {t('subtitle')}
          </p>

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-sand-200 bg-white p-12 text-center">
              <p className="text-ink-500">{t('empty')}</p>
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(post => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group rounded-xl border border-sand-200 bg-white overflow-hidden hover:shadow-md transition-shadow"
                >
                  {post.cover_image_url ? (
                    <div className="relative aspect-[16/9] bg-sand-100">
                      <Image
                        src={post.cover_image_url}
                        alt={post.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/9] bg-sand-100 flex items-center justify-center">
                      <span className="font-serif text-4xl italic text-sand-300">F</span>
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      {post.published_at && (
                        <time className="text-xs font-mono text-ink-500">
                          {new Date(post.published_at).toLocaleDateString(locale, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </time>
                      )}
                      {post.author_name && (
                        <span className="text-xs text-ink-500">· {post.author_name}</span>
                      )}
                    </div>
                    <h2 className="font-serif text-xl text-ink-900 group-hover:text-clay-700 transition-colors mb-2">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-sm text-ink-500 line-clamp-3">{post.excerpt}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}
