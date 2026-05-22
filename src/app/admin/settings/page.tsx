'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { Store, Truck, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Database } from '@/lib/database.types'

type ShopSettings = Database['public']['Tables']['shop_settings']['Row']

type Tab = 'shop' | 'shipping'

const fetcher = async (url: string): Promise<ShopSettings> => {
  const res = await fetch(url, { credentials: 'same-origin' })
  if (!res.ok) throw new Error('settings_fetch_failed')
  return res.json()
}

export default function SettingsPage() {
  const { data, mutate, isLoading, error } = useSWR<ShopSettings>(
    '/api/admin/settings',
    fetcher,
    { revalidateOnFocus: false },
  )

  const [tab, setTab] = useState<Tab>('shop')
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
      // On envoie tous les champs éditables (l'API filtre via allowlist)
      const payload = {
        shop_name: form.shop_name,
        shop_tagline: form.shop_tagline,
        contact_email: form.contact_email,
        contact_phone: form.contact_phone,
        whatsapp_number: form.whatsapp_number,
        pickup_name: form.pickup_name,
        pickup_address: form.pickup_address,
        pickup_hours: form.pickup_hours,
        pickup_phone: form.pickup_phone,
        shipping_santo_domingo: form.shipping_santo_domingo,
        shipping_interior: form.shipping_interior,
      }
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'same-origin',
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Erreur de sauvegarde')
        return
      }
      toast.success('Paramètres sauvegardés')
      mutate(json, { revalidate: false })
    } catch (err) {
      console.error('PATCH /api/admin/settings:', err)
      toast.error('Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (data) setForm(data)
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-clay-700" />
      </div>
    )
  }

  if (error || !form) {
    return (
      <div className="p-8">
        <p className="text-red-700 bg-red-50 border border-red-200 rounded-md p-4 text-sm">
          Impossible de charger les paramètres boutique.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSave} className="p-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Paramètres boutique</h1>
          <p className="text-sm text-gray-500 mt-1">
            Mis à jour {new Date(form.updated_at).toLocaleString('fr-FR')}
          </p>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <div className="w-56 shrink-0">
          <nav className="space-y-1">
            <TabButton
              active={tab === 'shop'}
              onClick={() => setTab('shop')}
              icon={Store}
              label="Boutique"
            />
            <TabButton
              active={tab === 'shipping'}
              onClick={() => setTab('shipping')}
              icon={Truck}
              label="Livraison & retrait"
            />
          </nav>
        </div>

        {/* Contenu */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {tab === 'shop' && (
              <ShopTab form={form} update={update} />
            )}
            {tab === 'shipping' && (
              <ShippingTab form={form} update={update} />
            )}
          </div>

          {/* Sticky save bar */}
          {isDirty && (
            <div className="sticky bottom-4 mt-4 bg-ink-900 text-white rounded-lg shadow-lg p-4 flex items-center justify-between">
              <span className="text-sm">Modifications non enregistrées</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium bg-white/10 hover:bg-white/20 rounded-md disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium bg-clay-700 hover:bg-clay-800 rounded-md disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Enregistrer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  )
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
        active
          ? 'bg-clay-50 text-clay-900'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <Icon className="h-5 w-5 mr-3" />
      {label}
    </button>
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
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  )
}

type TabProps = {
  form: ShopSettings
  update: <K extends keyof ShopSettings>(field: K, value: ShopSettings[K]) => void
}

function ShopTab({ form, update }: TabProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Identité & contacts</h2>
      <p className="text-sm text-gray-500 mb-6">
        Affiché dans le footer, les pages /contact, /pharmacies, et les liens WhatsApp.
      </p>

      <div className="space-y-5">
        <Field id="shop_name" label="Nom de la boutique">
          <input
            id="shop_name"
            type="text"
            required
            value={form.shop_name}
            onChange={(e) => update('shop_name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-700"
          />
        </Field>

        <Field id="shop_tagline" label="Tagline" hint="Phrase courte sous le logo, OG description par défaut.">
          <input
            id="shop_tagline"
            type="text"
            value={form.shop_tagline ?? ''}
            onChange={(e) => update('shop_tagline', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-700"
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field id="contact_email" label="Email de contact">
            <input
              id="contact_email"
              type="email"
              value={form.contact_email ?? ''}
              onChange={(e) => update('contact_email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-700"
            />
          </Field>
          <Field id="contact_phone" label="Téléphone">
            <input
              id="contact_phone"
              type="tel"
              value={form.contact_phone ?? ''}
              onChange={(e) => update('contact_phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-700"
            />
          </Field>
        </div>

        <Field
          id="whatsapp_number"
          label="Numéro WhatsApp"
          hint="Format international sans espaces (ex: +18094122468). Utilisé pour les liens wa.me/* des réservations."
        >
          <input
            id="whatsapp_number"
            type="tel"
            value={form.whatsapp_number ?? ''}
            onChange={(e) => update('whatsapp_number', e.target.value)}
            placeholder="+18094122468"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-700"
          />
        </Field>
      </div>
    </div>
  )
}

function ShippingTab({ form, update }: TabProps) {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Tarifs de livraison</h2>
        <p className="text-sm text-gray-500 mb-6">
          Affichés dans le tunnel de réservation à l&apos;étape « livraison » et sur la page /livraison.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            id="shipping_santo_domingo"
            label="Santo Domingo (DOP)"
            hint="DN + Gran Santo Domingo · livraison 24-48h."
          >
            <input
              id="shipping_santo_domingo"
              type="number"
              min={0}
              step={1}
              required
              value={form.shipping_santo_domingo}
              onChange={(e) =>
                update('shipping_santo_domingo', Number(e.target.value) || 0)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-700"
            />
          </Field>
          <Field
            id="shipping_interior"
            label="Interior del país (DOP)"
            hint="Tout le reste du pays · livraison 3-5 jours."
          >
            <input
              id="shipping_interior"
              type="number"
              min={0}
              step={1}
              required
              value={form.shipping_interior}
              onChange={(e) =>
                update('shipping_interior', Number(e.target.value) || 0)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-700"
            />
          </Field>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Point de retrait</h2>
        <p className="text-sm text-gray-500 mb-6">
          Affiché dans le tunnel et sur la page /pharmacies. Le retrait sur place est gratuit.
        </p>
        <div className="space-y-5">
          <Field id="pickup_name" label="Nom du point de retrait">
            <input
              id="pickup_name"
              type="text"
              value={form.pickup_name ?? ''}
              onChange={(e) => update('pickup_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-700"
            />
          </Field>
          <Field id="pickup_address" label="Adresse complète">
            <textarea
              id="pickup_address"
              rows={2}
              value={form.pickup_address ?? ''}
              onChange={(e) => update('pickup_address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-700"
            />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field id="pickup_hours" label="Horaires d'ouverture">
              <input
                id="pickup_hours"
                type="text"
                value={form.pickup_hours ?? ''}
                onChange={(e) => update('pickup_hours', e.target.value)}
                placeholder="Lun-Vie 6h30-17h · Sáb 8h-16h"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-700"
              />
            </Field>
            <Field id="pickup_phone" label="Téléphone pharmacie">
              <input
                id="pickup_phone"
                type="tel"
                value={form.pickup_phone ?? ''}
                onChange={(e) => update('pickup_phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-700"
              />
            </Field>
          </div>
        </div>
      </section>
    </div>
  )
}
