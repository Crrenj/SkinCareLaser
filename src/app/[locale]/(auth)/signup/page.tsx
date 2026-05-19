'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Mail, Lock, User, Phone, Calendar, ArrowRight } from 'lucide-react'

/**
 * Page d'inscription
 * Permet aux utilisateurs de créer un nouveau compte
 * @returns Page d'inscription avec formulaire
 */
export default function SignupPage() {
  const t = useTranslations('Signup')
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    birthDate: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  /**
   * Gère les changements dans les champs du formulaire
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  /**
   * Gère la soumission du formulaire d'inscription
   * @param e - Event du formulaire
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError(t('errors.passwordsMismatch'))
      return
    }

    if (formData.password.length < 6) {
      setError(t('errors.passwordTooShort'))
      return
    }

    if (!formData.firstName || !formData.lastName) {
      setError(t('errors.missingFields'))
      return
    }

    if (!formData.phone || !formData.phone.trim()) {
      setError(t('errors.phoneRequired'))
      return
    }

    setLoading(true)

    try {
      // Inscription avec Supabase
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            birth_date: formData.birthDate
          }
        }
      })

      if (error) {
        // Gérer spécifiquement l'erreur d'email déjà utilisé
        if (error.message.includes('already registered') ||
            error.message.includes('already exists') ||
            error.message.includes('duplicate key') ||
            error.code === '23505') {
          setError(t('errors.emailAlreadyUsed'))
        } else if (error.message.includes('invalid') && error.message.includes('email')) {
          setError(t('errors.invalidEmail'))
        } else if (error.message.includes('disposable') || error.message.includes('fake')) {
          setError(t('errors.disposableEmail'))
        } else {
          setError(error.message)
        }
        return
      }

      if (data.user) {
        // Mettre à jour le profil avec les informations supplémentaires
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            birth_date: formData.birthDate || null
          })
          .eq('id', data.user.id)

        if (profileError) {
          console.error('Erreur mise à jour profil:', profileError)
        }

        setSuccess(true)
        
        // Redirection vers login après 2 secondes
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      }
    } catch (err) {
      setError(t('errors.generic'))
      console.error('Erreur signup:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 bg-sand-200">
      <div className="w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* En-tête avec couleur du navbar */}
          <div className="px-8 py-6 bg-sand-400">
            <div className="flex items-center justify-center mb-2">
              <User className="w-12 h-12 text-ink-800" />
            </div>
            <h2 className="text-center text-2xl font-bold text-ink-800">
              {t('title')}
            </h2>
            <p className="mt-2 text-center text-sm text-ink-800">
              {t('subtitle')}
            </p>
          </div>

          {/* Formulaire */}
          <form className="px-8 py-6 space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-clay-50 border-l-4 border-brick-600 p-4 rounded">
                <p className="text-sm text-brick-600">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-sand-50 border-l-4 border-olive-600 p-4 rounded">
                <p className="text-sm text-olive-600">{t('successMessage')}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Nom et Prénom */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-ink-800 mb-1">
                    {t('firstNameLabel')}
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sand-400 focus:border-transparent text-ink-900"
                    placeholder={t('firstNamePlaceholder')}
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-ink-800 mb-1">
                    {t('lastNameLabel')}
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sand-400 focus:border-transparent text-ink-900"
                    placeholder={t('lastNamePlaceholder')}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-ink-800 mb-1">
                  {t('emailLabel')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sand-400 focus:border-transparent text-ink-900"
                    placeholder={t('emailPlaceholder')}
                  />
                </div>
              </div>

              {/* Téléphone (obligatoire pour la réservation) */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-ink-800 mb-1">
                  {t('phoneLabel')}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-400" />
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sand-400 focus:border-transparent text-ink-900"
                    placeholder={t('phonePlaceholder')}
                  />
                </div>
                <p className="mt-1 text-xs text-ink-500">{t('phoneHint')}</p>
              </div>

              {/* Date de naissance */}
              <div>
                <label htmlFor="birthDate" className="block text-sm font-medium text-ink-800 mb-1">
                  {t('birthDateLabel')}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-400" />
                  <input
                    id="birthDate"
                    name="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sand-400 focus:border-transparent text-ink-900"
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-ink-800 mb-1">
                  {t('passwordLabel')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-400" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sand-400 focus:border-transparent text-ink-900"
                    placeholder={t('passwordPlaceholder')}
                  />
                </div>
                <p className="mt-1 text-xs text-ink-500">{t('passwordHint')}</p>
              </div>

              {/* Confirmer mot de passe */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-ink-800 mb-1">
                  {t('confirmPasswordLabel')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-400" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sand-400 focus:border-transparent text-ink-900"
                    placeholder={t('passwordPlaceholder')}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || success}
                className="w-full flex items-center justify-center py-3 px-4 text-sm font-medium rounded-lg text-white bg-clay-700 hover:bg-clay-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  t('submitLoading')
                ) : (
                  <>
                    {t('submitButton')}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </button>
            </div>

            <div className="text-center text-xs text-ink-500">
              {t('requiredFields')}
            </div>
          </form>

          {/* Lien connexion */}
          <div className="px-8 pb-6">
            <div className="text-center text-sm text-ink-700">
              {t('alreadySignedUp')}{' '}
              <Link href="/login" className="font-medium text-clay-700 hover:text-clay-800 transition-colors">
                {t('signInLink')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 