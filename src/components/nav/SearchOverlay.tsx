'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import { Search, Clock, ArrowUpRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'

/**
 * Couverture de recherche plein écran (NavBar v2). L'icône loupe (ou ⌘K)
 * ouvre une feuille qui descend du haut : grand champ serif, catégories
 * populaires + recherches récentes, et résultats live `/api/search` dès 2
 * caractères. Remplace le champ inline permanent — la barre reste épurée.
 */

type SearchHit = {
  id: string
  slug: string
  name: string
  brand: string
  price: number
  currency: string
  image: { url: string; alt: string | null } | null
}

type SearchResponse = { q: string; hits: SearchHit[] }

const RECENTS_KEY = 'farmau:search:recents'

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('search_failed')
    return r.json() as Promise<SearchResponse>
  })

// Chips « Populares » : 4 catégories i18n + 2 marques réelles du catalogue.
const POPULAR_CATEGORY_KEYS = ['sunProtection', 'antiAging', 'hydration', 'sensitive'] as const
const POPULAR_BRANDS = ['ISDIN', 'Avène'] as const

interface SearchOverlayProps {
  open: boolean
  onClose: () => void
}

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const t = useTranslations('NavSearch')
  const tNav = useTranslations('Nav')
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [recents, setRecents] = useState<string[]>([])
  // `rendered` garde le noeud monté le temps de l'animation de sortie ;
  // `show` pilote les classes open/closed (transition d'entrée + sortie).
  const [rendered, setRendered] = useState(false)
  const [show, setShow] = useState(false)

  // Monte / anime à l'ouverture, anime puis démonte à la fermeture.
  useEffect(() => {
    if (open) {
      setRendered(true)
      const id = requestAnimationFrame(() => setShow(true))
      return () => cancelAnimationFrame(id)
    }
    setShow(false)
    const id = setTimeout(() => setRendered(false), 260)
    return () => clearTimeout(id)
  }, [open])

  // Focus + verrou de scroll + lecture des récents à l'ouverture.
  useEffect(() => {
    if (!open) return
    try {
      const raw = window.localStorage.getItem(RECENTS_KEY)
      setRecents(raw ? JSON.parse(raw) : [])
    } catch {
      /* localStorage indisponible */
    }
    const focusId = setTimeout(() => inputRef.current?.focus(), 70)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      clearTimeout(focusId)
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  // Esc ferme (le ⌘K global est géré par la NavBar).
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Debounce 200ms avant d'interroger l'API.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim()), 200)
    return () => clearTimeout(id)
  }, [query])

  const shouldFetch = debouncedQuery.length >= 2
  const { data, isLoading } = useSWR<SearchResponse>(
    shouldFetch ? `/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=6` : null,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true },
  )
  const hits = useMemo(() => data?.hits ?? [], [data?.hits])
  const showNoResults = shouldFetch && !isLoading && hits.length === 0

  const persistRecent = useCallback((value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    setRecents((prev) => {
      const next = [trimmed, ...prev.filter((r) => r !== trimmed)].slice(0, 5)
      try {
        window.localStorage.setItem(RECENTS_KEY, JSON.stringify(next))
      } catch {
        /* idem */
      }
      return next
    })
  }, [])

  const runSearch = useCallback(
    (value: string) => {
      const trimmed = value.trim()
      if (!trimmed) return
      persistRecent(trimmed)
      setQuery('')
      onClose()
      router.push(`/catalogue?q=${encodeURIComponent(trimmed)}`)
    },
    [persistRecent, onClose, router],
  )

  const openProduct = useCallback(
    (hit: SearchHit) => {
      persistRecent(hit.name)
      setQuery('')
      onClose()
      router.push(`/product/${hit.slug}`)
    },
    [persistRecent, onClose, router],
  )

  if (!rendered) return null

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label={t('ariaLabel')}>
      {/* Scrim */}
      <button
        type="button"
        aria-label={tNav('closeMenuAriaLabel')}
        onClick={onClose}
        className={`absolute inset-0 bg-ink-900/30 backdrop-blur-[3px] transition-opacity duration-200 ${
          show ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Sheet */}
      <div
        className={`absolute inset-x-0 top-0 bg-sand-50 border-b border-sand-300 shadow-[0_24px_60px_-20px_rgba(31,27,22,0.3)] transition-[transform,opacity] duration-[260ms] ease-[cubic-bezier(.2,.7,.2,1)] ${
          show ? 'translate-y-0 opacity-100' : '-translate-y-3.5 opacity-0'
        }`}
      >
        <div className="mx-auto max-w-[760px] px-[clamp(20px,5vw,72px)] pt-[26px] pb-[30px]">
          {/* Champ */}
          <div className="flex items-center gap-3.5 border-b-2 border-ink-900 pb-3">
            <Search size={24} strokeWidth={1.7} className="shrink-0 text-ink-700" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') runSearch(query)
              }}
              placeholder={t('placeholder')}
              aria-label={t('ariaLabel')}
              className="min-w-0 flex-1 border-0 bg-transparent font-serif text-[clamp(24px,4vw,30px)] tracking-[-0.01em] text-ink-900 outline-none placeholder:text-ink-400"
            />
            <span className="shrink-0 rounded-[5px] border border-sand-400 px-2 py-1 font-mono text-[11px] text-ink-500">
              {t('escHint')}
            </span>
          </div>

          {/* Résultats live OU populaires + récents */}
          {shouldFetch ? (
            <div className="mt-5">
              {isLoading && hits.length === 0 && (
                <p className="py-3 text-sm text-ink-500">{t('loading')}</p>
              )}
              {hits.length > 0 && (
                <>
                  <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-500">
                    {t('productsHeading', { count: hits.length })}
                  </div>
                  <ul>
                    {hits.map((hit) => (
                      <li key={hit.id}>
                        <button
                          type="button"
                          onClick={() => openProduct(hit)}
                          className="group flex w-full items-center gap-3.5 rounded-[10px] px-2 py-2.5 text-left transition-colors hover:bg-sand-100"
                        >
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-sand-100">
                            {hit.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={hit.image.url}
                                alt={hit.image.alt ?? hit.name}
                                className="h-full w-full object-contain p-1"
                              />
                            ) : (
                              <span className="text-[10px] text-ink-400">—</span>
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            {hit.brand && (
                              <span className="block font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-clay-700">
                                {hit.brand}
                              </span>
                            )}
                            <span className="block truncate text-[14px] font-medium text-ink-900">
                              {hit.name}
                            </span>
                          </span>
                          <span className="shrink-0 font-serif text-[17px] leading-none text-ink-900">
                            {hit.price.toFixed(0)}
                            <span className="ml-1 font-sans text-[11px] tracking-wider text-ink-500">
                              {hit.currency.toUpperCase()}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => runSearch(debouncedQuery)}
                    className="mt-2 inline-flex items-center gap-1.5 px-2 text-[13px] font-medium text-clay-700 hover:underline"
                  >
                    {t('viewAllResults', { count: hits.length })}
                  </button>
                </>
              )}
              {showNoResults && (
                <div className="py-4">
                  <p className="font-serif text-[20px] text-ink-900">
                    {t('noResultsTitle')}{' '}
                    <span className="italic">&ldquo;{debouncedQuery}&rdquo;</span>
                  </p>
                  <p className="mt-1 text-[13px] text-ink-500">
                    {t('noResultsHelp')}{' '}
                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        router.push('/catalogue')
                      }}
                      className="font-medium text-clay-700 hover:underline"
                    >
                      {t('noResultsCategoriesLink')}
                    </button>
                    .
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-[22px] flex flex-col gap-7 sm:flex-row sm:gap-12">
              {/* Populares */}
              <div>
                <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-500">
                  {t('popularHeading')}
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    ...POPULAR_CATEGORY_KEYS.map((k) => t(`categories.${k}`)),
                    ...POPULAR_BRANDS,
                  ].map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => runSearch(label)}
                      className="rounded-full border border-sand-300 bg-sand-100 px-[13px] py-1.5 text-[12.5px] text-ink-800 transition-colors hover:border-sand-400 hover:bg-sand-200"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recientes */}
              {recents.length > 0 && (
                <div className="sm:min-w-[180px]">
                  <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-500">
                    {t('recentsHeading')}
                  </div>
                  <div className="flex flex-col">
                    {recents.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => runSearch(value)}
                        className="group flex items-center gap-2.5 py-[5px] text-left text-[13px] text-ink-700 hover:text-ink-900"
                      >
                        <Clock size={14} strokeWidth={1.7} className="text-ink-400" />
                        <span className="flex-1">{value}</span>
                        <ArrowUpRight
                          size={13}
                          strokeWidth={1.8}
                          className="text-ink-400 opacity-0 transition-opacity group-hover:opacity-100"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
