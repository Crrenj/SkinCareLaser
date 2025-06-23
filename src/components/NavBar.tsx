import React from 'react'

export default function NavBar() {
  return (
    <header className="p-4 mb-6" style={{ backgroundColor: '#CCC5BD' }}>
      <nav className="flex space-x-4">
        <a href="/" className="text-blue-500">Acceuil</a>
        <a href="/catalogue" className="text-blue-500">Catalogue</a>
        <a href="#" className="text-blue-500">Prendre RDV</a>
      </nav>
    </header>
  )
}
