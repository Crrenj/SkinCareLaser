import type { Metadata } from 'next'

/**
 * Pages d'authentification (login / signup / forgot-password / reset-password) :
 * user-spécifiques et transitoires → exclues de l'index des moteurs. Les pages
 * elles-mêmes sont des Client Components et ne peuvent pas exporter `metadata` ;
 * ce layout de groupe porte donc le `noindex` pour les quatre. [C-46]
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children
}
