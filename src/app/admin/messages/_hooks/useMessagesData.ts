'use client'

import { logger } from '@/lib/logger'
import { useState, useEffect, useCallback } from 'react'
import { useConfirmDialog } from '@/components/admin/ConfirmDialog'
import type { ContactMessage, MessageStats, StatusFilter } from '../_lib/types'

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
        logger.error('Erreur chargement messages:', data.error)
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

  const markAsRead = async (messageId: string) => {
    try {
      const response = await fetch('/api/admin/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: messageId, status: 'read' }),
      })
      if (response.ok) loadMessages()
    } catch (error) {
      logger.error('Erreur marquer comme lu:', error)
    }
  }

  const changeStatus = async (messageId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/admin/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: messageId,
          status: newStatus,
          replied_at: newStatus === 'replied' ? new Date().toISOString() : undefined,
        }),
      })
      if (response.ok) loadMessages()
      return response.ok
    } catch (error) {
      logger.error('Erreur changement statut:', error)
      return false
    }
  }

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

  return { messages, stats, loading, loadMessages, markAsRead, changeStatus, deleteMessage, confirmDialog: dialog }
}
