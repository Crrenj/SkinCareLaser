'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Mail, Phone, User, Calendar, Save } from 'lucide-react'

type Profile = {
  id: string
  first_name: string | null
  last_name: string | null
  display_name: string | null
  phone: string | null
  birth_date: string | null
}

interface ProfileEditFormProps {
  profile: Profile
  userEmail: string
  redirectTo?: string
}

export default function ProfileEditForm({
  profile,
  userEmail,
  redirectTo,
}: ProfileEditFormProps) {
  const router = useRouter()
  const [form, setForm] = useState({
    first_name: profile.first_name ?? '',
    last_name: profile.last_name ?? '',
    display_name: profile.display_name ?? '',
    phone: profile.phone ?? '',
    birth_date: profile.birth_date ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!form.phone.trim()) {
      setError('Le téléphone est obligatoire')
      return
    }

    setSaving(true)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        first_name: form.first_name.trim() || null,
        last_name: form.last_name.trim() || null,
        display_name: form.display_name.trim() || null,
        phone: form.phone.trim(),
        birth_date: form.birth_date || null,
      })
      .eq('id', profile.id)

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setSuccess(true)

    // Si on vient d'une page précédente (ex: /cart pour réserver), y revenir
    if (redirectTo) {
      // Petit délai pour que le user voie le message de succès
      setTimeout(() => router.push(redirectTo), 1200)
    } else {
      router.refresh()
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-lg p-6 space-y-5"
    >
      {error && (
        <div className="bg-clay-50 border-l-4 border-brick-600 p-4 rounded">
          <p className="text-sm text-brick-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-sand-50 border-l-4 border-olive-600 p-4 rounded">
          <p className="text-sm text-olive-600">
            Profil mis à jour avec succès.
            {redirectTo && ' Redirection en cours…'}
          </p>
        </div>
      )}

      {/* Email (read-only, géré par auth) */}
      <div>
        <label className="block text-sm font-medium text-ink-800 mb-1">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-400" />
          <input
            type="email"
            value={userEmail}
            disabled
            className="w-full pl-10 pr-3 py-2 border border-sand-300 rounded-lg bg-sand-100 text-ink-700 cursor-not-allowed"
          />
        </div>
        <p className="mt-1 text-xs text-ink-500">
          L&apos;email ne peut pas être modifié ici.
        </p>
      </div>

      {/* Prénom + Nom */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="first_name"
            className="block text-sm font-medium text-ink-800 mb-1"
          >
            Prénom
          </label>
          <input
            id="first_name"
            name="first_name"
            type="text"
            value={form.first_name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sand-400 text-ink-900"
            placeholder="Jean"
          />
        </div>
        <div>
          <label
            htmlFor="last_name"
            className="block text-sm font-medium text-ink-800 mb-1"
          >
            Nom
          </label>
          <input
            id="last_name"
            name="last_name"
            type="text"
            value={form.last_name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sand-400 text-ink-900"
            placeholder="Dupont"
          />
        </div>
      </div>

      {/* Display name */}
      <div>
        <label
          htmlFor="display_name"
          className="block text-sm font-medium text-ink-800 mb-1"
        >
          Nom affiché
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-400" />
          <input
            id="display_name"
            name="display_name"
            type="text"
            value={form.display_name}
            onChange={handleChange}
            className="w-full pl-10 pr-3 py-2 border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sand-400 text-ink-900"
            placeholder="Comment vous appeler ?"
          />
        </div>
      </div>

      {/* Téléphone — obligatoire */}
      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-ink-800 mb-1"
        >
          Téléphone *
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-400" />
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            value={form.phone}
            onChange={handleChange}
            className="w-full pl-10 pr-3 py-2 border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sand-400 text-ink-900"
            placeholder="+1 809 123 4567"
          />
        </div>
        <p className="mt-1 text-xs text-ink-500">
          Requis pour la confirmation de réservation via WhatsApp.
        </p>
      </div>

      {/* Date de naissance */}
      <div>
        <label
          htmlFor="birth_date"
          className="block text-sm font-medium text-ink-800 mb-1"
        >
          Date de naissance
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-400" />
          <input
            id="birth_date"
            name="birth_date"
            type="date"
            value={form.birth_date}
            onChange={handleChange}
            className="w-full pl-10 pr-3 py-2 border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sand-400 text-ink-900"
          />
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium rounded-lg text-white bg-clay-700 hover:bg-clay-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            'Enregistrement…'
          ) : (
            <>
              <Save className="w-4 h-4" />
              Enregistrer
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-ink-500 text-center">* Champs obligatoires</p>
    </form>
  )
}
