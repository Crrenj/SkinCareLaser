'use client'

import { useState } from 'react'
import { Mail, Send, AlertCircle, CheckCircle } from 'lucide-react'

interface ContactFormProps {
  className?: string
}

export default function ContactForm({ className = '' }: ContactFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    subject: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setFormData({ email: '', subject: '', message: '' })
      } else {
        setError(data.error || 'Erreur lors de l\'envoi du message')
      }
    } catch {
      setError('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-ink-900 mb-2">
          Contactez-nous
        </h2>
        <p className="text-ink-700">
          Envoyez-nous un message. Vous devez avoir un compte pour nous contacter.
        </p>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-sand-50 border border-olive-600 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-olive-600" />
            <p className="text-olive-600">
              Votre message a été envoyé avec succès ! Nous vous répondrons rapidement.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-clay-50 border border-brick-600 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-brick-600" />
            <p className="text-brick-600">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-ink-800 mb-2">
            Adresse email *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-400" />
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-3 border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-clay-600 focus:border-transparent"
              placeholder="votre@email.com"
              disabled={loading}
            />
          </div>
          <p className="mt-1 text-xs text-ink-500">
            Utilisez l&apos;email de votre compte utilisateur
          </p>
        </div>

        {/* Sujet */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-ink-800 mb-2">
            Sujet *
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            required
            value={formData.subject}
            onChange={handleChange}
            className="w-full px-3 py-3 border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-clay-600 focus:border-transparent"
            placeholder="Quel est l'objet de votre message ?"
            disabled={loading}
          />
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-ink-800 mb-2">
            Message *
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={6}
            value={formData.message}
            onChange={handleChange}
            className="w-full px-3 py-3 border border-sand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-clay-600 focus:border-transparent resize-vertical"
            placeholder="Décrivez votre demande en détail..."
            disabled={loading}
          />
        </div>

        {/* Bouton d'envoi */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-clay-700 text-white font-medium rounded-lg hover:bg-clay-800 focus:outline-none focus:ring-2 focus:ring-clay-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Envoi en cours...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Envoyer le message
            </>
          )}
        </button>
      </form>

      {/* Informations supplémentaires */}
      <div className="mt-6 p-4 bg-clay-50 rounded-lg">
        <h3 className="font-medium text-ink-900 mb-2">
          Conditions d&apos;envoi
        </h3>
        <ul className="text-sm text-clay-800 space-y-1">
          <li>• Vous devez avoir un compte utilisateur</li>
          <li>• Utilisez l&apos;email associé à votre compte</li>
          <li>• Nous répondons sous 24-48h ouvrées</li>
          <li>• Tous les champs sont obligatoires</li>
        </ul>
      </div>
    </div>
  )
} 