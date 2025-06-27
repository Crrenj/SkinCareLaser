'use client'
import React, { useState } from 'react'
import { Mail, ShoppingCart, User, ChevronDown, Check } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'

export default function NavBar() {
  const [open, setOpen] = useState(false)
  const { getTotalItems, showPopup, popupProduct, hidePopup } = useCart()

  return (
    <header className="h-32 relative" style={{ backgroundColor: '#CCC5BD' }}>
      {/* ligne 1 */}
      <div className="h-20 flex items-center px-4">
        {/* wrapper relatif pour bouton + dropdown, avec z-index */}
        <div className="relative z-30">
          <button
            type="button"
            onClick={() => setOpen(prev => !prev)}
            className="bg-transparent text-gray-600 p-2 cursor-pointer flex items-center"
          >
            Langue
            <ChevronDown className="w-4 h-4 ml-1 text-gray-600" />
          </button>
          <ul
            className={`${open ? 'block' : 'hidden'} absolute left-0 top-full mt-2 bg-white shadow rounded text-sm z-30`}
          >
            <li className="px-3 py-1 hover:bg-gray-100 cursor-pointer">Français</li>
            <li className="px-3 py-1 hover:bg-gray-100 cursor-pointer">English</li>
            <li className="px-3 py-1 hover:bg-gray-100 cursor-pointer">Español</li>
          </ul>
        </div>

        {/* logo centré (z-index inférieur) */}
        <div className="absolute inset-x-0 -top-4 flex justify-center">
          <Image
            src="/image/logo_trans.png"
            alt="Logo"
            width={140}
            height={140}
            className="w-36 h-36 object-contain"
          />
        </div>

        {/* icônes + texte à droite */}
        <div className="absolute right-4 flex items-center gap-4">
          <Mail className="w-6 h-6 cursor-pointer text-gray-600" />
          <Link href="/cart" className="relative">
            <ShoppingCart className="w-6 h-6 cursor-pointer text-gray-600 hover:text-gray-800 transition-colors" />
            {/* Badge pour le nombre d'articles */}
            {getTotalItems() > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {getTotalItems()}
              </span>
            )}
          </Link>
          <User className="w-6 h-6 cursor-pointer text-gray-600" />
          <span className="text-gray-600">Se connecter</span>
        </div>
      </div>

      {/* ligne 2 */}
      <nav className="relative z-20 flex justify-center gap-6 h-16 items-center text-lg text-gray-700">
        <a href="/" className="hover:text-gray-900">Accueil</a>
        <a href="/catalogue" className="hover:text-gray-900">Catalogue</a>
        <a href="/rdv" className="hover:text-gray-900">Prendre RDV</a>
      </nav>

      {/* Popup de confirmation d'ajout au panier */}
      {showPopup && popupProduct && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className="bg-white rounded-lg shadow-lg border border-green-200 p-4 max-w-sm">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  Ajouté au panier !
                </p>
                <p className="text-sm text-gray-600 truncate">
                  {popupProduct.name}
                </p>
                <p className="text-sm font-semibold text-blue-600">
                  {popupProduct.price.toFixed(2)} {popupProduct.currency.toUpperCase()}
                </p>
              </div>
              <button
                onClick={hidePopup}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
