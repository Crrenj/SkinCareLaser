import type { NextConfig } from 'next'
import { createHash } from 'crypto'
import createNextIntlPlugin from 'next-intl/plugin'
import { THEME_MODE_SCRIPT } from './src/lib/themeModeScript'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

// Hash CSP du seul script inline (anti-flash thème), calculé au build →
// toujours synchrone avec le script. Permet `script-src 'sha256-…'` sans
// 'unsafe-inline' tout en gardant le SSG (pas de nonce = pas de rendu dynamique).
const themeScriptCspHash = `'sha256-${createHash('sha256')
  .update(THEME_MODE_SCRIPT)
  .digest('base64')}'`

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
              `script-src 'self' ${themeScriptCspHash}`,
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
     * Déclare chaque domaine externe autorisé par <Image>.
     * Ajoute-en d'autres si tu sers les photos depuis Supabase Storage,
     * Cloudinary, etc.
     */
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/**',
      },
    ],
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
