export interface ContactMessage {
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

export interface MessageStats {
  total: number
  unread: number
  read: number
  replied: number
  archived: number
  today: number
  this_week: number
}

export type StatusFilter = 'all' | 'unread' | 'read' | 'replied' | 'archived'

export const FILTERS: Array<{
  value: StatusFilter
  labelKey: 'filterAll' | 'filterUnread' | 'filterRead' | 'filterReplied' | 'filterArchived'
}> = [
  { value: 'all', labelKey: 'filterAll' },
  { value: 'unread', labelKey: 'filterUnread' },
  { value: 'read', labelKey: 'filterRead' },
  { value: 'replied', labelKey: 'filterReplied' },
  { value: 'archived', labelKey: 'filterArchived' },
]
