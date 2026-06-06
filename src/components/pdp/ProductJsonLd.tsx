/**
 * Données structurées schema.org/Product pour rich snippets Google.
 *
 * Server Component pur — injecte un <script type="application/ld+json">
 * en début de body. Pas de hydration côté client.
 *
 * Doc : https://developers.google.com/search/docs/appearance/structured-data/product
 */

interface ProductJsonLdProps {
  locale: string
  slug: string
  name: string
  description: string
  brand: string
  price: number
  currency: string
  images: { url: string }[]
  stock: number | null
  /** Note moyenne (0 si aucun avis approuvé). */
  ratingValue?: number
  /** Nombre d'avis approuvés. */
  reviewCount?: number
}

const SITE_URL = 'https://farmau.do'

export function ProductJsonLd({
  locale,
  slug,
  name,
  description,
  brand,
  price,
  currency,
  images,
  stock,
  ratingValue = 0,
  reviewCount = 0,
}: ProductJsonLdProps) {
  const productUrl = `${SITE_URL}/${locale}/product/${slug}`
  const imageUrls = images.map((i) => i.url).filter(Boolean)

  // schema.org availability enum. Pas de stock = considéré InStock (le
  // catalogue n'expose que les produits actifs).
  const availability =
    stock === null
      ? 'https://schema.org/InStock'
      : stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock'

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description: description || undefined,
    image: imageUrls.length > 0 ? imageUrls : undefined,
    brand: brand
      ? {
          '@type': 'Brand',
          name: brand,
        }
      : undefined,
    // Uniquement si au moins un avis approuvé (évite les pénalités Google pour
    // notes vides/factices).
    aggregateRating:
      reviewCount > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue,
            reviewCount,
          }
        : undefined,
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: currency,
      price: price.toFixed(2),
      availability,
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: 'FARMAU',
      },
    },
  }

  return (
    <script
      type="application/ld+json"
      // JSON.stringify est suffisant ici (pas d'input utilisateur arbitraire,
      // toutes les valeurs viennent de la DB et passent par .toFixed/string).
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
