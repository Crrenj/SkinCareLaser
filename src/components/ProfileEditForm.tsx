'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { supabase } from '@/lib/supabaseClient'
import { safeRedirectPath } from '@/lib/safeRedirect'
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
  const t = useTranslations('Profile')
  const router = useRouter()
  const [form, setForm] = useState({
    email: userEmail,
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
      setError(t('phoneRequiredError'))
      return
    }

    const emailChanged =
      form.email.trim().toLowerCase() !== userEmail.trim().toLowerCase()
    if (emailChanged && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError(t('emailInvalid'))
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

    if (updateError) {
      setSaving(false)
      setError(updateError.message)
      return
    }

    // L'email vit dans Supabase Auth (pas la table profiles). Avec la
    // confirmation désactivée, le changement s'applique immédiatement.
    if (emailChanged) {
      const { error: emailError } = await supabase.auth.updateUser({
        email: form.email.trim(),
      })
      if (emailError) {
        setSaving(false)
        setError(emailError.message)
        return
      }
    }

    setSaving(false)
    setSuccess(true)

    // Si on vient d'une page précédente (ex: /cart pour réserver), y revenir.
    // La cible `from` est assainie (anti open-redirect, cf. safeRedirect). [C-31]
    const safeDest = safeRedirectPath(redirectTo)
    if (safeDest) {
      // Petit délai pour que le user voie le message de succès
      setTimeout(() => router.push(safeDest), 1200)
    } else {
      router.refresh()
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-sand-100 rounded-2xl shadow-lg p-6 space-y-5"
    >
      {error && (
        <div className="bg-clay-50 border-l-4 border-brick-600 p-4 rounded">
          <p className="text-sm text-brick-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-sand-50 border-l-4 border-olive-600 p-4 rounded">
          <p className="text-sm text-olive-600">
            {t('saveSuccess')}
            {redirectTo && ` ${t('redirecting')}`}
          </p>
        </div>
      )}

      {/* Email — vit dans Supabase Auth, modifiable */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-ink-800 mb-1">
          {t('emailLabel')}
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-500" />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            className="w-full pl-10 pr-3 py-2 border border-sand-300 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sand-400 text-ink-900"
          />
        </div>
        <p className="mt-1 text-xs text-ink-500">
          {t('emailHint')}
        </p>
      </div>

      {/* Prénom + Nom */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="first_name"
            className="block text-sm font-medium text-ink-800 mb-1"
          >
            {t('firstNameLabel')}
          </label>
          <input
            id="first_name"
            name="first_name"
            type="text"
            value={form.first_name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-sand-300 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sand-400 text-ink-900"
            placeholder={t('firstNamePlaceholder')}
          />
        </div>
        <div>
          <label
            htmlFor="last_name"
            className="block text-sm font-medium text-ink-800 mb-1"
          >
            {t('lastNameLabel')}
          </label>
          <input
            id="last_name"
            name="last_name"
            type="text"
            value={form.last_name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-sand-300 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sand-400 text-ink-900"
            placeholder={t('lastNamePlaceholder')}
          />
        </div>
      </div>

      {/* Display name */}
      <div>
        <label
          htmlFor="display_name"
          className="block text-sm font-medium text-ink-800 mb-1"
        >
          {t('displayNameLabel')}
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-500" />
          <input
            id="display_name"
            name="display_name"
            type="text"
            value={form.display_name}
            onChange={handleChange}
            className="w-full pl-10 pr-3 py-2 border border-sand-300 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sand-400 text-ink-900"
            placeholder={t('displayNamePlaceholder')}
          />
        </div>
      </div>

      {/* Téléphone — obligatoire */}
      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-ink-800 mb-1"
        >
          {t('phoneLabel')}
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-500" />
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            value={form.phone}
            onChange={handleChange}
            className="w-full pl-10 pr-3 py-2 border border-sand-300 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sand-400 text-ink-900"
            placeholder={t('phonePlaceholder')}
          />
        </div>
        <p className="mt-1 text-xs text-ink-500">
          {t('phoneHint')}
        </p>
      </div>

      {/* Date de naissance */}
      <div>
        <label
          htmlFor="birth_date"
          className="block text-sm font-medium text-ink-800 mb-1"
        >
          {t('birthDateLabel')}
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-500" />
          <input
            id="birth_date"
            name="birth_date"
            type="date"
            value={form.birth_date}
            onChange={handleChange}
            className="w-full pl-10 pr-3 py-2 border border-sand-300 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sand-400 text-ink-900"
          />
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium rounded-lg text-on-accent bg-clay-700 hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            t('saving')
          ) : (
            <>
              <Save className="w-4 h-4" />
              {t('saveButton')}
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-ink-500 text-center">{t('requiredFields')}</p>
    </form>
  )
}
