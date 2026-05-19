'use client'

import React, { useMemo, useCallback, useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { Trash2, ArrowLeft, ShoppingBag, CheckCircle, Loader2 } from 'lucide-react'
import { useCart } from '@/hooks/useCart'

export default function CartClient() {
  const t = useTranslations('Cart')
  const tRes = useTranslations('Reservation')
  const router = useRouter()
  const {
    items,
    updateQuantity,
    removeFromCart,
    totalPrice,
    refreshCart,
  } = useCart()

  const shipping = useMemo(() => items.length > 0 ? 5.99 : 0, [items.length])
  const total = useMemo(() => totalPrice + shipping, [totalPrice, shipping])

  // État de réservation
  const [reserving, setReserving] = useState(false)
  const [reserveError, setReserveError] = useState<string | null>(null)
  const [reservationId, setReservationId] = useState<string | null>(null)

  const handleReserve = useCallback(async () => {
    setReserving(true)
    setReserveError(null)

    try {
      const res = await fetch('/api/cart/reserve', { method: 'POST' })
      const json = await res.json()

      if (!res.ok) {
        switch (json.code) {
          case 'auth_required':
            router.push('/login?redirectedFrom=/cart')
            return
          case 'phone_required':
            router.push(
              '/account/profile?required=phone&from=/cart',
            )
            return
          case 'already_active':
            setReserveError(t('errors.alreadyActive'))
            return
          case 'cart_empty':
            setReserveError(t('errors.cartEmpty'))
            return
          default:
            setReserveError(json.error || t('errors.generic'))
            return
        }
      }

      setReservationId(json.reservationId)
      // Refresh le cart côté SWR (sera vide après création réservation)
      await refreshCart()
    } catch {
      setReserveError(t('errors.network'))
    } finally {
      setReserving(false)
    }
  }, [router, refreshCart, t])

  const handleQuantityUpdate = useCallback((productId: string, newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= 99) {
      updateQuantity(productId, newQuantity)
    }
  }, [updateQuantity])

  const handleRemoveItem = useCallback((productId: string) => {
    removeFromCart(productId)
  }, [removeFromCart])

  // Branche 1 : confirmation post-réservation
  if (reservationId) {
    const shortRef = reservationId.slice(0, 8).toUpperCase()
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="mb-6 flex justify-center">
            <CheckCircle className="h-16 w-16 text-olive-600" />
          </div>
          <h1 className="text-2xl font-bold text-ink-900 mb-3">
            {tRes('successTitle')}
          </h1>
          <p className="text-ink-700 mb-2">
            {tRes('referenceLabel')} <span className="font-mono font-semibold">#{shortRef}</span>
          </p>
          <p className="text-ink-700 mb-6">
            {tRes.rich('successDescription', {
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/catalogue"
              className="inline-flex items-center justify-center px-6 py-3 bg-clay-700 text-white rounded-lg hover:bg-clay-800 transition-colors focus:outline-none"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {tRes('backToCatalogue')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Branche 2 : panier vide
  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-16">
          <div className="mb-6">
            <ShoppingBag className="mx-auto h-16 w-16 text-ink-400" />
          </div>
          <h1 className="text-2xl font-bold text-ink-900 mb-4">{t('emptyTitle')}</h1>
          <p className="text-ink-700 mb-8">{t('emptyDescription')}</p>
          <Link
            href="/catalogue"
            className="inline-flex items-center px-6 py-3 bg-clay-700 text-white rounded-lg hover:bg-clay-800 transition-colors focus:outline-none"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('continueShopping')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink-900 mb-2">{t('title')}</h1>
        <p className="text-ink-700">{t('summary', { count: items.length })}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Liste des produits */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-sand-300">
              <h2 className="text-lg font-semibold text-ink-900">{t('productsHeading')}</h2>
            </div>

            <div className="divide-y divide-sand-300">
              {items.map((item) => {
                if (!item.product) return null
                
                const itemTotal = item.product.price * item.quantity
                return (
                  <div key={item.id} className="p-6">
                    <div className="flex items-center space-x-4">
                      {/* Image */}
                      <div className="flex-shrink-0">
                        {item.product.images && item.product.images.length > 0 ? (
                          <Image
                            src={item.product.images[0].url}
                            alt={item.product.images[0].alt || item.product.name}
                            width={80}
                            height={80}
                            className="w-20 h-20 object-cover rounded-lg"
                            sizes="80px"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-sand-200 rounded-lg flex items-center justify-center">
                            <span className="text-ink-400 text-xs">{t('noImage')}</span>
                          </div>
                        )}
                      </div>

                      {/* Informations produit */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-ink-900 truncate">
                              {item.product.name}
                            </h3>
                            <p className="text-lg font-semibold text-ink-900 mt-1">
                              {item.product.price.toFixed(2)} {item.product.currency.toUpperCase()}
                            </p>
                          </div>

                          {/* Quantité */}
                          <div className="flex items-center space-x-3 ml-4">
                            <div className="flex items-center border border-sand-300 rounded-lg">
                              <button
                                onClick={() => handleQuantityUpdate(item.product_id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="px-3 py-1 text-ink-700 hover:text-ink-800 disabled:text-ink-400 disabled:cursor-not-allowed focus:outline-none rounded-l"
                                aria-label={t('decreaseQuantityAriaLabel')}
                              >
                                -
                              </button>
                              <span className="px-3 py-1 border-x border-sand-300 min-w-[40px] text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleQuantityUpdate(item.product_id, item.quantity + 1)}
                                disabled={item.quantity >= 99}
                                className="px-3 py-1 text-ink-700 hover:text-ink-800 disabled:text-ink-400 disabled:cursor-not-allowed focus:outline-none rounded-r"
                                aria-label={t('increaseQuantityAriaLabel')}
                              >
                                +
                              </button>
                            </div>

                            {/* Prix total pour cet item */}
                            <div className="text-right min-w-[80px]">
                              <p className="font-semibold text-ink-900">
                                {itemTotal.toFixed(2)} {item.product.currency.toUpperCase()}
                              </p>
                            </div>

                            {/* Bouton supprimer */}
                            <button
                              onClick={() => handleRemoveItem(item.product_id)}
                              className="text-brick-600 hover:text-brick-600 p-1 transition-colors focus:outline-none rounded"
                              title={t('removeTitle')}
                              aria-label={t('removeAriaLabel', { name: item.product.name })}
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Résumé de commande */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-ink-900 mb-4">{t('summaryHeading')}</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-ink-700">{t('subtotal')}</span>
                <span className="font-medium text-ink-900">{totalPrice.toFixed(2)} DOP</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-700">{t('shipping')}</span>
                <span className="font-medium text-ink-900">{shipping.toFixed(2)} DOP</span>
              </div>
              <div className="border-t border-sand-300 pt-3">
                <div className="flex justify-between text-lg font-semibold">
                  <span>{t('total')}</span>
                  <span className="text-ink-900">{total.toFixed(2)} DOP</span>
                </div>
              </div>
            </div>

            {reserveError && (
              <div
                role="alert"
                className="mb-4 bg-clay-50 border-l-4 border-brick-600 p-3 rounded text-sm text-brick-600"
              >
                {reserveError}
              </div>
            )}

            <button
              type="button"
              onClick={handleReserve}
              disabled={reserving}
              className="w-full bg-clay-700 text-white py-3 px-6 rounded-lg hover:bg-clay-800 transition-colors font-semibold mb-4 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {reserving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('reserving')}
                </>
              ) : (
                t('reserveButton')
              )}
            </button>
            <p className="text-xs text-ink-500 text-center mb-4">
              {t('reserveSubtext')}
            </p>

            <Link
              href="/catalogue"
              className="w-full inline-flex items-center justify-center px-6 py-3 border border-sand-300 text-ink-800 rounded-lg hover:bg-sand-100 transition-colors focus:outline-none"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('continueShopping')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 