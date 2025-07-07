'use client'

import { useState, useEffect } from 'react'
import { 
  PencilIcon, 
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'

interface StockItem {
  id: string
  product_id: string
  product_name: string
  current_stock: number
  last_updated: string
  status: 'ok' | 'low' | 'out' | 'excess'
  brand_name?: string
  range_name?: string
  price: number
  currency: string
}

interface StockStats {
  total: number
  ok: number
  low: number
  out: number
}

type SortColumn = 'product_name' | 'current_stock' | 'status' | 'last_updated'
type SortOrder = 'asc' | 'desc'

export default function StockPage() {
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [stats, setStats] = useState<StockStats>({ total: 0, ok: 0, low: 0, out: 0 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<StockItem | null>(null)
  const [sortColumn, setSortColumn] = useState<SortColumn>('product_name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  
  const [formData, setFormData] = useState({
    product_id: '',
    current_stock: 0
  })

  // Fonction pour récupérer les données de stock
  const fetchStockData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search: searchTerm,
        sortBy: sortColumn === 'product_name' ? 'name' : sortColumn === 'current_stock' ? 'stock' : sortColumn,
        sortOrder,
        status: filterStatus
      })
      
      const response = await fetch(`/api/admin/stock?${params}`)
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des données')
      }
      
      const data = await response.json()
      setStockItems(data.items || [])
      setStats(data.stats || { total: 0, ok: 0, low: 0, out: 0 })
    } catch (error) {
      console.error('Erreur récupération stock:', error)
    } finally {
      setLoading(false)
    }
  }

  // Charger les données au montage et quand les filtres changent
  useEffect(() => {
    fetchStockData()
  }, [searchTerm, filterStatus, sortColumn, sortOrder])

  // Fonction pour gérer le tri par colonnes
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortOrder('asc')
    }
  }

  // Fonction pour obtenir l'icône de tri
  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return null
    return sortOrder === 'asc' ? 
      <ChevronUpIcon className="h-4 w-4 inline ml-1" /> : 
      <ChevronDownIcon className="h-4 w-4 inline ml-1" />
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'bg-green-100 text-green-800'
      case 'low': return 'bg-yellow-100 text-yellow-800'
      case 'out': return 'bg-red-100 text-red-800'
      case 'excess': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok': return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case 'low': return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
      case 'out': return <XCircleIcon className="h-5 w-5 text-red-600" />
      default: return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ok': return 'Normal'
      case 'low': return 'Faible'
      case 'out': return 'Rupture'
      case 'excess': return 'Excédent'
      default: return status
    }
  }

  const openModal = (item?: StockItem) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        product_id: item.product_id,
        current_stock: item.current_stock
      })
    } else {
      setEditingItem(null)
      setFormData({
        product_id: '',
        current_stock: 0
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingItem) return
    
    try {
      const response = await fetch('/api/admin/stock', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: editingItem.product_id,
          stock: formData.current_stock
        })
      })
      
      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour')
      }
      
      // Recharger les données
      await fetchStockData()
      setShowModal(false)
    } catch (error) {
      console.error('Erreur sauvegarde stock:', error)
      alert('Erreur lors de la sauvegarde')
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestion du Stock</h1>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Stock Normal</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.ok}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Stock Faible</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.low}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XCircleIcon className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Rupture</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.out}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Produits</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="ok">Stock normal</option>
            <option value="low">Stock faible</option>
            <option value="out">Rupture</option>
            <option value="excess">Excédent</option>
          </select>
        </div>
      </div>

      {/* Table du stock */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Chargement des données...</p>
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('product_name')}
                >
                  Produit {getSortIcon('product_name')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('current_stock')}
                >
                  Stock Actuel {getSortIcon('current_stock')}
                </th>

                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  Statut {getSortIcon('status')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('last_updated')}
                >
                  Dernière MAJ {getSortIcon('last_updated')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stockItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                    {item.brand_name && (
                      <div className="text-xs text-gray-500">{item.brand_name}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-semibold">{item.current_stock}</div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(item.status)}
                      <span className={`ml-2 inline-flex px-2 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                        {getStatusText(item.status)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(item.last_updated).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => openModal(item)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Modifier le stock"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {stockItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Aucun produit trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal d'édition */}
      {showModal && editingItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Modifier le stock - {editingItem.product_name}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Stock actuel</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.current_stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, current_stock: parseInt(e.target.value) || 0 }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-600">
                  <strong>Prix:</strong> {editingItem.price} {editingItem.currency}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Marque:</strong> {editingItem.brand_name || 'Non spécifiée'}
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Sauvegarder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 