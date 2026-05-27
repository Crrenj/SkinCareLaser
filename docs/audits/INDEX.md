# Audit complet — FARMAU / Skincare Laser

Date d'audit initial : 2026-05-19
Date mise à jour : 2026-05-27 (post session autonome a11y + DX + code quality + pagination)
Branche : `main`
Dernier commit : `b00aa82 chore: remove 3 orphan delete modals replaced by ConfirmDialog`

> **État** : voir `docs/HANDOFF.md` pour la punch list courante.
> **142 findings initiaux** dont la grande majorité **fermés** lors des sessions 2026-05-19 → 2026-05-27.

---

## Métriques clés (2026-05-27)

| Métrique | Valeur |
|---|---|
| LOC (src/) | 31 055 |
| Fichiers TS/TSX | 247 |
| Pages publiques | 28 |
| Pages admin | 12 |
| Routes API | 24 (admin) + 8 (public) |
| Migrations DB | 22 |
| Erreurs TypeScript | **0** |
| Warnings ESLint | **0** |
| Usages `any` | **0** |
| Tags `<img>` brut | **0** |
| `focus:outline-none` | **0** |
| `alert()` | **0** |
| `text-ink-400` | **0** (WCAG AA conforme) |
| `toast()` usages | 36 |
| `role="dialog"` | 18 |
| `useModalA11y` usages | 26 (dont CartDrawer + MobileDrawer) |
| `focus-visible` usages | 67 |
| Tests Vitest | 8/8 |
| Specs Playwright | 11 fichiers, ~27 test blocks |
| Clés i18n (par locale) | ~1 366 |
| Produits actifs DB | 353 |
| Dépendances Supabase | supabase-js 2.106, ssr 0.10 |

---

## Vue d'ensemble

| Dimension | Note initiale | Note actuelle | Findings ouverts | Rapport |
|---|---|---|---|---|
| Sécurité | 🔴 Critique | 🟢 **B+** | 3 | [security.md](./security.md) |
| Performance | 🟠 C+ (5/10) | 🟢 **B+ (8/10)** | 1 | [performance.md](./performance.md) |
| Architecture | 🟠 B- | 🟢 **A (9/10)** | 1 | [architecture.md](./architecture.md) |
| Base de données | 🟠 B- | 🟢 **B+ (8/10)** | 4 | [database.md](./database.md) |
| Accessibilité | 🔴 38/100 | 🟢 **A- (~82%)** | 2 | [accessibility.md](./accessibility.md) |
| SEO | 🟠 65-75/100 | 🟢 **A- (8/10)** | 1 | [seo.md](./seo.md) |
| Developer Experience | 🟡 6/10 | 🟢 **A- (8/10)** | 2 | [developer-experience.md](./developer-experience.md) |
| UX / Product | 🔴 4/10 | 🟢 **B+ (7.5/10)** | 0 | [ux.md](./ux.md) |
| Qualité de code | 🟡 C+ (6.5/10) | 🟢 **A (9/10)** | 1 | [code-quality.md](./code-quality.md) |
| **TOTAL** | | | **15 ouverts** (127 fermés) | |

---

## Findings critiques — état

### ~~1-6. Tous les findings critiques originaux~~ ✅ FERMÉS
API admin sécurisées, réservation click & collect, bug add_to_cart, accessibilité WCAG, image dupliquée, design sprints 2-4.

### Accessibilité — état détaillé
- ✅ `<html lang={locale}>` dynamique
- ✅ Skip link
- ✅ `focus-visible` global (67 usages, 0 `focus:outline-none`)
- ✅ `role="dialog"` + `useModalA11y` sur modales ET drawers (CartDrawer + MobileDrawer)
- ✅ `useConfirmDialog` remplace les `confirm()` natifs ET les 3 modaux custom
- ✅ `text-ink-400` → `text-ink-500` (0 occurrence WCAG-fail restante)
- ✅ `alert()` → `toast()` (0 alert restant)
- ✅ `aria-invalid` + `aria-live` sur FooterNewsletter
- ⚠️ `aria-invalid` manquant sur login/signup/forgot-password

---

## Findings ouverts restants (15)

### Sécurité (3)
- Validation Zod sur les body POST/PATCH admin
- CSRF origin check sur POST publics (newsletter, contact)
- CSP headers

### Performance (1)
- Code splitting client components (`next/dynamic`)

### Architecture (1)
- CatalogueClient 230 LOC (acceptable, down from 513)

### Base de données (4)
- `auth.uid()` → `(SELECT auth.uid())` dans RLS policies
- `is_user_admin` → STABLE
- `tags_with_types` vue non matérialisée
- `banner_type_enum` strict

### Accessibilité (2)
- `aria-invalid` + `aria-describedby` sur login/signup/forgot-password
- Error boundaries (`error.tsx`)

### SEO (1)
- Schema.org `CollectionPage` sur catalogue/marques

### DX (2)
- Playwright CI nécessite secrets GitHub configurés
- Supabase SDKs : vérifier régressions en prod

### Code Quality (1)
- 126 `console.error` → logger structuré

---

## Points forts confirmés

- TypeScript strict, **0 erreur tsc, 0 warning lint, 0 `any`, 0 alert, 0 ink-400**
- Toutes les modales/drawers ont focus trap via `useModalA11y`
- Delete confirmations unifiées via `useConfirmDialog` (0 modal custom)
- 6 pages admin splittées (product, tags, marques, annonce, messages, stock)
- Catalogue paginé côté serveur (24 produits/page, filtres URL-driven)
- CI : lint + tsc + vitest + build + Playwright (chromium)
- Supabase SDKs à jour (2.106 + 0.10)
