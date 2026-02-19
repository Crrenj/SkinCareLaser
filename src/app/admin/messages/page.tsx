'use client'

import { useState, useEffect } from 'react'
import { 
  Mail, 
  MailOpen, 
  Reply, 
  Archive, 
  Trash2, 
  AlertCircle,
  Clock,
  User,
  Filter,
  Search,
  Eye,
  EyeOff
} from 'lucide-react'

interface ContactMessage {
  id: string
  user_email: string
  subject: string
  message: string
  status: 'unread' | 'read' | 'replied' | 'archived'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  admin_notes?: string
  created_at: string
  updated_at: string
  replied_at?: string
  user?: { email: string }
  replied_by_user?: { email: string }
}

interface MessageStats {
  total: number
  unread: number
  read: number
  replied: number
  archived: number
  today: number
  this_week: number
}

export default function MessagesAdminPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [stats, setStats] = useState<MessageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showMessageModal, setShowMessageModal] = useState(false)

  // Charger les messages
  const loadMessages = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      
      const response = await fetch(`/api/admin/messages?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setMessages(data.messages || [])
        setStats(data.stats)
      } else {
        console.error('Erreur chargement messages:', data.error)
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMessages()
  }, [statusFilter])

  // Marquer comme lu
  const markAsRead = async (messageId: string) => {
    try {
      const response = await fetch('/api/admin/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: messageId, status: 'read' })
      })

      if (response.ok) {
        loadMessages()
      }
    } catch (error) {
      console.error('Erreur marquer comme lu:', error)
    }
  }

  // Changer le statut
  const changeStatus = async (messageId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/admin/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: messageId, 
          status: newStatus,
          replied_at: newStatus === 'replied' ? new Date().toISOString() : undefined
        })
      })

      if (response.ok) {
        loadMessages()
        setShowMessageModal(false)
      }
    } catch (error) {
      console.error('Erreur changement statut:', error)
    }
  }

  // Supprimer un message
  const deleteMessage = async (messageId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) return

    try {
      const response = await fetch(`/api/admin/messages?id=${messageId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadMessages()
        setShowMessageModal(false)
      }
    } catch (error) {
      console.error('Erreur suppression:', error)
    }
  }

  // Filtrer les messages
  const filteredMessages = messages.filter(message =>
    message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.message.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Icône de priorité
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'high': return <AlertCircle className="w-4 h-4 text-orange-500" />
      default: return null
    }
  }

  // Couleur du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread': return 'bg-blue-100 text-blue-800'
      case 'read': return 'bg-gray-100 text-gray-800'
      case 'replied': return 'bg-green-100 text-green-800'
      case 'archived': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Messages de Contact
          </h1>
          <p className="text-gray-600">
            Gérez les messages reçus via le formulaire de contact
          </p>
        </div>

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-blue-600">{stats.unread}</div>
              <div className="text-sm text-gray-600">Non lus</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-gray-600">{stats.read}</div>
              <div className="text-sm text-gray-600">Lus</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-green-600">{stats.replied}</div>
              <div className="text-sm text-gray-600">Répondus</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-yellow-600">{stats.archived}</div>
              <div className="text-sm text-gray-600">Archivés</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-purple-600">{stats.today}</div>
              <div className="text-sm text-gray-600">Aujourd'hui</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-indigo-600">{stats.this_week}</div>
              <div className="text-sm text-gray-600">Cette semaine</div>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Filtre par statut */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="all">Tous les statuts</option>
                <option value="unread">Non lus</option>
                <option value="read">Lus</option>
                <option value="replied">Répondus</option>
                <option value="archived">Archivés</option>
              </select>
            </div>

            {/* Recherche */}
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Rechercher dans les messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 flex-1"
              />
            </div>
          </div>
        </div>

        {/* Liste des messages */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Chargement des messages...</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="p-8 text-center">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun message trouvé</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${
                    message.status === 'unread' ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    setSelectedMessage(message)
                    setShowMessageModal(true)
                    if (message.status === 'unread') {
                      markAsRead(message.id)
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {message.status === 'unread' ? (
                          <Mail className="w-4 h-4 text-blue-600" />
                        ) : (
                          <MailOpen className="w-4 h-4 text-gray-400" />
                        )}
                        {getPriorityIcon(message.priority)}
                        <span className="font-medium text-gray-900">
                          {message.subject}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(message.status)}`}>
                          {message.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <User className="w-3 h-3" />
                        <span>{message.user_email}</span>
                        <Clock className="w-3 h-3 ml-2" />
                        <span>{new Date(message.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <p className="text-gray-700 text-sm line-clamp-2">
                        {message.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de détail du message */}
        {showMessageModal && selectedMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* En-tête du modal */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {selectedMessage.subject}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-3 h-3" />
                      <span>{selectedMessage.user_email}</span>
                      <Clock className="w-3 h-3 ml-2" />
                      <span>{new Date(selectedMessage.created_at).toLocaleString('fr-FR')}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowMessageModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                {/* Contenu du message */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Message :</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {selectedMessage.message}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => changeStatus(selectedMessage.id, 'read')}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    <EyeOff className="w-4 h-4" />
                    Marquer comme lu
                  </button>
                  <button
                    onClick={() => changeStatus(selectedMessage.id, 'replied')}
                    className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                  >
                    <Reply className="w-4 h-4" />
                    Marquer comme répondu
                  </button>
                  <button
                    onClick={() => changeStatus(selectedMessage.id, 'archived')}
                    className="flex items-center gap-2 px-3 py-2 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200"
                  >
                    <Archive className="w-4 h-4" />
                    Archiver
                  </button>
                  <button
                    onClick={() => deleteMessage(selectedMessage.id)}
                    className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </button>
                </div>

                {/* Informations supplémentaires */}
                <div className="text-xs text-gray-500 border-t pt-4">
                  <p>Statut : {selectedMessage.status}</p>
                  <p>Priorité : {selectedMessage.priority}</p>
                  {selectedMessage.replied_at && (
                    <p>Répondu le : {new Date(selectedMessage.replied_at).toLocaleString('fr-FR')}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 