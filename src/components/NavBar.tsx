'use client'
import React, { useState } from 'react'
import { Mail, ShoppingCart, User, ChevronDown } from 'lucide-react'
import Image from 'next/image'

export default function NavBar() {
  const [open, setOpen] = useState(false)

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
        <div className="absolute inset-x-0 flex justify-center">
          <Image src="/image/logo_trans.png" alt="Logo" width={100} height={100} />
        </div>

        {/* icônes + texte à droite */}
        <div className="absolute right-4 flex items-center gap-4">
          <Mail className="w-6 h-6 cursor-pointer text-gray-600" />
          <ShoppingCart className="w-6 h-6 cursor-pointer text-gray-600" />
          <User className="w-6 h-6 cursor-pointer text-gray-600" />
          <span className="text-gray-600">Se connecter</span>
        </div>
      </div>

      {/* ligne 2 */}
      <nav className="flex justify-center gap-6 h-12 items-center text-sm text-gray-600">
        <a href="/">Accueil</a>
        <a href="/catalogue">Catalogue</a>
        <a href="#">Prendre RDV</a>
      </nav>
    </header>
  )
}
