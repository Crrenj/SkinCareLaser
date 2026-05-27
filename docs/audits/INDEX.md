# Audit complet — FARMAU / Skincare Laser

Date d'audit initial : 2026-05-19
Date mise à jour : 2026-05-27 (post session soir — sécurité, a11y, i18n admin complet, SEO, DX)
Branche : `main`
Dernier commit : `85fa6ad feat(i18n): localize 5 remaining admin pages (FR/ES/EN)`

> **État** : voir `docs/HANDOFF.md` pour la punch list courante.
> **142 findings initiaux** dont la grande majorité **fermés** lors des sessions 2026-05-19 → 2026-05-27.

---

## Métriques clés (2026-05-27)

| Métrique | Valeur |
|---|---|
| LOC (src/) | ~31 400 |
| Fichiers TS/TSX | 253 |
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
| `console.error` brut | **0** (tout via `logger`) |
| `toast()` usages | 36 |
| `role="dialog"` | 18 |
| `useModalA11y` usages | 26 (dont CartDrawer + MobileDrawer) |
| `focus-visible` usages | 67 |
| Tests Vitest | 8/8 |
| Specs Playwright | 11 fichiers, ~27 test blocks |
| Clés i18n (par locale) | ~1 616 |
| Migrations DB | 24 |
| Produits actifs DB | 353 |
| Dépendances ajoutées | zod (validation API) |
| Dépendances Supabase | supabase-js 2.106, ssr 0.10 |

---

## Vue d'ensemble

| Dimension | Note initiale | Note actuelle | Findings ouverts | Rapport |
|---|---|---|---|---|
| Sécurité | 🔴 Critique | 🟢 **A-** | 0 | [security.md](./security.md) |
| Performance | 🟠 C+ (5/10) | 🟢 **B+ (8/10)** | 1 | [performance.md](./performance.md) |
| Architecture | 🟠 B- | 🟢 **A (9/10)** | 0 | [architecture.md](./architecture.md) |
| Base de données | 🟠 B- | 🟢 **A- (9/10)** | 1 | [database.md](./database.md) |
| Accessibilité | 🔴 38/100 | 🟢 **A (9/10)** | 0 | [accessibility.md](./accessibility.md) |
| SEO | 🟠 65-75/100 | 🟢 **A (9/10)** | 0 | [seo.md](./seo.md) |
| Developer Experience | 🟡 6/10 | 🟢 **A (9/10)** | 1 | [developer-experience.md](./developer-experience.md) |
| UX / Product | 🔴 4/10 | 🟢 **B+ (7.5/10)** | 0 | [ux.md](./ux.md) |
| Qualité de code | 🟡 C+ (6.5/10) | 🟢 **A+ (10/10)** | 0 | [code-quality.md](./code-quality.md) |
| **TOTAL** | | | **3 ouverts** (139 fermés) | |

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
- ✅ `aria-invalid` + `aria-describedby` sur login/signup + `aria-live` sur FooterNewsletter
- ✅ Error boundaries `error.tsx` sur `[locale]` et `admin`

### Sécurité — état détaillé (session 2026-05-27 soir)
- ✅ Validation Zod sur tous les body POST/PATCH/PUT admin (20 routes, `src/lib/schemas.ts`)
- ✅ CSRF origin check sur `/api/newsletter` POST + `/api/contact` POST (`src/lib/csrf.ts`)
- ✅ CSP + Permissions-Policy headers (`next.config.ts`)
- ✅ Cookie `cart_id` httpOnly + merge server-side (`/api/cart/merge`)
- ✅ `(SELECT auth.uid())` dans 28 RLS policies + `is_user_admin` STABLE (migration `20260527100000`)

### i18n admin — état détaillé (session 2026-05-27 soir)
- ✅ 6 modaux d'édition : ProductFormModal, BrandFormModal, RangeFormModal, TagModal, TagTypeModal, BannerFormModal
- ✅ 5 pages admin : reservations, users, newsletter, settings, setup (+ sous-composants UsersClient, NewsletterClient)
- ✅ ~270 clés ajoutées sous `Admin.{modals.*,reservations,users,newsletter,settings,setup}`
- ✅ Admin entièrement localisé FR/ES/EN (sidebar, chrome, toutes pages, tous modaux)

---

## Findings ouverts restants (3)

### Performance (1)
- Code splitting client components (`next/dynamic`)

### Base de données (1)
- `tags_with_types` vue non matérialisée (perf si catalogue > 1000 produits)

### DX (1)
- Playwright CI nécessite secrets GitHub configurés

---

## Points forts confirmés

- TypeScript strict, **0 erreur tsc, 0 warning lint, 0 `any`, 0 alert, 0 ink-400, 0 console.error brut**
- **Sécurité A-** : Zod sur toutes les routes admin, CSRF, CSP, httpOnly cookies, RLS optimisées
- **i18n complet** : ~1 616 clés/locale, admin entièrement localisé FR/ES/EN
- Logger structuré `src/lib/logger.ts` (0 console.error brut dans src/)
- Toutes les modales/drawers ont focus trap via `useModalA11y`
- Delete confirmations unifiées via `useConfirmDialog` (0 modal custom)
- Error boundaries sur les routes principales
- JSON-LD CollectionPage + og:image dynamique
- shop_settings SSR dans réservation + Footer + CartEmpty
- `orders`/`order_items` supprimées (0 ligne, jamais branchées)
- CI : lint + typecheck + vitest + build + Playwright (chromium)
- Supabase SDKs à jour (2.106 + 0.10)
