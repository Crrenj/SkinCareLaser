import Link from 'next/link'

// Fallback global 404 (rendu hors du segment [locale], donc pas de i18n).
// 99% des 404 sont attrapées par /[locale]/not-found.tsx. Ce fichier sert
// uniquement aux requêtes qui ne match aucun segment locale (ex: /robots/abc).
export default function RootNotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-sand-50 px-6 py-12 text-center">
      <div
        aria-hidden
        className="font-serif italic text-[120px] leading-none text-clay-400 mb-4"
      >
        404
      </div>
      <h1 className="font-serif text-[36px] text-ink-900 mb-3">Page not found</h1>
      <p className="text-[15px] text-ink-700 max-w-md mb-8">
        The page you’re looking for doesn’t exist or has been moved.
      </p>
      <Link
        href="/fr"
        className="inline-flex items-center px-6 py-3.5 rounded-sm bg-clay-700 text-sand-50 text-[13px] font-semibold uppercase tracking-wider hover:bg-clay-800 transition-colors"
      >
        Volver al inicio
      </Link>
    </main>
  )
}
