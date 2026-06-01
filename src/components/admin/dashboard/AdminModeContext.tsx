'use client'

import { createContext, useContext } from 'react'

/**
 * Expose le mode clair/sombre de l'admin (état + persistance dans
 * `_AdminShell`) aux composants profonds — en pratique le `HeaderTools`
 * rendu DANS le `PageHeader` de chaque page `/admin/*`. Le `PageHeader`
 * reste un Server Component ; seul `HeaderTools` (client) consomme ce
 * contexte. Toujours monté sous `_AdminShell`, donc jamais absent.
 */
export type AdminMode = 'light' | 'dark'

type AdminModeContextValue = {
  mode: AdminMode
  toggleMode: () => void
}

const AdminModeContext = createContext<AdminModeContextValue | null>(null)

export function AdminModeProvider({
  value,
  children,
}: {
  value: AdminModeContextValue
  children: React.ReactNode
}) {
  return <AdminModeContext.Provider value={value}>{children}</AdminModeContext.Provider>
}

export function useAdminMode(): AdminModeContextValue {
  const ctx = useContext(AdminModeContext)
  if (!ctx) {
    throw new Error('useAdminMode doit être utilisé dans un AdminModeProvider')
  }
  return ctx
}
