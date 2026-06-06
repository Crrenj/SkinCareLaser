'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Star } from 'lucide-react'
import { useRouter, usePathname } from '@/i18n/navigation'
import { supabase } from '@/lib/supabaseClient'
import { toLocaleTag } from '@/lib/constants'

export interface ReviewItem {
  id: string
  rating: number
  title: string | null
  body: string | null
  author_name: string | null
  verified_purchase: boolean
  created_at: string
}

interface PdpReviewsProps {
  productId: string
  reviews: ReviewItem[]
  average: number
  count: number
}

/**
 * Section avis produit (mock « Fiche produit modernisée ») : résumé (note
 * moyenne + étoiles + nombre) à gauche, liste + formulaire à droite. Les avis
 * affichés sont uniquement les avis approuvés (fetch serveur côté page.tsx).
 * Le formulaire poste vers /api/reviews (status 'pending' → modération admin).
 */
export function PdpReviews({ productId, reviews, average, count }: PdpReviewsProps) {
  const t = useTranslations('Product.reviews')
  const locale = useLocale()
  const dateFmt = new Intl.DateTimeFormat(toLocaleTag(locale), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <section className="grid lg:grid-cols-[280px_1fr] gap-10 lg:gap-14 px-6 lg:px-8 py-14 max-w-7xl mx-auto border-t border-sand-200">
      {/* Résumé */}
      <div className="pt-1">
        <h2 className="font-serif text-[26px] -tracking-[0.01em] text-ink-900 mb-3">
          {t('heading')}
        </h2>
        {count > 0 ? (
          <>
            <div className="font-serif text-[64px] leading-none -tracking-[0.03em] text-ink-900">
              {average.toLocaleString(toLocaleTag(locale), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              <span className="text-[26px] text-ink-500">/5</span>
            </div>
            <Stars value={Math.round(average)} className="my-2" />
            <p className="text-[13px] text-ink-500">{t('reviewCount', { count })}</p>
          </>
        ) : (
          <p className="text-[14px] text-ink-500 leading-relaxed">{t('emptyState')}</p>
        )}
      </div>

      {/* Liste + formulaire */}
      <div>
        {reviews.length > 0 && (
          <div className="grid gap-5 mb-10">
            {reviews.map((r) => (
              <article key={r.id} className="border-b border-sand-300 pb-5 last:border-b-0">
                <div className="flex justify-between items-baseline mb-1.5 gap-3">
                  <Stars value={r.rating} size={12} />
                  <span className="font-mono text-[11.5px] text-ink-500">
                    {dateFmt.format(new Date(r.created_at))}
                  </span>
                </div>
                {r.title && (
                  <p className="font-semibold text-[14px] text-ink-900 mb-0.5">{r.title}</p>
                )}
                {r.body && (
                  <p className="font-serif italic text-[16px] leading-snug text-ink-800">
                    {r.body}
                  </p>
                )}
                <p className="text-[12px] text-ink-500 mt-1.5">
                  — {r.author_name?.trim() || t('anonymousAuthor')}
                  {r.verified_purchase && (
                    <span className="text-olive-700 font-medium"> · {t('verifiedBadge')}</span>
                  )}
                </p>
              </article>
            ))}
          </div>
        )}

        <ReviewForm productId={productId} />
      </div>
    </section>
  )
}

function Stars({
  value,
  size = 16,
  className = '',
}: {
  value: number
  size?: number
  className?: string
}) {
  return (
    <span className={`inline-flex gap-0.5 ${className}`} aria-hidden>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          strokeWidth={1.6}
          className={n <= value ? 'text-clay-700 fill-clay-700' : 'text-sand-400'}
          fill={n <= value ? 'currentColor' : 'none'}
        />
      ))}
    </span>
  )
}

function ReviewForm({ productId }: { productId: string }) {
  const t = useTranslations('Product.reviews')
  const router = useRouter()
  const pathname = usePathname()
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (active) setAuthed(!!data.session)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session)
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const goLogin = () =>
    router.push(`/login?redirectedFrom=${encodeURIComponent(pathname)}`)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (rating < 1) {
      setErrorMsg(t('ratingRequired'))
      setStatus('error')
      return
    }
    setStatus('submitting')
    setErrorMsg(null)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          rating,
          title: title.trim() || undefined,
          body: body.trim() || undefined,
        }),
        credentials: 'same-origin',
      })
      if (res.status === 401) {
        goLogin()
        return
      }
      if (!res.ok) {
        setErrorMsg(t('errorGeneric'))
        setStatus('error')
        return
      }
      setStatus('success')
      setRating(0)
      setTitle('')
      setBody('')
    } catch {
      setErrorMsg(t('errorGeneric'))
      setStatus('error')
    }
  }

  // En attente de l'état de session : on ne montre rien (évite le flash login↔form).
  if (authed === null) return null

  if (!authed) {
    return (
      <div className="bg-sand-100 border border-sand-300 rounded-xl p-6 text-center">
        <p className="text-[14px] text-ink-700 mb-3">{t('loginToReview')}</p>
        <button
          type="button"
          onClick={goLogin}
          className="inline-flex h-11 items-center justify-center px-6 bg-clay-700 text-on-accent rounded-sm font-semibold text-[13px] tracking-[0.02em] hover:bg-accent-hover transition-colors"
        >
          {t('leaveReview')}
        </button>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="bg-olive-100 border border-olive-600/30 rounded-xl p-6 text-[14px] text-olive-700">
        {t('successPending')}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-sand-100 border border-sand-300 rounded-xl p-6">
      <h3 className="font-serif text-[20px] text-ink-900 mb-4">{t('formHeading')}</h3>

      <div className="mb-4">
        <span className="block text-[12px] font-medium text-ink-700 mb-1.5">{t('ratingLabel')}</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${n}/5`}
              aria-pressed={rating === n}
              className="p-0.5"
            >
              <Star
                size={26}
                strokeWidth={1.5}
                className={n <= (hover || rating) ? 'text-clay-700 fill-clay-700' : 'text-sand-400'}
                fill={n <= (hover || rating) ? 'currentColor' : 'none'}
              />
            </button>
          ))}
        </div>
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={120}
        placeholder={t('titlePlaceholder')}
        className="w-full bg-sand-50 border border-sand-400 rounded-lg px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-500 outline-none focus-visible:border-clay-700 focus-visible:ring-2 focus-visible:ring-clay-700/15 transition-[border-color,box-shadow] mb-3"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={2000}
        rows={3}
        placeholder={t('bodyPlaceholder')}
        className="w-full bg-sand-50 border border-sand-400 rounded-lg px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-500 outline-none focus-visible:border-clay-700 focus-visible:ring-2 focus-visible:ring-clay-700/15 transition-[border-color,box-shadow] resize-y"
      />

      <div className="flex items-center gap-4 mt-4">
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="inline-flex h-11 items-center justify-center px-6 bg-clay-700 text-on-accent rounded-sm font-semibold text-[13px] tracking-[0.02em] hover:bg-accent-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === 'submitting' ? t('submitting') : t('submit')}
        </button>
        {status === 'error' && errorMsg && (
          <span className="text-[12.5px] text-brick-600" role="alert">{errorMsg}</span>
        )}
      </div>
    </form>
  )
}
