import '@testing-library/jest-dom'
import { vi } from 'vitest'
import frMessages from '@/messages/fr.json'

// `server-only` throw si importé hors d'un Server Component. En test (env
// happy-dom = client), tout module serveur transitivement importé (ex.
// supabaseAdmin via rateLimit) le déclencherait → on le neutralise.
vi.mock('server-only', () => ({}))

// Mock du module next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}))

// Mock next-intl : resout les clés depuis fr.json (les tests assertent sur le texte FR)
vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => {
    function lookup(key: string): unknown {
      const path = namespace ? `${namespace}.${key}` : key
      return path.split('.').reduce<unknown>((acc, part) => {
        if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
          return (acc as Record<string, unknown>)[part]
        }
        return undefined
      }, frMessages)
    }
    const t = (key: string, vars?: Record<string, string | number>) => {
      const value = lookup(key)
      if (typeof value !== 'string') return key
      if (!vars) return value
      // Remplace {var} et gère ICU plural minimal {count, plural, =0 {...} =1 {...} other {...}}
      const pluralMatch = value.match(/^\{(\w+),\s*plural,([\s\S]+)\}$/)
      if (pluralMatch) {
        const [, varName, branches] = pluralMatch
        const count = Number(vars[varName])
        const branchRe = /(=\d+|other)\s*\{([^{}]*?)\}/g
        const found: Record<string, string> = {}
        let m: RegExpExecArray | null
        while ((m = branchRe.exec(branches)) !== null) {
          found[m[1]] = m[2]
        }
        const chosen = found[`=${count}`] ?? found.other ?? ''
        return chosen.replace(/#/g, String(count))
      }
      return Object.entries(vars).reduce(
        (s, [k, v]) => s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v)),
        value,
      )
    }
    // rich(): renvoie une string simple ignorant les tags (suffisant pour les tests)
    t.rich = (key: string) => {
      const value = lookup(key)
      return typeof value === 'string' ? value.replace(/<\/?\w+>/g, '') : key
    }
    return t
  },
}))

// Mock de useCart pour éviter les dépendances circulaires
vi.mock('@/hooks/useCart', () => ({
  useCart: () => ({
    refreshCart: vi.fn(),
  }),
}))

// Mock de Supabase
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      insert: vi.fn(),
      update: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
  },
}))

// Mock du sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
})

// Mock du localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
}) 