import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
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
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const supabase = await createSupabaseServerClient()
  const { data: post } = await supabase
    .from('posts')
    .select('title, excerpt')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()

  if (!post) return { title: 'Article introuvable' }

  return {
    title: `${post.title} · FARMAU`,
    description: post.excerpt ?? undefined,
    alternates: {
      canonical: localizedPath(locale, `/blog/${slug}`),
      languages: buildLanguageAlternates(`/blog/${slug}`),
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
  const supabase = await createSupabaseServerClient()

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
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-sm font-mono text-ink-400 hover:text-ink-700 mb-8"
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
            <div className="flex items-center gap-3 text-sm text-ink-400 font-mono">
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
            className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-ink-900 prose-p:text-ink-600 prose-a:text-clay-700"
            dangerouslySetInnerHTML={{ __html: post.body }}
          />
        </article>
      </main>
      <Footer />
    </div>
  )
}
