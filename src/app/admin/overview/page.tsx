'use client'

export default function OverviewPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Vue d'ensemble</h1>
      
      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total des ventes</h3>
          <p className="text-3xl font-bold text-gray-900">12,345 €</p>
          <p className="text-sm text-green-600 mt-2">+12% ce mois</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Commandes</h3>
          <p className="text-3xl font-bold text-gray-900">234</p>
          <p className="text-sm text-green-600 mt-2">+8% ce mois</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Clients actifs</h3>
          <p className="text-3xl font-bold text-gray-900">1,456</p>
          <p className="text-sm text-green-600 mt-2">+23% ce mois</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Produits</h3>
          <p className="text-3xl font-bold text-gray-900">89</p>
          <p className="text-sm text-gray-600 mt-2">5 en rupture</p>
        </div>
      </div>
      
      {/* Activité récente */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Activité récente</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="text-sm font-medium text-gray-900">Nouvelle commande #1234</p>
              <p className="text-sm text-gray-500">Client: Marie Dupont</p>
            </div>
            <span className="text-sm text-gray-500">Il y a 5 min</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="text-sm font-medium text-gray-900">Produit ajouté</p>
              <p className="text-sm text-gray-500">Crème hydratante premium</p>
            </div>
            <span className="text-sm text-gray-500">Il y a 2h</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Nouveau client inscrit</p>
              <p className="text-sm text-gray-500">Jean Martin</p>
            </div>
            <span className="text-sm text-gray-500">Il y a 3h</span>
          </div>
        </div>
      </div>
    </div>
  )
} 