'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { ReservationDisclaimer } from './ReservationDisclaimer'

export type AddressData = {
  firstName: string
  lastName: string
  street: string
  city: string
  postalCode: string
  phone: string
}

type Props = {
  initial: AddressData
  onSubmit: (data: AddressData) => void
}

export function AddressStep({ initial, onSubmit }: Props) {
  const t = useTranslations('Reservation.address')
  const [data, setData] = useState<AddressData>(initial)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (k: keyof AddressData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setData((d) => ({ ...d, [k]: e.target.value }))
    if (error) setError(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !data.firstName.trim() ||
      !data.lastName.trim() ||
      !data.street.trim() ||
      !data.city.trim() ||
      !data.postalCode.trim() ||
      !data.phone.trim()
    ) {
      setError(t('errors.missingFields'))
      return
    }
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-[28px] lg:text-[36px] leading-[1.1] tracking-[-0.01em] text-ink-900">
          {t('title')}
        </h1>
        <p className="text-[14.5px] text-ink-700 mt-2">{t('lede')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Field
          label={t('firstNameLabel')}
          required
          value={data.firstName}
          onChange={handleChange('firstName')}
          placeholder={t('firstNamePlaceholder')}
          autoComplete="given-name"
        />
        <Field
          label={t('lastNameLabel')}
          required
          value={data.lastName}
          onChange={handleChange('lastName')}
          placeholder={t('lastNamePlaceholder')}
          autoComplete="family-name"
        />

        <Field
          fullWidth
          label={t('streetLabel')}
          required
          value={data.street}
          onChange={handleChange('street')}
          placeholder={t('streetPlaceholder')}
          hint={t('streetHint')}
          autoComplete="street-address"
        />

        <Field
          label={t('cityLabel')}
          required
          value={data.city}
          onChange={handleChange('city')}
          placeholder={t('cityPlaceholder')}
          autoComplete="address-level2"
        />
        <Field
          label={t('postalCodeLabel')}
          required
          value={data.postalCode}
          onChange={handleChange('postalCode')}
          placeholder={t('postalCodePlaceholder')}
          maxLength={5}
          hint={t('postalCodeHint')}
          autoComplete="postal-code"
          inputMode="numeric"
        />

        <Field
          fullWidth
          label={t('phoneLabel')}
          required
          type="tel"
          value={data.phone}
          onChange={handleChange('phone')}
          placeholder={t('phonePlaceholder')}
          autoComplete="tel"
          hint={
            <>
              <strong className="text-ink-800 font-semibold">{t('phoneHintStrong')}</strong>{' '}
              {t('phoneHint')}
            </>
          }
        />
      </div>

      <ReservationDisclaimer />

      {error && (
        <p
          role="alert"
          className="text-[13px] text-brick-600 bg-brick-600/10 border border-brick-600/25 rounded-lg px-3 py-2"
        >
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3">
        <Link
          href="/cart"
          className="text-[13.5px] text-ink-700 border-b border-transparent hover:border-current pb-0.5 self-start sm:self-auto transition-colors"
        >
          {t('backToCart')}
        </Link>
        <button
          type="submit"
          className="h-12 px-7 rounded-lg bg-clay-700 text-sand-50 font-medium text-[14.5px] hover:bg-clay-800 transition-colors inline-flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          {t('continue')}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </form>
  )
}

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hint?: React.ReactNode
  fullWidth?: boolean
  required?: boolean
}

function Field({ label, hint, fullWidth, required, ...rest }: FieldProps) {
  return (
    <label className={`flex flex-col gap-1.5 ${fullWidth ? 'lg:col-span-2' : ''}`}>
      <span className="text-[13px] font-medium text-ink-700">
        {label}
        {required && <span className="ml-0.5 text-clay-700">*</span>}
      </span>
      <input
        {...rest}
        required={required}
        className="h-11 px-3 rounded-lg border border-sand-300 bg-sand-50 text-[14.5px] text-ink-900
                   placeholder:text-ink-500 focus:outline-none focus:border-clay-700
                   focus:ring-[3px] focus:ring-clay-700/20 transition-colors"
      />
      {hint && <span className="text-[12px] text-ink-500 leading-[1.4]">{hint}</span>}
    </label>
  )
}
