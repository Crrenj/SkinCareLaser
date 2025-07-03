'use client'

import { useState } from 'react'
import { CalendarIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline'

export default function StatisticsPage() {
  const [period, setPeriod] = useState('month')
  
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Statistiques</h1>
        <div className="flex items-center gap-4">
          <select 
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="quarter">Ce trimestre</option>
            <option value="year">Cette année</option>
          </select>
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
            <CalendarIcon className="h-5 w-5 mr-2" />
            Période personnalisée
          </button>
        </div>
      </div>
      
      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Chiffre d'affaires</h3>
            <span className="flex items-center text-sm text-green-600">
              <ArrowUpIcon className="h-4 w-4 mr-1" />
              +15%
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">45,231 €</p>
          <p className="text-xs text-gray-500 mt-2">vs. période précédente</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Nombre de commandes</h3>
            <span className="flex items-center text-sm text-green-600">
              <ArrowUpIcon className="h-4 w-4 mr-1" />
              +8%
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">342</p>
          <p className="text-xs text-gray-500 mt-2">vs. période précédente</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Panier moyen</h3>
            <span className="flex items-center text-sm text-red-600">
              <ArrowDownIcon className="h-4 w-4 mr-1" />
              -3%
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">132 €</p>
          <p className="text-xs text-gray-500 mt-2">vs. période précédente</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Taux de conversion</h3>
            <span className="flex items-center text-sm text-green-600">
              <ArrowUpIcon className="h-4 w-4 mr-1" />
              +1.2%
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">3.8%</p>
          <p className="text-xs text-gray-500 mt-2">vs. période précédente</p>
        </div>
      </div>
      
      {/* Graphique des ventes (simulé) */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Évolution des ventes</h2>
        <div className="h-64 flex items-end justify-between space-x-2">
          {[65, 78, 82, 95, 89, 105, 92, 110, 98, 120, 115, 125].map((height, index) => (
            <div key={index} className="flex-1">
              <div 
                className="bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                style={{ height: `${(height / 125) * 100}%` }}
              />
              <p className="text-xs text-gray-500 text-center mt-2">
                {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'][index]}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Produits les plus vendus */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Top produits</h2>
          <div className="space-y-4">
            {[
              { name: 'Crème hydratante premium', sales: 89, revenue: '4,005 €' },
              { name: 'Sérum anti-âge', sales: 67, revenue: '5,963 €' },
              { name: 'Nettoyant doux', sales: 54, revenue: '1,728 €' },
              { name: 'Masque purifiant', sales: 45, revenue: '2,475 €' },
              { name: 'Huile essentielle', sales: 38, revenue: '1,520 €' },
            ].map((product, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.sales} vendus</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">{product.revenue}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Répartition des ventes par catégorie */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Ventes par catégorie</h2>
          <div className="space-y-4">
            {[
              { category: 'Soin visage', percentage: 45, color: 'bg-blue-500' },
              { category: 'Corps', percentage: 25, color: 'bg-green-500' },
              { category: 'Nettoyage', percentage: 20, color: 'bg-yellow-500' },
              { category: 'Accessoires', percentage: 10, color: 'bg-purple-500' },
            ].map((cat, index) => (
              <div key={index}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                  <span className="text-sm text-gray-500">{cat.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`${cat.color} h-2 rounded-full`}
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 