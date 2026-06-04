'use client'

import { logger } from '@/lib/logger'
import { useEffect, useState } from 'react'
import useSWR from 'swr'
import {
  Loader2,
  Store,
  Smartphone,
  CalendarClock,
  ShoppingBag,
  MessageCircle,
  MapPin,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { PageHeader } from '@/components/admin/dashboard/PageHeader'
import type { Database } from '@/lib/database.types'

type ShopSettings = Database['public']['Tables']['shop_settings']['Row']

const fetcher = async (url: string): Promise<ShopSettings> => {
  const res = await fetch(url, { credentials: 'same-origin' })
  if (!res.ok) throw new Error('settings_fetch_failed')
  return res.json()
}

/** Champs édités sur cette page (Click & Collect — aucun tarif de livraison). */
const EDITABLE_FIELDS = [
  'shop_name',
  'shop_tagline',
  'contact_email',
  'contact_phone',
  'whatsapp_number',
  'pickup_name',
  'pickup_address',
  'pickup_hours',
  'pickup_phone',
] as const

const inputCls =
  'w-full px-3.5 py-2.5 text-[14px] text-ink-900 bg-sand-50 border border-sand-300 rounded-lg placeholder:text-ink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-clay-700 transition-shadow'

export default function SettingsPage() {
  const t = useTranslations('Admin.settings')
  const { data, mutate, isLoading, error } = useSWR<ShopSettings>(
    '/api/admin/settings',
    fetcher,
    { revalidateOnFocus: false },
  )

  const [form, setForm] = useState<ShopSettings | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  const update = <K extends keyof ShopSettings>(field: K, value: ShopSettings[K]) => {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  const isDirty = !!data && !!form && JSON.stringify(data) !== JSON.stringify(form)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form || !isDirty) return
    setSaving(true)
    try {
      const payload = Object.fromEntries(
        EDITABLE_FIELDS.map((f) => [f, form[f]]),
      )
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'same-origin',
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || t('saveError'))
        return
      }
      toast.success(t('saveSuccess'))
      mutate(json, { revalidate: false })
    } catch (err) {
      logger.error('PATCH /api/admin/settings:', err)
      toast.error(t('networkError'))
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (data) setForm(data)
  }

  return (
    <div className="min-h-screen bg-sand-50">
      <PageHeader crumbs={[{ label: t('crumb') }, { label: t('title') }]} title={t('title')} />

      <form onSubmit={handleSave} className="px-5 lg:px-8 py-6 max-w-[880px]">
        <p className="font-serif italic text-[16px] text-ink-700 mb-7 max-w-[620px]">
          {t('subtitle')}
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <Loader2 className="w-6 h-6 animate-spin text-clay-700" />
          </div>
        ) : error || !form ? (
          <p className="text-brick-800 bg-brick-50 border border-brick-200 rounded-md p-4 text-sm">
            {t('loadError')}
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            {/* 1 — Identité */}
            <Section icon={Store} title={t('identityTitle')} hint={t('identityHint')}>
              <Field id="shop_name" label={t('shopName')}>
                <input
                  id="shop_name"
                  type="text"
                  required
                  value={form.shop_name}
                  onChange={(e) => update('shop_name', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field id="shop_tagline" label={t('tagline')} hint={t('taglineHint')}>
                <input
                  id="shop_tagline"
                  type="text"
                  value={form.shop_tagline ?? ''}
                  onChange={(e) => update('shop_tagline', e.target.value)}
                  className={inputCls}
                />
              </Field>
            </Section>

            {/* 2 — Contact & WhatsApp */}
            <Section icon={Smartphone} title={t('contactTitle')} hint={t('contactHint')}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field id="contact_email" label={t('contactEmail')}>
                  <input
                    id="contact_email"
                    type="email"
                    value={form.contact_email ?? ''}
                    onChange={(e) => update('contact_email', e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field id="contact_phone" label={t('contactPhone')}>
                  <input
                    id="contact_phone"
                    type="tel"
                    value={form.contact_phone ?? ''}
                    onChange={(e) => update('contact_phone', e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>
              <Field id="whatsapp_number" label={t('whatsappNumber')} hint={t('whatsappHint')}>
                <input
                  id="whatsapp_number"
                  type="tel"
                  value={form.whatsapp_number ?? ''}
                  onChange={(e) => update('whatsapp_number', e.target.value)}
                  placeholder="+18094122468"
                  className={inputCls}
                />
              </Field>
            </Section>

            {/* 3 — Réservation & retrait (Click & Collect) */}
            <Section icon={CalendarClock} title={t('reservationTitle')} hint={t('reservationHint')}>
              {/* Encart : logique de réservation */}
              <div className="rounded-xl border border-clay-200 bg-clay-50 p-5 lg:p-6 mb-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <FlowStep
                    n="01"
                    icon={ShoppingBag}
                    title={t('flowStep1Title')}
                    body={t('flowStep1Body')}
                  />
                  <FlowStep
                    n="02"
                    icon={MessageCircle}
                    title={t('flowStep2Title')}
                    body={t('flowStep2Body')}
                  />
                  <FlowStep
                    n="03"
                    icon={MapPin}
                    title={t('flowStep3Title')}
                    body={t('flowStep3Body')}
                  />
                </div>
                <div className="mt-5 pt-4 border-t border-clay-200 flex items-center gap-2 text-[12.5px] text-clay-800">
                  <Clock size={15} strokeWidth={1.9} className="shrink-0" />
                  <span>{t('holdNote')}</span>
                </div>
              </div>

              <div className="pt-1">
                <h3 className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-ink-500 font-semibold mb-1">
                  {t('pickupTitle')}
                </h3>
                <p className="text-[12px] text-ink-500 mb-4 leading-[1.45] max-w-[56ch]">
                  {t('pickupHint')}
                </p>
                <div className="flex flex-col gap-4">
                  <Field id="pickup_name" label={t('pickupName')}>
                    <input
                      id="pickup_name"
                      type="text"
                      value={form.pickup_name ?? ''}
                      onChange={(e) => update('pickup_name', e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <Field id="pickup_address" label={t('pickupAddress')}>
                    <textarea
                      id="pickup_address"
                      rows={2}
                      value={form.pickup_address ?? ''}
                      onChange={(e) => update('pickup_address', e.target.value)}
                      className={`${inputCls} resize-y`}
                    />
                  </Field>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field id="pickup_hours" label={t('pickupHours')}>
                      <input
                        id="pickup_hours"
                        type="text"
                        value={form.pickup_hours ?? ''}
                        onChange={(e) => update('pickup_hours', e.target.value)}
                        placeholder="Lun-Vie 6h30-17h · Sáb 8h-16h"
                        className={inputCls}
                      />
                    </Field>
                    <Field id="pickup_phone" label={t('pickupPhone')}>
                      <input
                        id="pickup_phone"
                        type="tel"
                        value={form.pickup_phone ?? ''}
                        onChange={(e) => update('pickup_phone', e.target.value)}
                        className={inputCls}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            </Section>

            <p className="font-serif italic text-[13px] text-ink-500 px-1">
              {t('updatedAt', { date: new Date(form.updated_at).toLocaleDateString() })}
              {' · '}
              {t('publicNote')}
            </p>
          </div>
        )}

        {/* Barre d'enregistrement collante (apparaît si modifications) */}
        {isDirty && (
          <div className="sticky bottom-4 mt-6 bg-ink-900 text-sand-50 rounded-xl shadow-lg px-5 py-3.5 flex items-center justify-between gap-4">
            <span className="text-[13px] font-medium">{t('unsavedChanges')}</span>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={handleReset}
                disabled={saving}
                className="px-4 py-2 text-[13px] font-medium text-sand-50/85 hover:bg-sand-50/10 rounded-lg disabled:opacity-50 transition-colors"
              >
                {t('resetBtn')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-[13px] font-medium bg-clay-700 hover:bg-clay-800 text-sand-50 rounded-lg disabled:opacity-50 inline-flex items-center gap-2 transition-colors"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('saveBtn')}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

function Section({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  title: string
  hint: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-sand-300 bg-sand-50 p-6 lg:p-7 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <header className="flex items-start gap-3.5 mb-6">
        <span className="w-9 h-9 rounded-lg bg-sand-100 border border-sand-300 flex items-center justify-center text-clay-700 shrink-0">
          <Icon size={17} strokeWidth={1.8} />
        </span>
        <div className="min-w-0">
          <h2 className="font-serif text-[20px] text-ink-900 leading-tight tracking-[-0.005em]">
            {title}
          </h2>
          <p className="text-[13px] text-ink-500 mt-0.5 leading-[1.5] max-w-[56ch]">{hint}</p>
        </div>
      </header>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  )
}

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[12.5px] font-medium text-ink-700 mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11.5px] text-ink-500 mt-1.5 leading-[1.45]">{hint}</p>}
    </div>
  )
}

function FlowStep({
  n,
  icon: Icon,
  title,
  body,
}: {
  n: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  title: string
  body: string
}) {
  return (
    <div>
      <div className="flex items-center gap-2.5 mb-2">
        <span className="w-8 h-8 rounded-lg bg-sand-50 border border-clay-200 flex items-center justify-center text-clay-700 shrink-0">
          <Icon size={16} strokeWidth={1.8} />
        </span>
        <span className="font-serif italic text-[22px] leading-none text-clay-400">{n}</span>
      </div>
      <div className="font-serif text-[15.5px] text-ink-900 leading-tight">{title}</div>
      <p className="text-[12.5px] text-ink-700 mt-1 leading-[1.5]">{body}</p>
    </div>
  )
}
