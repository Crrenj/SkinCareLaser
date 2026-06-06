'use client'

import { useCallback, useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { toLocaleTag } from '@/lib/constants'
import { nextStatusFor, type DbReservationStatus } from './types'

/**
 * Helpers de formatage localisés du module réservations (labels de statut,
 * libellé de l'action « marquer X », temps relatif). Remplace les anciennes
 * fonctions ES-en-dur de `types.ts` — bornées au translator `Admin.reservations`
 * + à la locale admin courante (cookie `farmau_admin_locale`).
 */
export function useReservationFormat() {
  const t = useTranslations('Admin.reservations')
  const locale = useLocale()
  const localeTag = toLocaleTag(locale)

  const absFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(localeTag, {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
    [localeTag],
  )

  const statusLabel = useCallback((s: DbReservationStatus) => t(`status.${s}`), [t])

  const nextStatusLabel = useCallback(
    (s: DbReservationStatus): string | null => {
      const next = nextStatusFor(s)
      return next ? t(`markAs.${next}`) : null
    },
    [t],
  )

  const relativeAndAbsolute = useCallback(
    (iso: string | null | undefined): { rel: string; abs: string } => {
      if (!iso) return { rel: '—', abs: '' }
      const d = new Date(iso)
      const abs = absFmt.format(d)
      const seconds = Math.round((Date.now() - d.getTime()) / 1000)
      if (seconds < 60) return { rel: t('time.justNow'), abs }
      if (seconds < 3600) return { rel: t('time.minutesAgo', { count: Math.floor(seconds / 60) }), abs }
      if (seconds < 86400) return { rel: t('time.hoursAgo', { count: Math.floor(seconds / 3600) }), abs }
      if (seconds < 172800) return { rel: t('time.yesterday'), abs }
      const days = Math.floor(seconds / 86400)
      if (days < 7) return { rel: t('time.daysAgo', { count: days }), abs }
      return { rel: abs, abs }
    },
    [t, absFmt],
  )

  return { statusLabel, nextStatusLabel, relativeAndAbsolute }
}
