'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Phone,
  Mail,
  User,
  Clock,
  Package,
  CheckCircle,
  XCircle,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react'

type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'collected'
  | 'expired'
  | 'cancelled'

interface ReservationItem {
  id: string
  product_id: string | null
  product_name: string
  unit_price: number
  quantity: number
}

interface Reservation {
  id: string
  status: ReservationStatus
  expires_at: string
  created_at: string
  updated_at: string
  confirmed_at: string | null
  collected_at: string | null
  contact_phone: string
  contact_email: string
  contact_name: string | null
  total_items: number
  total_price: number
  currency: string
  admin_notes: string | null
  items: ReservationItem[]
}

const STATUS_LABELS: Record<ReservationStatus | 'all', string> = {
  all: 'Toutes',
  pending: 'En attente',
  confirmed: 'Confirmées',
  collected: 'Collectées',
  expired: 'Expirées',
  cancelled: 'Annulées',
}

const STATUS_COLORS: Record<ReservationStatus, string> = {
  pending: 'bg-clay-50 text-clay-800 border-clay-700',
  confirmed: 'bg-sand-50 text-olive-600 border-olive-600',
  collected: 'bg-sand-100 text-ink-700 border-ink-400',
  expired: 'bg-sand-100 text-ink-500 border-ink-400',
  cancelled: 'bg-clay-50 text-brick-600 border-brick-600',
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return "à l'instant"
  if (seconds < 3600) return `il y a ${Math.floor(seconds / 60)} min`
  if (seconds < 86400) return `il y a ${Math.floor(seconds / 3600)} h`
  return `il y a ${Math.floor(seconds / 86400)} j`
}

function timeUntil(iso: string): string {
  const seconds = Math.floor((new Date(iso).getTime() - Date.now()) / 1000)
  if (seconds <= 0) return 'expirée'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min restantes`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h restantes`
  return `${Math.floor(seconds / 86400)} j restants`
}

function buildWhatsAppLink(r: Reservation): string {
  const phone = r.contact_phone.replace(/\D/g, '')
  const ref = r.id.slice(0, 8).toUpperCase()
  const itemsList = r.items
    .map((i) => `• ${i.product_name} × ${i.quantity}`)
    .join('\n')
  const text = [
    `Bonjour ${r.contact_name || ''}`.trim() + ',',
    '',
    `Voici les détails de votre réservation FARMAU #${ref} :`,
    itemsList,
    '',
    `Total : ${r.total_price.toFixed(2)} ${r.currency}`,
    '',
    `Quand pourriez-vous passer en pharmacie pour la collecte ?`,
  ].join('\n')
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}

export default function ReservationsAdminPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'all'>(
    'pending',
  )
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchReservations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/admin/reservations?${params}`)
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'Erreur de chargement')
      }
      setReservations(json.reservations || [])
      setCounts(json.counts || {})
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchReservations()
  }, [fetchReservations])

  const updateStatus = useCallback(
    async (id: string, newStatus: ReservationStatus) => {
      setActingId(id)
      try {
        const res = await fetch('/api/admin/reservations', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status: newStatus }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Erreur')
        await fetchReservations()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur de mise à jour')
      } finally {
        setActingId(null)
      }
    },
    [fetchReservations],
  )

  const tabs = useMemo(() => {
    const order: (ReservationStatus | 'all')[] = [
      'pending',
      'confirmed',
      'collected',
      'expired',
      'cancelled',
      'all',
    ]
    return order
  }, [])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-ink-900 mb-2">Réservations</h1>
        <p className="text-ink-700">
          Liste des réservations clients. Contactez le client via WhatsApp pour
          fixer l&apos;heure de collecte, puis marquez la réservation
          comme « confirmée », puis « collectée ».
        </p>
      </div>

      {/* Filtres status */}
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const active = statusFilter === tab
          const count = counts[tab] ?? 0
          return (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                active
                  ? 'bg-clay-700 border-clay-700 text-white'
                  : 'bg-white border-sand-300 text-ink-700 hover:bg-sand-100'
              }`}
            >
              {STATUS_LABELS[tab]}{' '}
              <span className={active ? 'text-white' : 'text-ink-500'}>
                ({count})
              </span>
            </button>
          )
        })}
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 bg-clay-50 border-l-4 border-brick-600 p-3 rounded text-sm text-brick-600"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-clay-700" />
        </div>
      ) : reservations.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center text-ink-500">
          Aucune réservation pour ce filtre.
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((r) => {
            const expanded = expandedId === r.id
            const isActing = actingId === r.id
            const shortRef = r.id.slice(0, 8).toUpperCase()

            return (
              <div
                key={r.id}
                className="bg-white rounded-lg shadow-sm border border-sand-300 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-medium border rounded-full ${STATUS_COLORS[r.status]}`}
                      >
                        {STATUS_LABELS[r.status]}
                      </span>
                      <span className="font-mono text-sm font-semibold text-ink-900">
                        #{shortRef}
                      </span>
                      <span className="text-xs text-ink-500" title={fmtDateTime(r.created_at)}>
                        {timeAgo(r.created_at)}
                      </span>
                    </div>
                    {r.status === 'pending' && (
                      <span className="text-xs text-clay-800" title={fmtDateTime(r.expires_at)}>
                        <Clock className="inline h-3 w-3 mr-1" />
                        {timeUntil(r.expires_at)}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 text-sm">
                    <div>
                      <p className="flex items-center gap-2 text-ink-900 font-medium">
                        <User className="h-4 w-4 text-ink-500" />
                        {r.contact_name || '(sans nom)'}
                      </p>
                      <p className="flex items-center gap-2 text-ink-700 mt-1">
                        <Mail className="h-4 w-4 text-ink-500" />
                        <a
                          href={`mailto:${r.contact_email}`}
                          className="hover:text-clay-700"
                        >
                          {r.contact_email}
                        </a>
                      </p>
                      <p className="flex items-center gap-2 text-ink-700 mt-1">
                        <Phone className="h-4 w-4 text-ink-500" />
                        <a
                          href={`tel:${r.contact_phone}`}
                          className="hover:text-clay-700"
                        >
                          {r.contact_phone}
                        </a>
                      </p>
                    </div>
                    <div>
                      <p className="flex items-center gap-2 text-ink-900 font-medium">
                        <Package className="h-4 w-4 text-ink-500" />
                        {r.total_items} article{r.total_items > 1 ? 's' : ''} •{' '}
                        <span className="font-semibold">
                          {r.total_price.toFixed(2)} {r.currency}
                        </span>
                      </p>
                      <button
                        onClick={() => setExpandedId(expanded ? null : r.id)}
                        className="mt-1 inline-flex items-center gap-1 text-xs text-clay-700 hover:text-clay-800"
                      >
                        {expanded ? (
                          <>
                            <ChevronUp className="h-3 w-3" /> Masquer le détail
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3" /> Voir le détail
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {expanded && (
                    <div className="mt-3 mb-3 pl-2 border-l-2 border-sand-300 text-sm text-ink-700 space-y-1">
                      {r.items.length === 0 ? (
                        <p className="text-ink-500 italic">Aucun item</p>
                      ) : (
                        r.items.map((i) => (
                          <p key={i.id}>
                            • {i.product_name} × {i.quantity}
                            <span className="text-ink-500 ml-2">
                              ({(i.unit_price * i.quantity).toFixed(2)} {r.currency})
                            </span>
                          </p>
                        ))
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-sand-200">
                    <a
                      href={buildWhatsAppLink(r)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-olive-600 text-white rounded-md hover:bg-olive-700 transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </a>

                    {r.status === 'pending' && (
                      <button
                        onClick={() => updateStatus(r.id, 'confirmed')}
                        disabled={isActing}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-clay-700 text-white rounded-md hover:bg-clay-800 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Marquer confirmée
                      </button>
                    )}

                    {(r.status === 'pending' || r.status === 'confirmed') && (
                      <button
                        onClick={() => updateStatus(r.id, 'collected')}
                        disabled={isActing}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-ink-700 text-white rounded-md hover:bg-ink-800 transition-colors disabled:opacity-50"
                      >
                        <Package className="h-4 w-4" />
                        Marquer collectée
                      </button>
                    )}

                    {(r.status === 'pending' || r.status === 'confirmed') && (
                      <button
                        onClick={() => updateStatus(r.id, 'cancelled')}
                        disabled={isActing}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-brick-600 text-brick-600 rounded-md hover:bg-clay-50 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                        Annuler
                      </button>
                    )}

                    {isActing && (
                      <Loader2 className="h-4 w-4 animate-spin text-ink-500 self-center" />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
