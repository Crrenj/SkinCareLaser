import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'

type AuthLayoutProps = {
  children: React.ReactNode
  quote: string
  cite?: string
}

export function AuthLayout({ children, quote, cite }: AuthLayoutProps) {
  const t = useTranslations('AuthAside')

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-sand-100">
      <aside className="relative hidden lg:flex bg-sand-300 p-12 flex-col justify-between overflow-hidden">
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-[30%] -right-[20%] w-[60%] aspect-square rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(142,82,50,0.18), transparent 60%)',
          }}
        />
        <Link
          href="/"
          className="relative z-10 font-serif text-[28px] tracking-[0.02em] text-ink-900"
        >
          FARMAU
        </Link>
        <blockquote className="relative z-10 font-serif italic text-[28px] leading-[1.25] text-ink-900 max-w-md">
          <span aria-hidden className="select-none">«&nbsp;</span>
          {quote}
          <span aria-hidden className="select-none">&nbsp;»</span>
          {cite && (
            <cite className="not-italic block mt-5 font-sans text-[11.5px] tracking-[0.16em] uppercase text-ink-700">
              {cite}
            </cite>
          )}
        </blockquote>
        <p className="relative z-10 text-[11.5px] tracking-[0.14em] uppercase text-ink-700">
          {t('location')}
        </p>
      </aside>

      <main className="flex flex-col">
        <div className="flex items-center justify-between p-5 lg:hidden">
          <Link href="/" className="font-serif text-[22px] text-ink-900">
            FARMAU
          </Link>
          <LocaleSwitcher variant="inline" />
        </div>
        <div className="flex-1 flex items-center justify-center px-6 pb-10 lg:p-12">
          <div className="w-full max-w-[420px] flex flex-col gap-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-[12px] text-ink-500">
      <span className="flex-1 h-px bg-sand-300" />
      <span>{label}</span>
      <span className="flex-1 h-px bg-sand-300" />
    </div>
  )
}

export function AuthNotice({
  variant,
  children,
}: {
  variant: 'ok' | 'error'
  children: React.ReactNode
}) {
  const styles =
    variant === 'ok'
      ? 'bg-olive-600/10 border-olive-600/30 text-olive-600'
      : 'bg-brick-600/10 border-brick-600/25 text-brick-600'
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`rounded-lg border px-4 py-3 text-[13.5px] leading-snug ${styles}`}
    >
      {children}
    </div>
  )
}
