import { WidgetCard } from './WidgetCard'
import { MeterBar } from './MeterBar'

export type CustomerStats = {
  total: number
  withPhone: number
  new7d: number
  new30d: number
  byLocale: { locale: string; n: number }[]
}

const LOCALE_LABELS: Record<string, string> = {
  es: 'Español',
  fr: 'Français',
  en: 'English',
  '—': 'Sin idioma',
}

export function CustomersWidget({
  data,
  className,
}: {
  data: CustomerStats
  className?: string
}) {
  const maxLocale = Math.max(1, ...data.byLocale.map((l) => l.n))

  return (
    <WidgetCard
      title="Clientes"
      subtitle="Cuentas registradas"
      link={{ href: '/admin/users', label: 'Ver clientes →' }}
      gap="gap-4"
      className={className}
    >
      <div className="flex items-end gap-3">
        <span className="font-serif text-[40px] lg:text-[46px] leading-[0.85] text-ink-900 tracking-[-0.01em]">
          {data.total}
        </span>
        <span className="text-[11.5px] text-ink-500 leading-[1.4] pb-1.5">
          <b className="text-olive-600 font-semibold">+{data.new7d}</b> esta semana
          <br />+{data.new30d} en 30 días
        </span>
      </div>

      <MeterBar
        label="Con teléfono"
        value={data.withPhone}
        total={data.total}
        accent="olive"
        valueText={`${data.withPhone}/${data.total}`}
      />

      <div className="flex flex-col gap-2 pt-0.5">
        <span className="text-[10.5px] tracking-[0.14em] uppercase text-ink-500 font-semibold">
          Idioma preferido
        </span>
        {data.byLocale.length === 0 ? (
          <span className="text-[12px] text-ink-500">Sin datos.</span>
        ) : (
          data.byLocale.map((l) => (
            <MeterBar
              key={l.locale}
              label={LOCALE_LABELS[l.locale] ?? l.locale}
              value={l.n}
              total={maxLocale}
              accent="ink"
              valueText={String(l.n)}
            />
          ))
        )}
      </div>
    </WidgetCard>
  )
}
