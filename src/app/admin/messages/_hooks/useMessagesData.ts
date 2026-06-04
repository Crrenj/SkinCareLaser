'use client'

import { logger } from '@/lib/logger'
import { useState, useEffect, useCallback } from 'react'
import { useConfirmDialog } from '@/components/admin/ConfirmDialog'
import type { ContactMessage, MessageStats, StatusFilter, TicketPriority } from '../_lib/types'

export function useMessagesData(statusFilter: StatusFilter) {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [stats, setStats] = useState<MessageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { confirm, dialog } = useConfirmDialog()

  const loadMessages = useCallback(async () => {
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
        logger.error('Erreur chargement tickets:', data.error)
      }
    } catch (error) {
      logger.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  const patchTicket = useCallback(
    async (body: Record<string, unknown>) => {
      try {
        const response = await fetch('/api/admin/messages', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (response.ok) loadMessages()
        return response.ok
      } catch (error) {
        logger.error('Erreur mise à jour ticket:', error)
        return false
      }
    },
    [loadMessages],
  )

  // Changement de statut. Passer à « resolved » horodate replied_at (= traité le).
  const changeStatus = (messageId: string, newStatus: string) =>
    patchTicket({
      id: messageId,
      status: newStatus,
      replied_at: newStatus === 'resolved' ? new Date().toISOString() : undefined,
    })

  const setPriority = (messageId: string, priority: TicketPriority) =>
    patchTicket({ id: messageId, priority })

  const deleteMessage = async (
    messageId: string,
    confirmTitle: string,
    confirmBody: string,
    confirmLabel: string,
  ) => {
    const ok = await confirm(confirmBody, { title: confirmTitle, confirmLabel })
    if (!ok) return false
    try {
      const response = await fetch(`/api/admin/messages?id=${messageId}`, { method: 'DELETE' })
      if (response.ok) loadMessages()
      return response.ok
    } catch (error) {
      logger.error('Erreur suppression:', error)
      return false
    }
  }

  return { messages, stats, loading, loadMessages, changeStatus, setPriority, deleteMessage, confirmDialog: dialog }
}
