import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { createSupabasePublicClient } from '@/lib/supabasePublic'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import { Link } from '@/i18n/navigation'
import { localizedPath } from '@/lib/seo'
import Image from 'next/image'
import DOMPurify from 'isomorphic-dompurify'
import { BlogPostJsonLd } from '@/components/blog/BlogPostJsonLd'

export const revalidate = 60

/**
 * Aucun slug prérendu au build (catalogue volumineux) : generateStaticParams
 * vide → la route reste statique-éligible, chaque slug est généré à la
 * demande puis mis en cache ISR (revalidate ci-dessus).
 */
export function generateStaticParams() {
  return []
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const supabase = createSupabasePublicClient()
  const { data: post } = await supabase
    .from('posts')
    .select('title, excerpt, locale')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()

  if (!post) return { title: 'Article introuvable' }

  // Un post n'existe que dans SA locale (posts.locale) → on n'annonce PAS de
  // fausses traductions hreflang fr/es/en. Canonical = locale du post. [C-12]
  const postLocale = post.locale ?? locale
  const canonical = localizedPath(postLocale, `/blog/${slug}`)

  return {
    title: `${post.title} · FARMAU`,
    description: post.excerpt ?? undefined,
    alternates: {
      canonical,
      languages: { [postLocale]: canonical, 'x-default': canonical },
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const supabase = createSupabasePublicClient()

  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()

  if (!post) notFound()

  return (
    <div className="flex flex-col min-h-screen bg-sand-50">
      <NavBar />
      <main id="main-content" className="flex-grow">
        <article className="mx-auto max-w-3xl px-4 sm:px-6 py-16 lg:py-24">
          <BlogPostJsonLd
            locale={locale}
            slug={slug}
            title={post.title}
            description={post.excerpt}
            image={post.cover_image_url}
            datePublished={post.published_at}
            authorName={post.author_name}
          />
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-sm font-mono text-ink-500 hover:text-ink-700 mb-8"
          >
            &larr; Blog
          </Link>

          {post.cover_image_url && (
            <div className="relative aspect-[2/1] rounded-xl overflow-hidden mb-8">
              <Image
                src={post.cover_image_url}
                alt={post.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
                priority
              />
            </div>
          )}

          <header className="mb-10">
            <h1 className="font-serif text-4xl sm:text-5xl text-ink-900 mb-4">
              {post.title}
            </h1>
            <div className="flex items-center gap-3 text-sm text-ink-500 font-mono">
              {post.published_at && (
                <time>
                  {new Date(post.published_at).toLocaleDateString(locale, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              )}
              {post.author_name && <span>· {post.author_name}</span>}
            </div>
          </header>

          <div
            className="article-content max-w-none text-[1.05rem]"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.body) }}
          />
        </article>
      </main>
      <Footer />
    </div>
  )
}
