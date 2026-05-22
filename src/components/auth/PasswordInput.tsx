'use client'

import { forwardRef, useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslations } from 'next-intl'

type PasswordInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type'
> & {
  label: string
  /** Texte secondaire après le label (ex: "min. 8 caracteres") */
  hint?: string
}

/**
 * Champ mot de passe avec toggle œil. Aligné sur la spec auth Sprint 3.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ label, hint, className, ...rest }, ref) {
    const t = useTranslations('Auth')
    const [show, setShow] = useState(false)
    const reactId = useId()
    const inputId = rest.id ?? reactId

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-[13px] font-medium text-ink-700">
          {label}
          {hint && (
            <span className="ml-1.5 font-normal text-ink-500">· {hint}</span>
          )}
        </label>
        <div className="relative">
          <input
            {...rest}
            ref={ref}
            id={inputId}
            type={show ? 'text' : 'password'}
            className={
              'w-full h-11 px-3 pr-10 rounded-lg border border-sand-300 ' +
              'bg-sand-50 text-[14.5px] text-ink-900 placeholder:text-ink-500 ' +
              'focus-visible:outline-none focus-visible:border-clay-700 ' +
              'focus:ring-[3px] focus:ring-clay-700/20 transition-colors ' +
              (className ?? '')
            }
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            tabIndex={-1}
            aria-label={show ? t('hidePassword') : t('showPassword')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-ink-500 hover:text-ink-900 transition-colors"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
    )
  },
)
