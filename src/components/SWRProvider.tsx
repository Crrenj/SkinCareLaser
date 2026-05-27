'use client'

import { logger } from '@/lib/logger'
import { SWRConfig } from 'swr'
import { ReactNode } from 'react'

interface SWRProviderProps {
  children: ReactNode
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        fetcher: (url: string) => fetch(url).then(res => res.json()),
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        refreshInterval: 0,
        errorRetryCount: 3,
        errorRetryInterval: 5000,
        dedupingInterval: 2000,
        focusThrottleInterval: 5000,
        loadingTimeout: 3000,
        onError: (error) => {
          logger.error('SWR Error:', error)
        }
      }}
    >
      {children}
    </SWRConfig>
  )
} 