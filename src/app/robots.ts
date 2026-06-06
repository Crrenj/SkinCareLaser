import type { MetadataRoute } from 'next'

const BASE_URL = 'https://farmau.do'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/account/',
          '/*/account/',
          '/auth/',
          '/cart',
          '/*/cart',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
