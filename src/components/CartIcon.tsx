'use client'

import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/hooks/useCart'

interface CartIconProps {
  className?: string
  onClick?: () => void
}

export function CartIcon({ className = '', onClick }: CartIconProps) {
  const { totalItems, isLoading } = useCart()

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={onClick}
        className="relative p-2 text-gray-700 hover:text-gray-900 transition-colors focus:outline-none"
        disabled={isLoading}
        data-testid="cart-icon"
        aria-label="Ouvrir le panier"
      >
        <ShoppingCart size={24} />
        
        {/* Badge avec le nombre d'items */}
        {totalItems > 0 && (
          <span 
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium cart-badge"
            data-testid="cart-badge"
          >
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        )}
      </button>
      
      {/* Indicateur de chargement */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 rounded flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  )
} 