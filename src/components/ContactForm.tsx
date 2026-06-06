'use client'

import { useState } from 'react'
import { Mail, Send, AlertCircle, CheckCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface ContactFormProps {
  className?: string
}

export default function ContactForm({ className = '' }: ContactFormProps) {
  const t = useTranslations('ContactForm')
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
        setError(data.error || t('errors.generic'))
      }
    } catch {
      setError(t('errors.network'))
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
          {t('title')}
        </h2>
        <p className="text-ink-700">
          {t('intro')}
        </p>
      </div>

      {success && (
        <div role="status" aria-live="polite" className="mb-6 p-4 bg-sand-50 border border-olive-600 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-olive-600" />
            <p className="text-olive-600">
              {t('success')}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="mb-6 p-4 bg-clay-50 border border-brick-600 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-brick-600" />
            <p className="text-brick-600">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-ink-800 mb-2">
            {t('emailLabel')}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-500" />
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-3 border border-sand-300 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-600 focus-visible:border-transparent"
              placeholder={t('emailPlaceholder')}
              disabled={loading}
            />
          </div>
          <p className="mt-1 text-xs text-ink-500">
            {t('emailHint')}
          </p>
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-ink-800 mb-2">
            {t('subjectLabel')}
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            required
            value={formData.subject}
            onChange={handleChange}
            className="w-full px-3 py-3 border border-sand-300 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-600 focus-visible:border-transparent"
            placeholder={t('subjectPlaceholder')}
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-ink-800 mb-2">
            {t('messageLabel')}
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={6}
            value={formData.message}
            onChange={handleChange}
            className="w-full px-3 py-3 border border-sand-300 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-600 focus-visible:border-transparent resize-vertical"
            placeholder={t('messagePlaceholder')}
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-clay-700 text-white font-medium rounded-lg hover:bg-clay-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-600 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              {t('submitLoading')}
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              {t('submitButton')}
            </>
          )}
        </button>
      </form>

      <div className="mt-6 p-4 bg-clay-50 rounded-lg">
        <h3 className="font-medium text-ink-900 mb-2">
          {t('conditionsHeading')}
        </h3>
        <ul className="text-sm text-clay-800 space-y-1">
          <li>• {t('conditions.haveAccount')}</li>
          <li>• {t('conditions.useAccountEmail')}</li>
          <li>• {t('conditions.replyTime')}</li>
          <li>• {t('conditions.allFieldsRequired')}</li>
        </ul>
      </div>
    </div>
  )
}
