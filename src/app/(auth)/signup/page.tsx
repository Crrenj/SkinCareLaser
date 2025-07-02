'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { Mail, Lock, User, Phone, Calendar, ArrowRight } from 'lucide-react'

/**
 * Page d'inscription
 * Permet aux utilisateurs de créer un nouveau compte
 * @returns Page d'inscription avec formulaire
 */
export default function SignupPage() {
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

    // Vérifier que les mots de passe correspondent
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    // Vérifier la longueur du mot de passe
    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    // Vérifier que tous les champs requis sont remplis
    if (!formData.firstName || !formData.lastName) {
      setError('Veuillez remplir tous les champs obligatoires')
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
          setError('Cet email est déjà utilisé. Veuillez vous connecter ou utiliser un autre email.')
        } else if (error.message.includes('invalid') && error.message.includes('email')) {
          setError('Format d\'email invalide. Veuillez vérifier votre adresse email.')
        } else if (error.message.includes('disposable') || error.message.includes('fake')) {
          setError('Les adresses email temporaires ne sont pas acceptées. Veuillez utiliser une adresse email valide.')
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
      setError('Une erreur est survenue lors de l\'inscription')
      console.error('Erreur signup:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12" style={{ backgroundColor: '#EDEAE5' }}>
      <div className="w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* En-tête avec couleur du navbar */}
          <div className="px-8 py-6" style={{ backgroundColor: '#CCC5BD' }}>
            <div className="flex items-center justify-center mb-2">
              <User className="w-12 h-12 text-gray-700" />
            </div>
            <h2 className="text-center text-2xl font-bold text-gray-800">
              Créer un nouveau compte
            </h2>
            <p className="mt-2 text-center text-sm text-gray-700">
              Rejoignez la communauté FARMAU
            </p>
          </div>

          {/* Formulaire */}
          <form className="px-8 py-6 space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                <p className="text-sm text-green-700">Inscription réussie ! Redirection vers la page de connexion...</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Nom et Prénom */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom *
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCC5BD] focus:border-transparent text-gray-900"
                    placeholder="Jean"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Nom *
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCC5BD] focus:border-transparent text-gray-900"
                    placeholder="Dupont"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCC5BD] focus:border-transparent text-gray-900"
                    placeholder="votre@email.com"
                  />
                </div>
              </div>

              {/* Téléphone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCC5BD] focus:border-transparent text-gray-900"
                    placeholder="+33 6 12 34 56 78 (optionnel)"
                  />
                </div>
              </div>

              {/* Date de naissance */}
              <div>
                <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Date de naissance
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="birthDate"
                    name="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCC5BD] focus:border-transparent text-gray-900"
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCC5BD] focus:border-transparent text-gray-900"
                    placeholder="••••••••"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Minimum 6 caractères</p>
              </div>

              {/* Confirmer mot de passe */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmer le mot de passe *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCC5BD] focus:border-transparent text-gray-900"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || success}
                className="w-full flex items-center justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: '#CCC5BD'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B8B1A8'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#CCC5BD'}
              >
                {loading ? (
                  'Inscription...'
                ) : (
                  <>
                    S'inscrire
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </button>
            </div>

            <div className="text-center text-xs text-gray-500">
              * Champs obligatoires
            </div>
          </form>

          {/* Lien connexion */}
          <div className="px-8 pb-6">
            <div className="text-center text-sm text-gray-600">
              Déjà inscrit ?{' '}
              <Link href="/login" className="font-medium text-[#CCC5BD] hover:text-[#B8B1A8] transition-colors">
                Connectez-vous
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 