'use client'

import { useState } from 'react'
import { Key, AlertOctagon, CheckCircle2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { supabase } from '@/lib/supabaseClient'

interface SecurityActionsProps {
  email: string
}

type Status = 'idle' | 'sending' | 'sent' | 'error'

/**
 * Bouton "Changer mon mot de passe" qui déclenche un email de reset Supabase
 * (envoi vers /reset-password). Pas de form in-page : on réutilise le tunnel
 * existant pour limiter la surface d'attaque (pas besoin de re-saisir
 * l'ancien mot de passe, Supabase ne le demande pas).
 */
export function SecurityActions({ email }: SecurityActionsProps) {
  const t = useTranslations('Account.security')
  const [status, setStatus] = useState<Status>('idle')

  const handleResetPassword = async () => {
    setStatus('sending')
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ??
      (typeof window !== 'undefined' ? window.location.origin : '')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    })
    setStatus(error ? 'error' : 'sent')
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={handleResetPassword}
        disabled={status === 'sending' || status === 'sent'}
        className="inline-flex items-center gap-2.5 px-5 py-3 rounded-sm bg-clay-700 hover:bg-clay-800 text-on-accent text-[12.5px] font-semibold uppercase tracking-wider transition-colors disabled:opacity-60 disabled:cursor-not-allowed self-start"
      >
        <Key size={15} strokeWidth={1.8} />
        {status === 'sending' ? t('sending') : t('changePasswordCta')}
      </button>

      {status === 'sent' && (
        <p className="flex items-center gap-2 text-[13.5px] text-olive-700">
          <CheckCircle2 size={16} strokeWidth={1.8} />
          {t('emailSent', { email })}
        </p>
      )}

      {status === 'error' && (
        <p className="flex items-center gap-2 text-[13.5px] text-brick-600">
          <AlertOctagon size={16} strokeWidth={1.8} />
          {t('emailError')}
        </p>
      )}
    </div>
  )
}
