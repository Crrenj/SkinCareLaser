'use client'

import { useState } from 'react'
import { Trash2, AlertOctagon, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { supabase } from '@/lib/supabaseClient'

type Status = 'idle' | 'deleting' | 'error'

// Mot exact à recopier pour confirmer (figé côté serveur dans accountDeleteBody).
const CONFIRM_WORD = 'ELIMINAR'

/**
 * Effacement réel du compte (droit à l'oubli). Remplace l'ancien mailto :
 * confirmation par saisie du mot exact, POST /api/account/delete, puis signOut
 * + redirection vers la home. États loading/erreur, i18n FR/ES/EN.
 *
 * Garde-fous serveur (admin bloqué, anonymisation des réservations avant
 * suppression) dans la route ; ici on porte seulement l'UX.
 */
export function DeleteAccountSection() {
  const t = useTranslations('Account.security')
  const router = useRouter()
  const [confirmText, setConfirmText] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const canSubmit = confirmText.trim() === CONFIRM_WORD && status !== 'deleting'

  const handleDelete = async () => {
    if (!canSubmit) return
    setStatus('deleting')
    setErrorMsg(null)
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: CONFIRM_WORD }),
      })

      if (!res.ok) {
        // 403 spécifique : compte admin → message dédié (révocation requise).
        let key: 'deleteErrorAdmin' | 'deleteError' = 'deleteError'
        if (res.status === 403) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null
          if (data?.error === 'admin_must_be_revoked') key = 'deleteErrorAdmin'
        }
        setErrorMsg(t(key))
        setStatus('error')
        return
      }

      // Succès : on coupe la session locale puis on renvoie vers la home.
      await supabase.auth.signOut()
      router.replace('/')
      router.refresh()
    } catch {
      setErrorMsg(t('deleteError'))
      setStatus('error')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="delete-confirm"
          className="text-[13px] text-ink-700 leading-relaxed"
        >
          {t.rich('deleteConfirmLabel', {
            word: () => (
              <span className="font-mono font-semibold text-brick-700">{CONFIRM_WORD}</span>
            ),
          })}
        </label>
        <input
          id="delete-confirm"
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          disabled={status === 'deleting'}
          autoComplete="off"
          spellCheck={false}
          placeholder={CONFIRM_WORD}
          aria-describedby={errorMsg ? 'delete-error' : undefined}
          className="max-w-xs rounded-sm border border-sand-300 bg-sand-50 px-3.5 py-2.5 text-[14px] text-ink-900 font-mono tracking-wide placeholder:text-ink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brick-600 disabled:opacity-60"
        />
      </div>

      <button
        type="button"
        onClick={handleDelete}
        disabled={!canSubmit}
        className="inline-flex items-center gap-2.5 self-start rounded-sm bg-brick-600 px-5 py-3 text-[12.5px] font-semibold uppercase tracking-wider text-white transition-colors hover:bg-brick-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === 'deleting' ? (
          <Loader2 size={15} strokeWidth={1.8} className="animate-spin" />
        ) : (
          <Trash2 size={15} strokeWidth={1.8} />
        )}
        {status === 'deleting' ? t('deleting') : t('dangerCta')}
      </button>

      {errorMsg && (
        <p
          id="delete-error"
          role="alert"
          className="flex items-center gap-2 text-[13.5px] text-brick-600"
        >
          <AlertOctagon size={16} strokeWidth={1.8} />
          {errorMsg}
        </p>
      )}
    </div>
  )
}
