import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  // Ne pas divulguer la stack (anti-fingerprinting).
  poweredByHeader: false,

  // Strip console.* des bundles prod (garde error/warn) — évite les fuites
  // d'infos résiduelles dans la console du navigateur.
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error', 'warn'] }
        : false,
  },

  // Optimisations de performance
  experimental: {
    optimizePackageImports: ['lucide-react', 'react-icons'],
  },
  
  // Optimisations de sécurité
  headers: async () => {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            // SAMEORIGIN (pas DENY) : permet l'aperçu iframe same-origin de la
            // home dans /admin/annonce. Le cross-origin reste bloqué (anti-clickjacking).
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'same-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Next.js App Router injecte ~50 scripts inline `self.__next_f.push`
              // (payload RSC) PAR PAGE, impossibles à hasher statiquement. Un CSP
              // hash-only les bloque → aucune hydratation → page blanche. 'unsafe-inline'
              // les autorise tout en gardant le SSG (un nonce forcerait le rendu
              // dynamique). Compromis assumé : on perd la protection XSS inline, on
              // garde le durcissement des autres directives. [fix CSP white-page]
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://accounts.google.com",
              "frame-src 'self' https://accounts.google.com https://maps.google.com",
              "frame-ancestors 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
  
  // Optimisations d'images
  images: {
    /**
     * Allowlist stricte des hôtes servis par <Image> (l'optimiseur Next est
     * sinon un proxy ouvert : n'importe quelle URL externe passerait par
     * /_next/image). Conséquence : les champs URL libres de l'admin
     * (banners.image_url, banners.attribution_photo_url, posts.cover_image_url)
     * sont contraints à ces hôtes — ajouter une entrée ici avant d'utiliser
     * un nouveau CDN. Hôtes vérifiés en DB (2026-06-10) : Supabase Storage
     * (images produit) + Unsplash (bannières + covers blog).
     */
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'adxpoxcynrpnbbxnncsk.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    // Photos produit quasi immuables (re-upload = nouvelle URL Storage) :
    // 30 j de cache optimiseur au lieu des 60 s par défaut.
    minimumCacheTTL: 2592000,
    // Optimisations de performance pour les images
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Optimisations de compression
  compress: true,
  
  // Optimisations de cache
  generateEtags: false,
}

export default withNextIntl(nextConfig)
