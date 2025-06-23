import React from 'react'

export default function NavBar() {
  return (
    <header className="h-20" style={{ backgroundColor: '#CCC5BD' }}>
      <nav className="flex h-full justify-center items-end space-x-4">
        <a href="/" className="text-gray-600">Acceuil</a>
        <a href="/catalogue" className="text-gray-600">Catalogue</a>
        <a href="#" className="text-gray-600">Prendre RDV</a>
      </nav>
    </header>
  )
}
