'use client'

import { useState, useEffect } from 'react'
import { 
  MagnifyingGlassIcon,
  EyeIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CreditCardIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline'

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  total_amount: number
  currency: string
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  delivery_type: 'delivery' | 'pickup'
  created_at: string
  updated_at: string
  items_count: number
}

export default function CommandePage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [deliveryFilter, setDeliveryFilter] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)

  // Simuler les données pour l'instant
  useEffect(() => {
    const mockData: Order[] = [
      {
        id: '1',
        order_number: 'CMD-2024-001',
        customer_name: 'Marie Dupont',
        customer_email: 'marie.dupont@email.com',
        total_amount: 89.99,
        currency: 'DOP',
        status: 'confirmed',
        payment_status: 'paid',
        delivery_type: 'delivery',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items_count: 3
      },
      {
        id: '2',
        order_number: 'CMD-2024-002',
        customer_name: 'Jean Martin',
        customer_email: 'jean.martin@email.com',
        total_amount: 45.50,
        currency: 'DOP',
        status: 'ready',
        payment_status: 'paid',
        delivery_type: 'pickup',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString(),
        items_count: 2
      },
      {
        id: '3',
        order_number: 'CMD-2024-003',
        customer_name: 'Sophie Laurent',
        customer_email: 'sophie.laurent@email.com',
        total_amount: 125.75,
        currency: 'DOP',
        status: 'preparing',
        payment_status: 'pending',
        delivery_type: 'delivery',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        updated_at: new Date().toISOString(),
        items_count: 5
      },
      {
        id: '4',
        order_number: 'CMD-2024-004',
        customer_name: 'Pierre Moreau',
        customer_email: 'pierre.moreau@email.com',
        total_amount: 67.25,
        currency: 'DOP',
        status: 'delivered',
        payment_status: 'paid',
        delivery_type: 'pickup',
        created_at: new Date(Date.now() - 259200000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString(),
        items_count: 4
      }
    ]
    setOrders(mockData)
    setLoading(false)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'preparing': return 'bg-purple-100 text-purple-800'
      case 'ready': return 'bg-green-100 text-green-800'
      case 'delivered': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'refunded': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <ClockIcon className="h-5 w-5 text-yellow-600" />
      case 'confirmed': return <CheckCircleIcon className="h-5 w-5 text-blue-600" />
      case 'preparing': return <ClockIcon className="h-5 w-5 text-purple-600" />
      case 'ready': return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case 'delivered': return <TruckIcon className="h-5 w-5 text-gray-600" />
      case 'cancelled': return <XCircleIcon className="h-5 w-5 text-red-600" />
      default: return null
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    const matchesPayment = paymentFilter === 'all' || order.payment_status === paymentFilter
    const matchesDelivery = deliveryFilter === 'all' || order.delivery_type === deliveryFilter
    
    return matchesSearch && matchesStatus && matchesPayment && matchesDelivery
  })

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    // Ici vous ajouteriez la logique pour mettre à jour le statut dans la base de données
    console.log('Mise à jour statut commande:', orderId, newStatus)
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, status: newStatus as any, updated_at: new Date().toISOString() }
        : order
    ))
  }

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setShowOrderDetails(true)
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Commandes</h1>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">En attente</p>
              <p className="text-2xl font-semibold text-gray-900">
                {orders.filter(order => order.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Prêtes</p>
              <p className="text-2xl font-semibold text-gray-900">
                {orders.filter(order => order.status === 'ready').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CreditCardIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Paiements en attente</p>
              <p className="text-2xl font-semibold text-gray-900">
                {orders.filter(order => order.payment_status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total commandes</p>
              <p className="text-2xl font-semibold text-gray-900">{orders.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une commande..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="confirmed">Confirmée</option>
            <option value="preparing">En préparation</option>
            <option value="ready">Prête</option>
            <option value="delivered">Livrée</option>
            <option value="cancelled">Annulée</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les paiements</option>
            <option value="paid">Payé</option>
            <option value="pending">En attente</option>
            <option value="failed">Échoué</option>
            <option value="refunded">Remboursé</option>
          </select>

          <select
            value={deliveryFilter}
            onChange={(e) => setDeliveryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les types</option>
            <option value="delivery">Livraison</option>
            <option value="pickup">Retrait pharmacie</option>
          </select>
        </div>
      </div>

      {/* Table des commandes */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="text-center py-8">Chargement...</div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commande
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paiement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
                    <div className="text-sm text-gray-500">{order.items_count} article{order.items_count > 1 ? 's' : ''}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                    <div className="text-sm text-gray-500">{order.customer_email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order.total_amount} {order.currency}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(order.status)}
                      <span className={`ml-2 inline-flex px-2 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status === 'pending' && 'En attente'}
                        {order.status === 'confirmed' && 'Confirmée'}
                        {order.status === 'preparing' && 'En préparation'}
                        {order.status === 'ready' && 'Prête'}
                        {order.status === 'delivered' && 'Livrée'}
                        {order.status === 'cancelled' && 'Annulée'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.payment_status)}`}>
                      {order.payment_status === 'paid' && 'Payé'}
                      {order.payment_status === 'pending' && 'En attente'}
                      {order.payment_status === 'failed' && 'Échoué'}
                      {order.payment_status === 'refunded' && 'Remboursé'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {order.delivery_type === 'delivery' ? (
                        <TruckIcon className="h-5 w-5 text-blue-600 mr-2" />
                      ) : (
                        <BuildingStorefrontIcon className="h-5 w-5 text-green-600 mr-2" />
                      )}
                      <span className="text-sm text-gray-900">
                        {order.delivery_type === 'delivery' ? 'Livraison' : 'Retrait'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(order.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => openOrderDetails(order)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Voir les détails"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="pending">En attente</option>
                        <option value="confirmed">Confirmée</option>
                        <option value="preparing">En préparation</option>
                        <option value="ready">Prête</option>
                        <option value="delivered">Livrée</option>
                        <option value="cancelled">Annulée</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal des détails de commande */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Détails de la commande {selectedOrder.order_number}
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Client</p>
                  <p className="text-sm text-gray-900">{selectedOrder.customer_name}</p>
                  <p className="text-sm text-gray-500">{selectedOrder.customer_email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Montant total</p>
                  <p className="text-sm text-gray-900">{selectedOrder.total_amount} {selectedOrder.currency}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Statut de la commande</p>
                  <div className="flex items-center mt-1">
                    {getStatusIcon(selectedOrder.status)}
                    <span className={`ml-2 inline-flex px-2 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status === 'pending' && 'En attente'}
                      {selectedOrder.status === 'confirmed' && 'Confirmée'}
                      {selectedOrder.status === 'preparing' && 'En préparation'}
                      {selectedOrder.status === 'ready' && 'Prête'}
                      {selectedOrder.status === 'delivered' && 'Livrée'}
                      {selectedOrder.status === 'cancelled' && 'Annulée'}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Statut du paiement</p>
                  <span className={`inline-flex px-2 text-xs font-semibold rounded-full mt-1 ${getPaymentStatusColor(selectedOrder.payment_status)}`}>
                    {selectedOrder.payment_status === 'paid' && 'Payé'}
                    {selectedOrder.payment_status === 'pending' && 'En attente'}
                    {selectedOrder.payment_status === 'failed' && 'Échoué'}
                    {selectedOrder.payment_status === 'refunded' && 'Remboursé'}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Type de livraison</p>
                <div className="flex items-center mt-1">
                  {selectedOrder.delivery_type === 'delivery' ? (
                    <TruckIcon className="h-5 w-5 text-blue-600 mr-2" />
                  ) : (
                    <BuildingStorefrontIcon className="h-5 w-5 text-green-600 mr-2" />
                  )}
                  <span className="text-sm text-gray-900">
                    {selectedOrder.delivery_type === 'delivery' ? 'Livraison à domicile' : 'Retrait en pharmacie'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Date de commande</p>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedOrder.created_at).toLocaleString('fr-FR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Dernière mise à jour</p>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedOrder.updated_at).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 mt-6 border-t">
              <button
                onClick={() => setShowOrderDetails(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 