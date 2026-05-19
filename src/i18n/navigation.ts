import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

/**
 * Helpers de navigation locale-aware.
 *
 * Remplacer dans le code :
 *   - `import Link from 'next/link'`              -> `import { Link } from '@/i18n/navigation'`
 *   - `import { useRouter } from 'next/navigation'` -> `import { useRouter } from '@/i18n/navigation'`
 *   - `import { usePathname } from 'next/navigation'` -> `import { usePathname } from '@/i18n/navigation'`
 *
 * Les hrefs et router.push restent identiques (`/catalogue`, `/cart`, etc.)
 * — next-intl ajoute le préfixe locale automatiquement.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
