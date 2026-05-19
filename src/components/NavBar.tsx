'use client'
import { useState, useCallback } from 'react'
import { Mail, User as UserIcon, ChevronDown, Shield } from 'lucide-react'
import Image from 'next/image'
import { Link, useRouter } from '@/i18n/navigation'
import { CartIcon } from './CartIcon'
import { CartDrawer } from './CartDrawer'
import { supabase } from '@/lib/supabaseClient'
import { useIsAdmin } from '@/hooks/useIsAdmin'

export default function NavBar() {
  const [open, setOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const { user, isAdmin } = useIsAdmin()
  const router = useRouter()

  const handleLanguageToggle = useCallback(() => {
    setOpen(prev => !prev)
  }, [])

  const handleCartOpen = useCallback(() => {
    setIsCartOpen(true)
  }, [])

  const handleCartClose = useCallback(() => {
    setIsCartOpen(false)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <header className="h-32 relative bg-sand-400">
      {/* ligne 1 */}
      <div className="h-20 flex items-center px-4">
        {/* wrapper relatif pour bouton + dropdown, avec z-index */}
        <div className="relative z-30">
          <button
            type="button"
            onClick={handleLanguageToggle}
            className="bg-transparent text-ink-700 p-2 cursor-pointer flex items-center hover:text-ink-800 transition-colors focus:outline-none rounded"
            aria-expanded={open}
            aria-haspopup="true"
            aria-label="Sélectionner la langue"
          >
            Langue
            <ChevronDown className={`w-4 h-4 ml-1 text-ink-700 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          {open && (
            <ul
              className="absolute left-0 top-full mt-2 bg-white shadow-lg rounded-lg text-sm z-30 min-w-[120px] border border-sand-300"
              role="menu"
            >
              <li role="menuitem" className="px-3 py-2 hover:bg-sand-100 cursor-pointer rounded-t-lg">Français</li>
              <li role="menuitem" className="px-3 py-2 hover:bg-sand-100 cursor-pointer">English</li>
              <li role="menuitem" className="px-3 py-2 hover:bg-sand-100 cursor-pointer rounded-b-lg">Español</li>
            </ul>
          )}
        </div>

        {/* logo centré (z-index inférieur) */}
        <div className="absolute inset-x-0 -top-4 flex justify-center">
          <Link href="/" aria-label="Accueil FARMAU" className="focus:outline-none">
            <Image
              src="/image/logo_trans.png"
              alt="Logo FARMAU"
              width={140}
              height={140}
              className="w-36 h-36 object-contain"
              priority
            />
          </Link>
        </div>

        {/* icônes + texte à droite */}
        <div className="absolute right-4 flex items-center gap-4">
          <Link
            href="/contact"
            className="text-ink-700 hover:text-ink-800 transition-colors focus:outline-none rounded p-1"
            aria-label="Contact par email"
          >
            <Mail className="w-6 h-6" />
          </Link>
          
          {/* Nouveau CartIcon avec ouverture du drawer */}
          <CartIcon 
            onClick={handleCartOpen}
            className="relative"
          />
          
          {user ? (
            <>
              {isAdmin && (
                <Link
                  href="/admin/product"
                  className="text-ink-700 hover:text-ink-800 transition-colors focus:outline-none rounded p-1"
                  aria-label="Dashboard admin"
                >
                  <Shield className="w-6 h-6" />
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="text-ink-700 hover:text-ink-800 transition-colors focus:outline-none rounded px-2 py-1"
                aria-label="Se déconnecter"
              >
                Se déconnecter
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-ink-700 hover:text-ink-800 transition-colors focus:outline-none rounded p-1"
                aria-label="Se connecter"
              >
                <UserIcon className="w-6 h-6" />
              </Link>
              <Link 
                href="/login"
                className="text-ink-700 hover:text-ink-800 transition-colors focus:outline-none rounded"
              >
                Se connecter
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ligne 2 */}
      <nav className="relative z-20 flex justify-center gap-6 h-16 items-center text-lg text-ink-800" role="navigation" aria-label="Navigation principale">
        <Link href="/" className="hover:text-ink-900 transition-colors focus:outline-none rounded px-2 py-1">Accueil</Link>
        <Link href="/catalogue" className="hover:text-ink-900 transition-colors focus:outline-none rounded px-2 py-1">Catalogue</Link>
        <Link href="/a-propos" className="hover:text-ink-900 transition-colors focus:outline-none rounded px-2 py-1">À propos</Link>
      </nav>

      {/* CartDrawer */}
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={handleCartClose}
      />
    </header>
  )
}
