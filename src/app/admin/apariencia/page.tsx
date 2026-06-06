'use client'

import { logger } from '@/lib/logger'
import { useEffect, useState } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import { Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { PageHeader } from '@/components/admin/dashboard/PageHeader'
import { FarmauBird } from '@/components/brand/FarmauLogo'
import { THEMES, type ThemeMode, type ThemeName } from '@/lib/themes'

type AppearanceRow = {
  theme: ThemeName
  default_mode: ThemeMode
  allow_visitor_mode: boolean
  updated_at: string
}

const fetcher = async (url: string): Promise<AppearanceRow> => {
  const res = await fetch(url, { credentials: 'same-origin' })
  if (!res.ok) throw new Error('appearance_fetch_failed')
  return res.json()
}

export default function AppearancePage() {
  const t = useTranslations('Admin.appearance')
  const { data, mutate, isLoading, error } = useSWR<AppearanceRow>(
    '/api/admin/appearance',
    fetcher,
    { revalidateOnFocus: false },
  )

  const [theme, setTheme] = useState<ThemeName>('terra')
  const [mode, setMode] = useState<ThemeMode>('light')
  const [allowVisitor, setAllowVisitor] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!data) return
    setTheme(data.theme)
    setMode(data.default_mode)
    setAllowVisitor(data.allow_visitor_mode)
  }, [data])

  const isDirty =
    !!data &&
    (theme !== data.theme ||
      mode !== data.default_mode ||
      allowVisitor !== data.allow_visitor_mode)

  const handleSave = async () => {
    if (!isDirty || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/appearance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          theme,
          default_mode: mode,
          allow_visitor_mode: allowVisitor,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || t('saveError'))
        return
      }
      toast.success(t('saveSuccess'))
      mutate(json, { revalidate: false })
      // Rafraîchit le thème live partout (favicon + shell admin) sans reload.
      globalMutate('/api/theme')
    } catch (err) {
      logger.error('PATCH /api/admin/appearance:', err)
      toast.error(t('networkError'))
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (!data) return
    setTheme(data.theme)
    setMode(data.default_mode)
    setAllowVisitor(data.allow_visitor_mode)
  }

  return (
    <div className="min-h-screen bg-sand-50">
      <PageHeader
        crumbs={[{ label: t('crumbPersonalization') }, { label: t('crumbAppearance') }]}
        title={t('title')}
      />

      <div className="px-5 lg:px-8 py-6 max-w-[1040px]">
        <p className="font-serif italic text-[16px] text-ink-700 mb-7 max-w-[640px]">
          {t('subtitle')}
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <Loader2 className="w-6 h-6 animate-spin text-clay-700" />
          </div>
        ) : error || !data ? (
          <p className="text-brick-800 bg-brick-50 border border-brick-200 rounded-md p-4 text-sm">
            {t('loadError')}
          </p>
        ) : (
          <>
            {/* Grille de 6 thèmes */}
            <div
              role="radiogroup"
              aria-label={t('title')}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5"
            >
              {THEMES.map((th) => {
                const selected = th.slug === theme
                return (
                  <button
                    key={th.slug}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={t('themeCardAria', { name: th.name })}
                    onClick={() => setTheme(th.slug)}
                    style={selected ? { boxShadow: '0 0 0 3px rgba(184,111,74,.12)' } : undefined}
                    className={`relative text-left bg-sand-50 rounded-[10px] p-3.5 border-[1.5px] transition-[border-color,transform] duration-150 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-clay-700 ${
                      selected
                        ? 'border-clay-600'
                        : 'border-sand-300 hover:border-ink-500'
                    }`}
                  >
                    {selected && (
                      <Check
                        className="absolute top-2.5 right-2.5 w-4 h-4 text-clay-600"
                        strokeWidth={2.5}
                        aria-hidden
                      />
                    )}
                    {/* Aperçu : fond du thème + colibri à sa couleur */}
                    <div
                      className="flex items-center justify-center h-[60px] rounded-md mb-2.5 overflow-hidden"
                      style={{ background: th.swatches[0], border: `1px solid ${th.swatches[1]}1a` }}
                    >
                      <FarmauBird size={34} color={th.swatches[1]} />
                    </div>
                    {/* Strip de 3 swatches */}
                    <div className="flex h-3 rounded-[4px] overflow-hidden mb-2.5">
                      {th.swatches.map((c, i) => (
                        <span key={i} className="flex-1" style={{ background: c }} />
                      ))}
                    </div>
                    <div className="font-serif text-[17px] text-ink-900 leading-tight">
                      {th.name}
                    </div>
                    <div className="font-mono text-[11.5px] tracking-[0.04em] text-ink-500 mt-0.5">
                      {th.descMini}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Toggles : mode par défaut + override visiteur */}
            <div className="mt-8 flex flex-wrap items-start gap-8">
              <div>
                <div className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-ink-500 font-medium mb-2">
                  {t('defaultModeLabel')}
                </div>
                <Segmented
                  value={mode}
                  onChange={(v) => setMode(v as ThemeMode)}
                  options={[
                    { value: 'light', label: t('modeLight') },
                    { value: 'dark', label: t('modeDark') },
                    { value: 'system', label: t('modeSystem') },
                  ]}
                />
              </div>
              <div>
                <div className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-ink-500 font-medium mb-2">
                  {t('visitorLabel')}
                </div>
                <Segmented
                  value={allowVisitor ? 'yes' : 'no'}
                  onChange={(v) => setAllowVisitor(v === 'yes')}
                  options={[
                    { value: 'yes', label: t('visitorYes') },
                    { value: 'no', label: t('visitorNo') },
                  ]}
                />
              </div>
            </div>

            {/* Footer formulaire */}
            <div className="mt-9 pt-6 border-t border-sand-300 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-serif italic text-[14px] text-ink-500">
                {t('updatedAt', { date: new Date(data.updated_at).toLocaleDateString() })}
                {' · '}
                {t('publicNote')}
              </span>
              <div className="flex gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={!isDirty || saving}
                  className="px-4 py-2.5 text-[13px] font-medium text-ink-700 rounded-lg hover:bg-sand-200 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!isDirty || saving}
                  className="px-4 py-2.5 text-[13px] font-medium bg-clay-700 text-on-accent rounded-lg hover:bg-accent-hover disabled:opacity-40 inline-flex items-center gap-2 transition-colors"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t('save')}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="inline-flex bg-sand-100 border border-sand-300 rounded-lg p-[3px] gap-0.5">
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={`px-4 py-1.5 text-[11px] font-mono tracking-[0.08em] uppercase font-medium rounded-md transition-colors ${
              active
                ? 'bg-sand-50 text-ink-900 shadow-sm'
                : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
