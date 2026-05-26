# Audit complet — FARMAU / Skincare Laser

Date d'audit initial : 2026-05-19
Date mise à jour : 2026-05-26 (post Sprint 4 design + i18n admin + a11y + security hardening)
Branche : `main`
Dernier commit : `772b83b feat(ui): modernise all 13 popups & drawers with unified design system`

> **État** : voir `docs/HANDOFF.md` pour la punch list courante.
> **142 findings initiaux** dont la grande majorité **fermés** lors des sessions 2026-05-19 → 2026-05-26.

---

## Métriques clés (2026-05-26)

| Métrique | Valeur |
|---|---|
| LOC (src/) | 31 315 |
| Fichiers TS/TSX | 241 |
| Pages publiques | 28 |
| Pages admin | 12 |
| Routes API | 24 |
| Migrations DB | 22 |
| Erreurs TypeScript | **0** |
| Warnings ESLint | **0** |
| Usages `any` | **0** |
| Tags `<img>` brut | **0** (tout en `next/image`) |
| `focus:outline-none` | **0** (migré vers `focus-visible`) |
| `alert()` restants | 3 (down from 35) |
| `toast()` usages | 31 |
| `role="dialog"` | 18 |
| `useModalA11y` usages | 46 |
| `focus-visible` usages | 67 |
| Tests Vitest | 8/8 |
| Specs Playwright | 11 fichiers, ~27 test blocks |
| Clés i18n (par locale) | ~1 360 |
| Produits actifs DB | 353 |
| Marques | 13 |
| Gammes | 52 |
| Tags | 36 |

---

## Vue d'ensemble

| Dimension | Note initiale | Note actuelle | Findings | Rapport |
|---|---|---|---|---|
| Sécurité | 🔴 Critique | 🟢 **B+** | 15 (12 fermés) | [security.md](./security.md) |
| Performance | 🟠 C+ (5/10) | 🟡 **B (7/10)** | 12 (9 fermés) | [performance.md](./performance.md) |
| Architecture | 🟠 B- | 🟢 **A- (8/10)** | 15 (13 fermés) | [architecture.md](./architecture.md) |
| Base de données | 🟠 B- | 🟢 **B+ (8/10)** | 20 (16 fermés) | [database.md](./database.md) |
| Accessibilité | 🔴 38/100 | 🟢 **B+ (~78%)** | 18 (14 fermés) | [accessibility.md](./accessibility.md) |
| SEO | 🟠 65-75/100 | 🟢 **A- (8/10)** | 15 (14 fermés) | [seo.md](./seo.md) |
| Developer Experience | 🟡 6/10 | 🟢 **B+ (7.5/10)** | 15 (12 fermés) | [developer-experience.md](./developer-experience.md) |
| UX / Product | 🔴 4/10 | 🟢 **B (7/10)** | 14 (11 fermés) | [ux.md](./ux.md) |
| Qualité de code | 🟡 C+ (6.5/10) | 🟢 **A- (8.5/10)** | 18 (16 fermés) | [code-quality.md](./code-quality.md) |
| **TOTAL** | | | **142 findings (117 fermés, 25 ouverts)** | |

---

## Findings critiques — état

### ~~1. API admin ouvertes sur Internet~~ ✅ FERMÉ
- `requireAdmin()` sur les 24 routes `/api/admin/*`
- `supabaseAdmin` singleton typé `Database`
- UUID admin hardcodé supprimé

### ~~2. Tunnel d'achat cassé~~ ✅ REMPLACÉ
- Système de réservation click & collect complet (RPC + pg_cron + admin UI + WhatsApp)

### ~~3. Bug RPC `add_to_cart`~~ ✅ FERMÉ
- Quantité incrémentée correctement

### ~~4. Accessibilité WCAG~~ ⚠️ PARTIEL → **B+**
- ✅ `<html lang={locale}>` dynamique
- ✅ Skip link
- ✅ `focus-visible` global (67 usages, 0 `focus:outline-none`)
- ✅ `role="dialog"` + `useModalA11y` sur 18 modales/drawers
- ✅ `useConfirmDialog` remplace les `confirm()` natifs
- ⚠️ Focus trap manquant sur CartDrawer + MobileDrawer
- ⚠️ `aria-invalid` manquant sur les inputs en erreur
- ⚠️ Contraste `ink-400` borderline sur fond clair

### ~~5. Stockage image dupliqué~~ ✅ FERMÉ
- `products.image_url` supprimé (migration `20260522144853`)
- Source unique : `product_images`

### ~~6. Sprint 2-4 design~~ ✅ LIVRÉ
- Sprint 2 : ProductCard, NavBar, PDP, Bannières, Home, Footer, Wishlist
- Sprint 3 : Admin pages product/marques/stock/tags/messages/annonce + i18n admin
- Sprint 4 : About 8 sections, Catalogue redesign, ProductCard redesign

---

## Findings ouverts restants (25)

### Sécurité (3 ouverts)
- CSRF tokens sur les POST publics (newsletter, contact)
- Validation Zod sur les body POST/PATCH admin
- CSP headers strictes

### Performance (3 ouverts)
- Pagination/lazy-load CatalogueClient (500+ produits SSR)
- Code splitting client components (next/dynamic)
- Cache-Control headers par route ISR

### Architecture (2 ouverts)
- CatalogueClient 513 LOC à splitter
- DeleteConfirmModal dupliqué 3 fois

### Base de données (4 ouverts)
- `auth.uid()` non wrappé `(SELECT auth.uid())` dans RLS policies
- `is_user_admin` non marquée STABLE
- Vue `tags_with_types` non matérialisée
- `banner_type_enum` strict

### Accessibilité (4 ouverts)
- Focus trap CartDrawer + MobileDrawer
- `aria-invalid` + `aria-describedby` sur forms
- Newsletter success/error non annoncé aux SR
- Contraste `ink-400` sur fond clair

### SEO (1 ouvert)
- Schema.org/CollectionPage sur catalogue et marques

### DX (3 ouverts)
- E2E Playwright non intégré au CI
- Step `build` manquant dans CI
- Supabase SDKs très en retard (@supabase/ssr 0.6→0.10, supabase-js 2.50→2.106)

### UX (2 ouverts)
- Filtres catalogue 100% client-side (perf à 353+ produits)
- 3 `alert()` restants (admin users + newsletter)

### Code Quality (3 ouverts)
- 126 `console.error/log` → logger structuré
- Admin pages >450 LOC (reservations 498, messages 489, stock 468, settings 395)
- DeleteConfirmModal non unifié (3 copies)

---

## Points forts confirmés

- TypeScript strict, **0 erreur tsc, 0 warning lint, 0 `any`**
- Schéma BDD 3NF, RLS partout, `is_user_admin` RPC unifiée
- App Router SSR correct avec ISR (60s–86400s selon les pages)
- Design system cohérent sand/clay/ink avec Tailwind 4
- i18n complet next-intl (FR/EN/ES, ~1 360 clés, admin inclus)
- SEO complet : sitemap dynamique, hreflang, JSON-LD Product, generateMetadata
- CI verte (lint + tsc + vitest) + pre-commit Husky
- Système de réservation click & collect fonctionnel end-to-end
- Wishlist système complet (RLS + API + UI optimistic)
- 22 migrations ordonnées, toutes idempotentes

---

## Comment lire les rapports

Chaque rapport thématique suit la même structure :
- **Synthèse** en tête (note + top 3)
- **Findings** numérotés avec severity + état (✅ FERMÉ / ⚠️ PARTIEL / ❌ OUVERT)
- **Recommandations** restantes priorisées

Ouvrir selon ton intérêt :
- Prochaine session → **HANDOFF.md** (punch list priorisée)
- Sécurité pré-prod → **security.md**
- Hygiène code → **code-quality.md** + **architecture.md**
- Amélioration continue → **accessibility.md** + **performance.md**
