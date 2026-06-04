import Link from 'next/link'

export type MessageRow = {
  id: string
  from: string
  subject: string
  preview: string
  createdAt: string
  unread: boolean
}

function relativeTime(iso: string): string {
  const now = Date.now()
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return ''
  const diffMin = Math.max(1, Math.round((now - t) / 60000))
  if (diffMin < 60) return `Hace ${diffMin} min`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `Hace ${diffH} h`
  const diffD = Math.round(diffH / 24)
  if (diffD === 1) return 'Ayer'
  if (diffD < 7) return `Hace ${diffD} días`
  return new Intl.DateTimeFormat('es-DO', { day: 'numeric', month: 'short' }).format(new Date(iso))
}

export function RecentMessagesWidget({
  rows,
  className = 'col-span-12',
}: {
  rows: MessageRow[]
  className?: string
}) {
  return (
    <article className={`bg-sand-50 border border-sand-300 rounded-xl p-5 lg:p-6 flex flex-col gap-3.5 ${className}`}>
      <div className="flex justify-between items-baseline">
        <div>
          <h3 className="font-serif text-[20px] text-ink-900 m-0 mb-0.5">Mensajes recientes</h3>
          <small className="text-[11.5px] text-ink-500">
            5 últimos · contact form + asesoría
          </small>
        </div>
        <Link
          href="/admin/messages"
          className="text-[11.5px] tracking-[0.06em] text-ink-700 hover:text-ink-900 border-b border-transparent hover:border-current transition-colors"
        >
          Ver bandeja →
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-[13px] text-ink-500 py-6 text-center">Sin mensajes recientes.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-0 border border-sand-200 rounded-lg overflow-hidden bg-sand-50">
          {rows.slice(0, 5).map((m, i) => (
            <Link
              key={m.id}
              href={`/admin/messages?id=${m.id}`}
              className={`flex flex-col gap-1.5 px-4 py-3.5 text-[13px] leading-[1.5] min-w-0 no-underline text-inherit hover:bg-sand-100 transition-colors ${
                i < rows.length - 1 ? 'lg:border-r border-sand-200' : ''
              }`}
            >
              <div className="flex justify-between items-center text-[11.5px] text-ink-500 font-medium">
                <span className="truncate">{m.from}</span>
                {m.unread && (
                  <span className="bg-clay-700 text-sand-50 text-[9.5px] px-1.5 py-0.5 rounded-full uppercase tracking-[0.06em] font-semibold whitespace-nowrap">
                    Sin leer
                  </span>
                )}
              </div>
              <div className="font-semibold text-ink-900 text-[13.5px] truncate">
                {m.subject || '—'}
              </div>
              <div className="text-ink-700 text-[12.5px] line-clamp-2">
                {m.preview}
              </div>
              <span className="text-[10.5px] text-ink-500 tracking-[0.04em] mt-auto">
                {relativeTime(m.createdAt)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </article>
  )
}
