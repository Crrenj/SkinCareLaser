/**
 * Données structurées schema.org/Article pour rich snippets Google.
 *
 * Server Component pur — injecte un <script type="application/ld+json">.
 * Doc : https://developers.google.com/search/docs/appearance/structured-data/article
 */

import { safeJsonLd } from '@/lib/jsonLd'

interface BlogPostJsonLdProps {
  locale: string
  slug: string
  title: string
  description?: string | null
  image?: string | null
  datePublished?: string | null
  authorName?: string | null
}

const SITE_URL = 'https://farmau.do'

export function BlogPostJsonLd({
  locale,
  slug,
  title,
  description,
  image,
  datePublished,
  authorName,
}: BlogPostJsonLdProps) {
  const url = `${SITE_URL}/${locale}/blog/${slug}`

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description || undefined,
    image: image || undefined,
    datePublished: datePublished || undefined,
    author: authorName
      ? { '@type': 'Person', name: authorName }
      : { '@type': 'Organization', name: 'FARMAU' },
    publisher: {
      '@type': 'Organization',
      name: 'FARMAU',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  )
}
