'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { ArrowUp, ArrowDown, Eye, EyeOff, Loader2, Save } from 'lucide-react'
import { resolveHomeLayout, type HomeLayoutEntry } from '@/lib/homeSections'

/**
 * Panneau admin (écran Annonces) : réordonne et affiche/masque les sections
 * de la page d'accueil. Sections NON supprimables (issues du registre fixe).
 */
export function HomeLayoutPanel() {
  const t = useTranslations('Admin.homeLayout')
  const ts = useTranslations('Admin.homeLayout.sections')
  const [layout, setLayout] = useState<HomeLayoutEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    let active = true
    fetch('/api/admin/home-layout')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error())))
      .then((d) => { if (active) setLayout(resolveHomeLayout(d.layout)) })
      .catch(() => { if (active) toast.error(t('loadError')) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [t])

  const move = useCallback((index: number, dir: -1 | 1) => {
    setLayout((prev) => {
      const j = index + dir
      if (j < 0 || j >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[j]] = [next[j], next[index]]
      return next
    })
    setDirty(true)
  }, [])

  const toggle = useCallback((index: number) => {
    setLayout((prev) => prev.map((e, i) => (i === index ? { ...e, enabled: !e.enabled } : e)))
    setDirty(true)
  }, [])

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/home-layout', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout }),
      })
      if (!res.ok) {
        toast.error(t('saveError'))
        return
      }
      toast.success(t('saved'))
      setDirty(false)
    } catch {
      toast.error(t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-xl border border-sand-200 bg-sand-50 p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-[19px] text-ink-900">{t('title')}</h2>
          <p className="mt-0.5 text-[12.5px] text-ink-500">{t('hint')}</p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving || !dirty}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-clay-700 px-4 py-2 text-[13px] font-medium text-sand-50 transition-colors hover:bg-clay-800 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {saving ? t('saving') : t('save')}
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-sand-200" />
          ))}
        </div>
      ) : (
        <ol className="flex flex-col gap-2">
          {layout.map((entry, i) => (
            <li
              key={entry.key}
              className={`flex items-center gap-3 rounded-lg border border-sand-200 bg-white px-3 py-2.5 ${entry.enabled ? '' : 'opacity-60'}`}
            >
              <span className="w-5 text-center font-mono text-[11px] text-ink-500">{i + 1}</span>
              <span className="flex-1 text-[14px] text-ink-900">{ts(entry.key)}</span>
              <span
                className={`text-[11px] font-medium uppercase tracking-wide ${entry.enabled ? 'text-olive-700' : 'text-ink-500'}`}
              >
                {entry.enabled ? t('visible') : t('hidden')}
              </span>
              <button
                type="button"
                onClick={() => toggle(i)}
                aria-label={entry.enabled ? t('hide') : t('show')}
                title={entry.enabled ? t('hide') : t('show')}
                className="rounded-md p-1.5 text-ink-600 transition-colors hover:bg-sand-100"
              >
                {entry.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label={t('moveUp')}
                  title={t('moveUp')}
                  className="rounded-md p-1.5 text-ink-600 transition-colors hover:bg-sand-100 disabled:opacity-30"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === layout.length - 1}
                  aria-label={t('moveDown')}
                  title={t('moveDown')}
                  className="rounded-md p-1.5 text-ink-600 transition-colors hover:bg-sand-100 disabled:opacity-30"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
