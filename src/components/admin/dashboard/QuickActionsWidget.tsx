import Link from 'next/link'
import {
  Boxes,
  Building2,
  ClipboardList,
  Cog,
  FileText,
  Mail,
  Mailbox,
  Megaphone,
  Newspaper,
  Palette,
  Plus,
  Tag,
  Users,
} from 'lucide-react'
import { WidgetCard } from './WidgetCard'

type Action = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  primary?: boolean
}

const ACTIONS: Action[] = [
  { href: '/admin/product?new=1', label: 'Añadir producto', icon: Plus, primary: true },
  { href: '/admin/product', label: 'Productos', icon: Boxes },
  { href: '/admin/marques', label: 'Marcas', icon: Building2 },
  { href: '/admin/stock', label: 'Stock', icon: Newspaper },
  { href: '/admin/tags', label: 'Etiquetas', icon: Tag },
  { href: '/admin/reservations', label: 'Reservas', icon: ClipboardList },
  { href: '/admin/messages', label: 'Mensajes', icon: Mail },
  { href: '/admin/annonce', label: 'Página de inicio', icon: Megaphone },
  { href: '/admin/blog', label: 'Blog', icon: FileText },
  { href: '/admin/users', label: 'Clientes', icon: Users },
  { href: '/admin/newsletter', label: 'Newsletter', icon: Mailbox },
  { href: '/admin/apariencia', label: 'Apariencia', icon: Palette },
  { href: '/admin/settings', label: 'Configuración', icon: Cog },
]

export function QuickActionsWidget({ className }: { className?: string }) {
  return (
    <WidgetCard
      title="Accesos rápidos"
      subtitle="Atajos a todas las secciones"
      gap="gap-3"
      className={className}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
        {ACTIONS.map(({ href, label, icon: Icon, primary }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-start gap-2.5 rounded-lg border p-3 no-underline transition-colors ${
              primary
                ? 'bg-clay-700 border-clay-700 text-sand-50 hover:bg-clay-800'
                : 'bg-sand-100 border-sand-200 text-ink-900 hover:border-clay-700/45 hover:bg-sand-200'
            }`}
          >
            <Icon className={`w-4 h-4 ${primary ? 'text-sand-50' : 'text-ink-500'}`} />
            <span className="text-[12.5px] leading-tight">{label}</span>
          </Link>
        ))}
      </div>
    </WidgetCard>
  )
}
