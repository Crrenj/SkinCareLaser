'use client'

import { logger } from '@/lib/logger'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { supabase } from '@/lib/supabaseClient'
import { AuthLayout, AuthDivider, AuthNotice } from '@/components/auth/AuthLayout'
import { OAuthButtons } from '@/components/auth/OAuthButtons'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { PasswordStrength } from '@/components/auth/PasswordStrength'

type SignupErrorKey =
  | 'passwordsMismatch'
  | 'passwordTooShort'
  | 'missingFields'
  | 'phoneRequired'
  | 'emailAlreadyUsed'
  | 'invalidEmail'
  | 'disposableEmail'
  | 'generic'

const MIN_PASSWORD_LENGTH = 8

export default function SignupPage() {
  const t = useTranslations('Signup')
  const tOAuth = useTranslations('OAuth')
  const router = useRouter()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    birthDate: '',
  })
  const [error, setError] = useState<SignupErrorKey | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.firstName || !formData.lastName) {
      setError('missingFields')
      return
    }
    if (!formData.phone.trim()) {
      setError('phoneRequired')
      return
    }
    if (formData.password.length < MIN_PASSWORD_LENGTH) {
      setError('passwordTooShort')
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError('passwordsMismatch')
      return
    }

    setLoading(true)

    try {
      const origin =
        process.env.NEXT_PUBLIC_SITE_URL ??
        (typeof window !== 'undefined' ? window.location.origin : '')

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            birth_date: formData.birthDate || null,
          },
        },
      })

      if (signUpError) {
        if (
          signUpError.message.includes('already registered') ||
          signUpError.message.includes('already exists') ||
          signUpError.message.includes('duplicate key') ||
          signUpError.code === '23505'
        ) {
          setError('emailAlreadyUsed')
        } else if (
          signUpError.message.includes('invalid') &&
          signUpError.message.includes('email')
        ) {
          setError('invalidEmail')
        } else if (
          signUpError.message.includes('disposable') ||
          signUpError.message.includes('fake')
        ) {
          setError('disposableEmail')
        } else {
          setError('generic')
        }
        return
      }

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            birth_date: formData.birthDate || null,
          })
          .eq('id', data.user.id)

        if (profileError) {
          logger.error('Erreur mise à jour profil:', profileError)
        }

        setSuccess(true)
        setTimeout(() => router.push('/login'), 2200)
      }
    } catch (err) {
      setError('generic')
      logger.error('Erreur signup:', err)
    } finally {
      setLoading(false)
    }
  }

  // Le bouton reste cliquable pour que l'utilisateur reçoive un message
  // d'erreur explicite (validation déclenchée dans `handleSubmit`).
  const canSubmit = !loading && !success

  return (
    <AuthLayout quote={t('aside.quote')} cite={t('aside.cite')}>
      <div>
        <h1 className="font-serif text-[36px] leading-[1.1] tracking-[-0.01em] text-ink-900">
          {t('title')}
        </h1>
        <p className="text-[14.5px] text-ink-700 leading-relaxed mt-2">
          {t('lede')}
        </p>
      </div>

      <OAuthButtons intent="signup" />

      <AuthDivider label={tOAuth('dividerLabel')} />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="firstName" className="text-[13px] font-medium text-ink-700">
              {t('firstNameLabel')}
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              value={formData.firstName}
              onChange={handleChange}
              placeholder={t('firstNamePlaceholder')}
              aria-invalid={error === 'missingFields' && !formData.firstName}
              aria-describedby={error ? 'signup-error' : undefined}
              className="h-11 px-3 rounded-lg border border-sand-300 bg-sand-50
                         text-[14.5px] text-ink-900 placeholder:text-ink-500
                         focus-visible:outline-none focus-visible:border-clay-700
                         focus:ring-[3px] focus:ring-clay-700/20 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="lastName" className="text-[13px] font-medium text-ink-700">
              {t('lastNameLabel')}
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              value={formData.lastName}
              onChange={handleChange}
              placeholder={t('lastNamePlaceholder')}
              aria-invalid={error === 'missingFields' && !formData.lastName}
              aria-describedby={error ? 'signup-error' : undefined}
              className="h-11 px-3 rounded-lg border border-sand-300 bg-sand-50
                         text-[14.5px] text-ink-900 placeholder:text-ink-500
                         focus-visible:outline-none focus-visible:border-clay-700
                         focus:ring-[3px] focus:ring-clay-700/20 transition-colors"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-[13px] font-medium text-ink-700">
            {t('emailLabel')}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder={t('emailPlaceholder')}
            aria-invalid={error === 'emailAlreadyUsed' || error === 'invalidEmail' || error === 'disposableEmail'}
            aria-describedby={error ? 'signup-error' : undefined}
            className="h-11 px-3 rounded-lg border border-sand-300 bg-sand-50
                       text-[14.5px] text-ink-900 placeholder:text-ink-500
                       focus-visible:outline-none focus-visible:border-clay-700
                       focus:ring-[3px] focus:ring-clay-700/20 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="phone" className="text-[13px] font-medium text-ink-700">
            {t('phoneLabel')}
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            value={formData.phone}
            onChange={handleChange}
            placeholder={t('phonePlaceholder')}
            aria-invalid={error === 'phoneRequired'}
            aria-describedby={error ? 'signup-error' : undefined}
            className="h-11 px-3 rounded-lg border border-sand-300 bg-sand-50
                       text-[14.5px] text-ink-900 placeholder:text-ink-500
                       focus-visible:outline-none focus-visible:border-clay-700
                       focus:ring-[3px] focus:ring-clay-700/20 transition-colors"
          />
          <p className="text-[12px] text-ink-500">{t('phoneHint')}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="birthDate" className="text-[13px] font-medium text-ink-700">
            {t('birthDateLabel')}
          </label>
          <input
            id="birthDate"
            name="birthDate"
            type="date"
            value={formData.birthDate}
            onChange={handleChange}
            className="h-11 px-3 rounded-lg border border-sand-300 bg-sand-50
                       text-[14.5px] text-ink-900 placeholder:text-ink-500
                       focus-visible:outline-none focus-visible:border-clay-700
                       focus:ring-[3px] focus:ring-clay-700/20 transition-colors"
          />
        </div>

        <div>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            required
            value={formData.password}
            onChange={handleChange}
            placeholder={t('passwordPlaceholder')}
            label={t('passwordLabel')}
            hint={t('passwordHintInline')}
            aria-invalid={error === 'passwordTooShort' || error === 'passwordsMismatch'}
            aria-describedby={error ? 'signup-error' : undefined}
          />
          <PasswordStrength password={formData.password} />
        </div>

        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          required
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder={t('passwordPlaceholder')}
          label={t('confirmPasswordLabel')}
          aria-invalid={error === 'passwordsMismatch'}
          aria-describedby={error ? 'signup-error' : undefined}
        />

        {error && <AuthNotice variant="error" id="signup-error">{t(`errors.${error}`)}</AuthNotice>}
        {success && <AuthNotice variant="ok">{t('successMessage')}</AuthNotice>}

        <button
          type="submit"
          disabled={!canSubmit}
          className="h-11 rounded-lg bg-clay-700 text-sand-50 text-[14.5px] font-medium
                     hover:bg-clay-800 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t('submitLoading') : t('submitButton')}
        </button>

        <p className="text-[12px] text-ink-500 leading-relaxed">
          {t.rich('termsAccept', {
            terms: (chunks) => (
              <Link href="/legal/cgv" className="text-clay-700 underline underline-offset-4 hover:text-clay-800">
                {chunks}
              </Link>
            ),
            privacy: (chunks) => (
              <Link href="/legal/confidentialite" className="text-clay-700 underline underline-offset-4 hover:text-clay-800">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </form>

      <div className="flex items-center justify-center gap-2 text-[13px]">
        <span className="text-ink-700">{t('alreadySignedUp')}</span>
        <Link
          href="/login"
          className="text-clay-700 underline underline-offset-4 hover:text-clay-800 font-medium"
        >
          {t('signInLink')}
        </Link>
      </div>

    </AuthLayout>
  )
}
