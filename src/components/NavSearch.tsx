'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react'
import useSWR from 'swr'
import { Search, Clock } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'

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
const MAX_RECENTS = 5

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('search_failed')
    return r.json() as Promise<SearchResponse>
  })

const POPULAR_KEYS = ['sunProtection', 'antiAging', 'sensitive', 'hydration'] as const

export interface NavSearchHandle {
  focus: () => void
}

interface NavSearchProps {
  className?: string
}

export const NavSearch = forwardRef<NavSearchHandle, NavSearchProps>(
  function NavSearch({ className = '' }, ref) {
    const t = useTranslations('NavSearch')
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const [query, setQuery] = useState('')
    const [debouncedQuery, setDebouncedQuery] = useState('')
    const [open, setOpen] = useState(false)
    const [recents, setRecents] = useState<string[]>([])
    const [highlighted, setHighlighted] = useState(0)

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
    }))

    // Charge les recherches récentes depuis localStorage au mount.
    useEffect(() => {
      try {
        const raw = window.localStorage.getItem(RECENTS_KEY)
        if (raw) setRecents(JSON.parse(raw))
      } catch {
        /* localStorage inaccessible (navigation privée etc.) */
      }
    }, [])

    // Debounce 200ms : évite un appel API à chaque touche.
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
    const hasResults = hits.length > 0
    const showNoResults = shouldFetch && !isLoading && !hasResults

    // Bestsellers fallback : prefetché quand l'utilisateur n'a aucun résultat.
    const { data: bestsellersData } = useSWR<SearchResponse>(
      showNoResults ? '/api/search?bestsellers=1&limit=3' : null,
      fetcher,
      { revalidateOnFocus: false, revalidateOnReconnect: false },
    )
    const bestsellerHits = bestsellersData?.hits ?? []

    // Fermeture sur clic extérieur.
    useEffect(() => {
      if (!open) return
      const onClick = (e: MouseEvent) => {
        if (!containerRef.current?.contains(e.target as Node)) {
          setOpen(false)
        }
      }
      document.addEventListener('mousedown', onClick)
      return () => document.removeEventListener('mousedown', onClick)
    }, [open])

    const persistRecent = useCallback((value: string) => {
      const trimmed = value.trim()
      if (!trimmed) return
      setRecents((prev) => {
        const next = [trimmed, ...prev.filter((r) => r !== trimmed)].slice(0, MAX_RECENTS)
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
        setOpen(false)
        inputRef.current?.blur()
        router.push(`/catalogue?q=${encodeURIComponent(trimmed)}`)
      },
      [persistRecent, router],
    )

    const openProduct = useCallback(
      (hit: SearchHit) => {
        persistRecent(hit.name)
        setOpen(false)
        inputRef.current?.blur()
        router.push(`/product/${hit.slug}`)
      },
      [persistRecent, router],
    )

    const clearRecents = useCallback(() => {
      setRecents([])
      try {
        window.localStorage.removeItem(RECENTS_KEY)
      } catch {
        /* idem */
      }
    }, [])

    // Items navigables au clavier (les "lignes" cliquables du dropdown).
    type NavItem =
      | { kind: 'product'; hit: SearchHit }
      | { kind: 'suggestion'; value: string }
      | { kind: 'recent'; value: string }
      | { kind: 'category'; value: string }

    const navItems: NavItem[] = useMemo(() => {
      if (shouldFetch) {
        return hits.map((hit) => ({ kind: 'product' as const, hit }))
      }
      const items: NavItem[] = [
        ...recents.map((value) => ({ kind: 'recent' as const, value })),
        ...POPULAR_KEYS.map((key) => ({
          kind: 'category' as const,
          value: t(`categories.${key}`),
        })),
      ]
      return items
    }, [shouldFetch, hits, recents, t])

    // Reset highlighted quand les items changent.
    useEffect(() => {
      setHighlighted(0)
    }, [debouncedQuery, recents.length])

    const onKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Escape') {
          setOpen(false)
          inputRef.current?.blur()
          return
        }
        if (e.key === 'Enter') {
          const item = navItems[highlighted]
          if (item) {
            if (item.kind === 'product') {
              openProduct(item.hit)
            } else {
              runSearch(item.value)
            }
          } else {
            runSearch(query)
          }
          return
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setHighlighted((h) => Math.min(navItems.length - 1, h + 1))
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          setHighlighted((h) => Math.max(0, h - 1))
        }
      },
      [navItems, highlighted, openProduct, runSearch, query],
    )

    let highlightCursor = 0

    return (
      <div ref={containerRef} className={`relative ${className}`}>
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500">
          <Search size={18} strokeWidth={1.8} />
        </span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={t('placeholder')}
          aria-label={t('ariaLabel')}
          data-nav-search-input
          className="w-full h-10 pl-10 pr-14 bg-white border border-sand-500 rounded-sm text-sm text-ink-900 placeholder:text-ink-500 outline-none transition-colors focus:border-clay-600 focus:shadow-[0_0_0_3px_rgba(184,111,74,0.15)]"
        />
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] tracking-wider text-ink-500 border border-sand-400 rounded-sm px-1.5 py-0.5">
          {open ? t('escHint') : t('shortcutHint')}
        </span>

        {open && (
          <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 bg-white border border-sand-300 rounded shadow-[0_16px_40px_-12px_rgba(31,27,22,0.18),0_4px_6px_rgba(31,27,22,0.04)] py-3 max-h-[70vh] overflow-y-auto">
            {shouldFetch ? (
              <>
                {isLoading && !hasResults && (
                  <div className="px-4 py-3 text-sm text-ink-500">{t('loading')}</div>
                )}
                {hasResults && (
                  <div className="px-4 pb-2">
                    <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-ink-500 py-2">
                      {t('productsHeading', { count: hits.length })}
                    </div>
                    {hits.map((hit) => {
                      const idx = highlightCursor++
                      return (
                        <SearchResultRow
                          key={hit.id}
                          hit={hit}
                          query={debouncedQuery}
                          active={idx === highlighted}
                          onMouseEnter={() => setHighlighted(idx)}
                          onClick={() => openProduct(hit)}
                        />
                      )
                    })}
                  </div>
                )}
                {showNoResults && (
                  <>
                    <div className="px-4 py-5 text-center">
                      <div className="font-serif italic text-[20px] text-ink-900 mb-1.5">
                        {t('noResultsTitle')}{' '}
                        <span className="not-italic">&ldquo;{debouncedQuery}&rdquo;</span>
                      </div>
                      <div className="text-[12.5px] text-ink-500">
                        {t('noResultsHelp')}{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setOpen(false)
                            router.push('/catalogue')
                          }}
                          className="text-clay-700 font-medium"
                        >
                          {t('noResultsCategoriesLink')}
                        </button>
                        .
                      </div>
                    </div>
                    {bestsellerHits.length > 0 && (
                      <div className="px-4 pb-2 border-t border-sand-200 pt-3 mt-1">
                        <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-ink-500 py-2">
                          {t('bestsellersHeading')}
                        </div>
                        {bestsellerHits.map((hit) => (
                          <SearchResultRow
                            key={hit.id}
                            hit={hit}
                            query=""
                            active={false}
                            onMouseEnter={() => {
                              /* noop : bestsellers ne sont pas dans navItems */
                            }}
                            onClick={() => openProduct(hit)}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                {recents.length > 0 && (
                  <div className="px-4 pb-2">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-ink-500">
                        {t('recentsHeading')}
                      </span>
                      <button
                        type="button"
                        onClick={clearRecents}
                        className="text-[10px] font-mono uppercase tracking-[0.08em] text-ink-500 hover:text-clay-700"
                      >
                        {t('clearRecents')}
                      </button>
                    </div>
                    {recents.map((value) => {
                      const idx = highlightCursor++
                      return (
                        <SuggestionRow
                          key={`r-${value}`}
                          icon={<Clock size={14} strokeWidth={1.8} />}
                          label={value}
                          active={idx === highlighted}
                          onMouseEnter={() => setHighlighted(idx)}
                          onClick={() => runSearch(value)}
                        />
                      )
                    })}
                  </div>
                )}
                <div className="px-4 pb-1">
                  <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-ink-500 py-2">
                    {t('popularHeading')}
                  </div>
                  {POPULAR_KEYS.map((key) => {
                    const label = t(`categories.${key}`)
                    const idx = highlightCursor++
                    return (
                      <SuggestionRow
                        key={key}
                        icon={<Search size={14} strokeWidth={1.8} />}
                        label={label}
                        active={idx === highlighted}
                        onMouseEnter={() => setHighlighted(idx)}
                        onClick={() => runSearch(label)}
                      />
                    )
                  })}
                </div>
              </>
            )}

            <div className="border-t border-sand-200 mt-2 px-4 pt-2.5 pb-1 flex items-center justify-between text-[11px] text-ink-500">
              {shouldFetch && hasResults ? (
                <button
                  type="button"
                  onClick={() => runSearch(debouncedQuery)}
                  className="text-clay-700 font-medium hover:underline"
                >
                  {t('viewAllResults', { count: hits.length })}
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-3">
                <span className="inline-flex items-center gap-1">
                  <Kbd>↑</Kbd>
                  <Kbd>↓</Kbd>
                  <span className="ml-1">{t('keyboardNavigate')}</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Kbd>↵</Kbd>
                  <span className="ml-1">{t('keyboardSelect')}</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  },
)

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="font-mono text-[9px] bg-sand-100 border border-sand-300 rounded-sm px-1 py-0.5 text-ink-700">
      {children}
    </kbd>
  )
}

function SuggestionRow({
  icon,
  label,
  active,
  onMouseEnter,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onMouseEnter: () => void
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 py-2 px-2 -mx-2 rounded-sm text-left text-[13.5px] text-ink-800 transition-colors ${
        active ? 'bg-sand-50' : 'hover:bg-sand-50'
      }`}
    >
      <span className="text-ink-500">{icon}</span>
      <span>{label}</span>
    </button>
  )
}

function SearchResultRow({
  hit,
  query,
  active,
  onMouseEnter,
  onClick,
}: {
  hit: SearchHit
  query: string
  active: boolean
  onMouseEnter: () => void
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={`w-full flex items-center gap-3 py-2 px-2 -mx-2 rounded-sm text-left transition-colors ${
        active ? 'bg-sand-50' : 'hover:bg-sand-50'
      }`}
    >
      <div className="w-10 h-10 flex-shrink-0 bg-sand-50 rounded-sm overflow-hidden flex items-center justify-center">
        {hit.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hit.image.url}
            alt={hit.image.alt ?? hit.name}
            className="w-full h-full object-contain p-1"
          />
        ) : (
          <span className="text-ink-500 text-[10px]">—</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        {hit.brand && (
          <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-clay-700">
            {hit.brand}
          </div>
        )}
        <div className="text-[13.5px] font-medium text-ink-900 truncate">
          <HighlightedText text={hit.name} query={query} />
        </div>
      </div>
      <div className="font-serif text-base text-ink-900 leading-none tracking-[-0.01em] flex items-baseline gap-1">
        {hit.price.toFixed(0)}
        <span className="font-sans text-[11px] text-ink-500 tracking-wider">
          {hit.currency.toUpperCase()}
        </span>
      </div>
    </button>
  )
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-transparent font-semibold text-ink-900">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}
