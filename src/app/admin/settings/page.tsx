'use client'

import { useState } from 'react'
import { BellIcon, ShieldCheckIcon, CurrencyEuroIcon, PaintBrushIcon } from '@heroicons/react/24/outline'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  
  const tabs = [
    { id: 'general', name: 'Général', icon: null },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Sécurité', icon: ShieldCheckIcon },
    { id: 'billing', name: 'Facturation', icon: CurrencyEuroIcon },
    { id: 'appearance', name: 'Apparence', icon: PaintBrushIcon },
  ]
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Paramètres</h1>
      
      <div className="flex gap-8">
        {/* Sidebar de navigation */}
        <div className="w-64">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {tab.icon && <tab.icon className="h-5 w-5 mr-3" />}
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
        
        {/* Contenu principal */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            {activeTab === 'general' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Paramètres généraux</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom de la boutique
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      defaultValue="Skincare Laser"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email de contact
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      defaultValue="contact@skincarelaser.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fuseau horaire
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Europe/Paris (UTC+1)</option>
                      <option>Europe/London (UTC+0)</option>
                      <option>America/New_York (UTC-5)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Langue par défaut
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Français</option>
                      <option>English</option>
                      <option>Español</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Notifications</h2>
                <div className="space-y-4">
                  <label className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Nouvelles commandes</p>
                      <p className="text-sm text-gray-500">Recevoir une notification pour chaque nouvelle commande</p>
                    </div>
                    <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" defaultChecked />
                  </label>
                  
                  <label className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Stock faible</p>
                      <p className="text-sm text-gray-500">Alertes quand un produit est en rupture de stock</p>
                    </div>
                    <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" defaultChecked />
                  </label>
                  
                  <label className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Nouveaux clients</p>
                      <p className="text-sm text-gray-500">Notification lors de l'inscription d'un nouveau client</p>
                    </div>
                    <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" />
                  </label>
                  
                  <label className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Résumé hebdomadaire</p>
                      <p className="text-sm text-gray-500">Recevoir un résumé des performances chaque semaine</p>
                    </div>
                    <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" defaultChecked />
                  </label>
                </div>
              </div>
            )}
            
            {activeTab === 'security' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Sécurité</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Changer le mot de passe</h3>
                    <div className="space-y-4">
                      <input
                        type="password"
                        placeholder="Mot de passe actuel"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="password"
                        placeholder="Nouveau mot de passe"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="password"
                        placeholder="Confirmer le nouveau mot de passe"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Authentification à deux facteurs</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Ajoutez une couche de sécurité supplémentaire à votre compte
                    </p>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                      Activer la 2FA
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'billing' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Facturation</h2>
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Plan actuel</h3>
                    <p className="text-2xl font-bold text-gray-900">Plan Premium</p>
                    <p className="text-sm text-gray-500">99€ / mois</p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Méthode de paiement</h3>
                    <div className="flex items-center justify-between p-4 border border-gray-300 rounded-md">
                      <div className="flex items-center">
                        <div className="w-12 h-8 bg-blue-600 rounded mr-4"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">•••• •••• •••• 4242</p>
                          <p className="text-sm text-gray-500">Expire 12/2024</p>
                        </div>
                      </div>
                      <button className="text-sm text-blue-600 hover:text-blue-800">Modifier</button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Historique des factures</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-sm text-gray-600">Décembre 2023</span>
                        <span className="text-sm font-medium text-gray-900">99€</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-sm text-gray-600">Novembre 2023</span>
                        <span className="text-sm font-medium text-gray-900">99€</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-sm text-gray-600">Octobre 2023</span>
                        <span className="text-sm font-medium text-gray-900">99€</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'appearance' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Apparence</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thème
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Clair</option>
                      <option>Sombre</option>
                      <option>Automatique (système)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Couleur principale
                    </label>
                    <div className="flex gap-2">
                      <button className="w-10 h-10 bg-blue-600 rounded"></button>
                      <button className="w-10 h-10 bg-green-600 rounded"></button>
                      <button className="w-10 h-10 bg-purple-600 rounded"></button>
                      <button className="w-10 h-10 bg-red-600 rounded"></button>
                      <button className="w-10 h-10 bg-yellow-600 rounded"></button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logo de la boutique
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <p className="text-sm text-gray-500">Glisser-déposer ou cliquer pour télécharger</p>
                      <button className="mt-2 text-sm text-blue-600 hover:text-blue-800">
                        Choisir un fichier
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Bouton de sauvegarde */}
            <div className="mt-8 flex justify-end">
              <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Enregistrer les modifications
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 