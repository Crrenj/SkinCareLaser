'use client'

import { useState } from 'react'
import { Send, AlertCircle, CheckCircle } from 'lucide-react'
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
    <div className={`bg-sand-50 border border-sand-300 rounded-lg p-6 lg:p-8 ${className}`}>
      <h2 className="font-serif text-[26px] lg:text-[30px] text-ink-900 mb-2 -tracking-[0.01em]">
        {t('title')}
      </h2>
      <p className="text-[14.5px] text-ink-700 mb-6 leading-[1.6]">{t('intro')}</p>

      {success && (
        <div
          role="status"
          aria-live="polite"
          className="mb-6 p-4 bg-olive-600/10 border border-olive-600/40 rounded-lg flex items-center gap-2"
        >
          <CheckCircle className="w-5 h-5 text-olive-600 shrink-0" />
          <p className="text-[14px] text-olive-700">{t('success')}</p>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-6 p-4 bg-brick-600/10 border border-brick-600/40 rounded-lg flex items-center gap-2"
        >
          <AlertCircle className="w-5 h-5 text-brick-600 shrink-0" />
          <p className="text-[14px] text-brick-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-[13px] font-medium text-ink-800 mb-2">
            {t('emailLabel')}
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
            placeholder={t('emailPlaceholder')}
            className="w-full px-3 py-3 bg-sand-50 border border-sand-300 rounded-lg text-[14px] text-ink-900 placeholder:text-ink-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-700 focus-visible:border-transparent"
          />
          <p className="mt-1.5 text-[12px] text-ink-500">
            {t('emailHint')}
          </p>
        </div>

        <div>
          <label htmlFor="subject" className="block text-[13px] font-medium text-ink-800 mb-2">
            {t('subjectLabel')}
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            required
            value={formData.subject}
            onChange={handleChange}
            disabled={loading}
            placeholder={t('subjectPlaceholder')}
            className="w-full px-3 py-3 bg-sand-50 border border-sand-300 rounded-lg text-[14px] text-ink-900 placeholder:text-ink-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-700 focus-visible:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-[13px] font-medium text-ink-800 mb-2">
            {t('messageLabel')}
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={6}
            value={formData.message}
            onChange={handleChange}
            disabled={loading}
            placeholder={t('messagePlaceholder')}
            className="w-full px-3 py-3 bg-sand-50 border border-sand-300 rounded-lg text-[14px] text-ink-900 placeholder:text-ink-500 resize-vertical focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-700 focus-visible:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-clay-700 text-on-accent text-[12.5px] font-semibold uppercase tracking-wider rounded-lg hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-700 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sand-50" />
              {t('submitLoading')}
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              {t('submitButton')}
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-sand-300">
        <div className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-ink-500 mb-2.5">
          {t('conditionsHeading')}
        </div>
        <ul className="text-[12.5px] text-ink-700 leading-[1.7] space-y-0.5">
          <li>• {t('conditions.haveAccount')}</li>
          <li>• {t('conditions.useAccountEmail')}</li>
          <li>• {t('conditions.replyTime')}</li>
          <li>• {t('conditions.allFieldsRequired')}</li>
        </ul>
      </div>
    </div>
  )
}
