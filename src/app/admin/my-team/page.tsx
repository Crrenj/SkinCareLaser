'use client'

import { useState } from 'react'
import { UserPlusIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline'

export default function MyTeamPage() {
  const [searchTerm, setSearchTerm] = useState('')
  
  // Données fictives pour l'exemple
  const teamMembers = [
    {
      id: 1,
      name: 'Marie Dupont',
      role: 'Administrateur',
      email: 'marie.dupont@skincarelaser.com',
      phone: '+33 6 12 34 56 78',
      status: 'Actif',
      avatar: 'MD'
    },
    {
      id: 2,
      name: 'Jean Martin',
      role: 'Manager',
      email: 'jean.martin@skincarelaser.com',
      phone: '+33 6 23 45 67 89',
      status: 'Actif',
      avatar: 'JM'
    },
    {
      id: 3,
      name: 'Sophie Bernard',
      role: 'Vendeur',
      email: 'sophie.bernard@skincarelaser.com',
      phone: '+33 6 34 56 78 90',
      status: 'Actif',
      avatar: 'SB'
    },
    {
      id: 4,
      name: 'Pierre Dubois',
      role: 'Support',
      email: 'pierre.dubois@skincarelaser.com',
      phone: '+33 6 45 67 89 01',
      status: 'Inactif',
      avatar: 'PD'
    },
  ]
  
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mon équipe</h1>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          <UserPlusIcon className="h-5 w-5 mr-2" />
          Inviter un membre
        </button>
      </div>
      
      {/* Barre de recherche */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <input
          type="text"
          placeholder="Rechercher un membre de l'équipe..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {/* Liste des membres */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamMembers.map((member) => (
          <div key={member.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                member.status === 'Actif' ? 'bg-blue-600' : 'bg-gray-400'
              }`}>
                {member.avatar}
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                <p className="text-sm text-gray-500">{member.role}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                {member.email}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                {member.phone}
              </div>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                member.status === 'Actif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {member.status}
              </span>
              <button className="text-sm text-blue-600 hover:text-blue-800">
                Modifier
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Statistiques de l'équipe */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Statistiques de l'équipe</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">4</p>
            <p className="text-sm text-gray-500">Membres totaux</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">3</p>
            <p className="text-sm text-gray-500">Membres actifs</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">1</p>
            <p className="text-sm text-gray-500">Administrateurs</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">2</p>
            <p className="text-sm text-gray-500">Rôles différents</p>
          </div>
        </div>
      </div>
    </div>
  )
} 