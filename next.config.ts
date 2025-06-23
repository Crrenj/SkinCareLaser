import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Autres options Next si besoin…
  images: {
    /** 
     * Déclare chaque domaine externe autorisé par <Image>.
     * Ajoute-en d’autres si tu sers les photos depuis Supabase Storage,
     * Cloudinary, etc.
     */
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',           // toutes les tailles / chemins
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co', // (facultatif) Storage public Supabase
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
