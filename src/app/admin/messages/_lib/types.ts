// Système de tickets de support (ex-« messages de contact »).
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type TicketCategory = 'bug' | 'order' | 'product' | 'account' | 'other'
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface ContactMessage {
  id: string
  user_email: string
  subject: string
  message: string
  category: TicketCategory
  status: TicketStatus
  priority: TicketPriority
  admin_notes?: string
  created_at: string
  updated_at: string
  replied_at?: string
  user?: { email: string }
  replied_by_user?: { email: string }
}

export interface MessageStats {
  total: number
  open: number
  in_progress: number
  resolved: number
  closed: number
  today: number
  this_week: number
}

export type StatusFilter = 'all' | TicketStatus

export const FILTERS: Array<{
  value: StatusFilter
  labelKey: 'filterAll' | 'filterOpen' | 'filterInProgress' | 'filterResolved' | 'filterClosed'
}> = [
  { value: 'all', labelKey: 'filterAll' },
  { value: 'open', labelKey: 'filterOpen' },
  { value: 'in_progress', labelKey: 'filterInProgress' },
  { value: 'resolved', labelKey: 'filterResolved' },
  { value: 'closed', labelKey: 'filterClosed' },
]

export type CategoryFilter = 'all' | TicketCategory

export const CATEGORIES: Array<{
  value: TicketCategory
  labelKey: 'categoryBug' | 'categoryOrder' | 'categoryProduct' | 'categoryAccount' | 'categoryOther'
}> = [
  { value: 'bug', labelKey: 'categoryBug' },
  { value: 'order', labelKey: 'categoryOrder' },
  { value: 'product', labelKey: 'categoryProduct' },
  { value: 'account', labelKey: 'categoryAccount' },
  { value: 'other', labelKey: 'categoryOther' },
]
