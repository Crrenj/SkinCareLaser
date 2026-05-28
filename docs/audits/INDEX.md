# Audit complet — FARMAU / Skincare Laser

Date d'audit initial : 2026-05-19
Date mise à jour : 2026-05-28 (review multi-agent + correctifs — 9 findings fermés + blocker build levé)
Branche : `main`

> **État** : voir `docs/HANDOFF.md` pour la punch list courante.
> **Audit pré-V1 complet du 2026-05-28** (18 workstreams) : [`pre-launch-v1-2026-05-28/`](./pre-launch-v1-2026-05-28/) → `00-VERDICT-V1.md` + `00-REGISTRE-CONSOLIDE.md`.
> Les 10 findings authz RPC du WS03 (re-vérif 2026-05-28) sont **FERMÉS** : migration `20260528160000_harden_rpc_execute_grants.sql` appliquée (REVOKE anon/authenticated sur RPC panier/messages, DROP `mark_message_as_read`). `is_user_admin` laissée intacte volontairement (appelée par des policies RLS publiques). Advisor `anon_security_definer_function_executable` 11 → 2 (reliquats P2). Les 3 P0 de l'audit pré-V1 (bug panier, liens consentement signup, légal ES) sont aussi corrigés.

---

## Métriques clés (2026-05-28)

| Métrique | Valeur |
|---|---|
| LOC (src/) | ~32 400 |
| Fichiers TS/TSX | 260 |
| Pages publiques | 30 (+2 blog) |
| Pages admin | 13 (+1 blog) |
| Routes API | 25 (admin) + 9 (public) |
| Migrations DB | 28 |
| Erreurs TypeScript | **0** |
| Warnings ESLint | **0** |
| `next build` | **passe** (blocker not-found/Footer levé) |
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
| Clés i18n (FR / EN / ES) | 1 442 / 1 442 / 1 442 (parité) |
| Produits actifs DB | 353 |
| Dépendances ajoutées | zod, resend, isomorphic-dompurify |
| Dépendances Supabase | supabase-js 2.106, ssr 0.10 |

---

## Vue d'ensemble

| Dimension | Note initiale | Note actuelle | Findings ouverts | Rapport |
|---|---|---|---|---|
| Sécurité | Critique | **B (durcissement RPC 2026-05-28)** | RPC IDOR **fermés** ; reliquats P2 advisor | [security.md](./security.md) · [WS03](./rpc-route-authz-2026-05-28/WS03-rpc-route-authorization.md) · [pré-V1](./pre-launch-v1-2026-05-28/) |
| Performance | C+ (5/10) | **A- (9/10)** | 0 (code splitting ✅) | [performance.md](./performance.md) |
| Architecture | B- | **A (9/10)** | 0 | [architecture.md](./architecture.md) |
| Base de données | B- | **A- (9/10)** | 0 (schema.sql partiel, gaps documentés) | [database.md](./database.md) |
| Accessibilité | 38/100 | **A (9/10)** | 0 (ink-400 ✅) | [accessibility.md](./accessibility.md) |
| SEO | 65-75/100 | **A (9/10)** | 0 (JSON-LD Article ✅) | [seo.md](./seo.md) |
| Developer Experience | 6/10 | **A (9/10)** | 1 (Playwright CI secrets) | [developer-experience.md](./developer-experience.md) |
| UX / Product | 4/10 | **B+ (7.5/10)** | 0 | [ux.md](./ux.md) |
| Qualité de code | C+ (6.5/10) | **A+ (10/10)** | 0 | [code-quality.md](./code-quality.md) |
| **TOTAL** | | | **10 findings ouverts** (145 historiques fermés + 10 nouveaux WS03) | |

---

## Findings critiques — état

### ~~1-6. Tous les findings critiques originaux~~ FERMÉS
API admin sécurisées, réservation click & collect, bug add_to_cart, accessibilité WCAG, image dupliquée, design sprints 2-4.

### ~~7. XSS stocké via blog body~~ ✅ FERMÉ (2026-05-28)
`src/app/[locale]/blog/[slug]/page.tsx` — `post.body` désormais passé par `DOMPurify.sanitize()` (`isomorphic-dompurify`). Vérifié : `<script>`, `onerror=`, `javascript:` strippés.

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

### Sécurité — état détaillé (2026-05-28)
- ✅ Validation Zod sur tous les body POST/PATCH/PUT admin (21 routes, `src/lib/schemas.ts`)
- ✅ CSRF origin check sur `/api/newsletter` POST + `/api/contact` POST (`src/lib/csrf.ts`)
- ✅ CSP + Permissions-Policy headers (`next.config.ts`)
- ✅ Cookie `cart_id` httpOnly + merge server-side (`/api/cart/merge`)
- ✅ `(SELECT auth.uid())` dans 28 RLS policies + `is_user_admin` STABLE (migration `20260527100000`)
- ✅ Posts RLS : public SELECT restreint à `is_published=true`, admin via `is_user_admin`
- ✅ `RESEND_API_KEY` server-only (pas de `NEXT_PUBLIC_` prefix)
- ✅ XSS blog fermé — `DOMPurify.sanitize(post.body)`
- ✅ Token newsletter TTL — colonne `token_expires_at` (migration `20260528100000`) + check au confirm
- ✅ Rate limit `/api/newsletter/confirm` (10/min/IP)
- ✅ Zod sur DELETE posts + URL confirm via `getSiteUrl()` (plus de header `Origin`)
- ❌ **OUVERT (WS03, 2026-05-28)** : le durcissement RLS/Zod n'atteint PAS les RPC `SECURITY DEFINER`. Le `GRANT EXECUTE … TO anon` du baseline n'a pas été walké-back pour les RPC panier/messages → elles sont appelables en direct (clé anon publique via PostgREST) en bypassant la RLS. 10 findings (voir section dédiée + WS03).

### i18n — état détaillé (2026-05-28)
- ✅ Admin entièrement localisé FR/ES/EN (sidebar, chrome, toutes pages, tous modaux)
- ✅ Blog localisé FR/ES/EN (`Blog` + `Admin.blog` namespaces)
- ✅ Parité complète FR/EN/ES : 1442 clés chacune (`Admin.common.active` ajoutée)

### Features ajoutées commit `5359b2e`
- ✅ Blog : table `posts` + admin CRUD + pages publiques + sitemap + i18n
- ✅ Newsletter double opt-in avec Resend (fallback single opt-in sans API key)
- ✅ Code splitting : `next/dynamic` sur 4 pages client lourdes avec skeletons
- ✅ Banner slots : enums `banner_slot` (4) + `banner_status` (5) + admin UI KPIs
- ⚠️ Banner tracking (view_count/click_count) : UI ready, pas wired côté client
- ⚠️ Banner scheduling : champs start_date/end_date en DB, pas d'auto-transition

---

## Findings de la review 2026-05-28 — tous fermés

| # | Sévérité | Finding | Statut |
|---|---|---|---|
| 1 | CRITIQUE | XSS stocké blog (`post.body` sans sanitisation) | ✅ DOMPurify |
| 2 | MEDIUM | Token newsletter sans TTL | ✅ `token_expires_at` + check |
| 3 | MEDIUM | Pas de rate limit sur `/confirm` | ✅ 10/min/IP |
| 4 | LOW | DELETE posts sans Zod | ✅ `postDelete` |
| 5 | LOW | URL confirm via `Origin` header | ✅ `getSiteUrl()` |
| 6 | LOW | ESLint warning (useEffect dep) | ✅ + 2 préexistants au passage |
| 7 | LOW | Clé i18n `Admin.common.active` EN/ES | ✅ parité 1442×3 |
| 8 | LOW | `db/schema.sql` obsolète | ✅ partiel + gaps documentés |
| 9 | LOW | Trigger posts pas replay-safe | ✅ `DROP IF EXISTS` |
| 10 | LOW | Régression WCAG `text-ink-400` (20×) | ✅ → `ink-500` |
| 11 | SEO | Pas de JSON-LD Article blog | ✅ `BlogPostJsonLd` |
| — | CRITIQUE | Blocker build `not-found`/Footer (préexistant) | ✅ Server Component |

### Tâches restantes (hors findings d'audit)
- **DX** : Playwright CI nécessite secrets GitHub configurés
- **Feature** : banner tracking impressions/clics, banner scheduling auto, blog image upload
- **DB** : `db/schema.sql` full regen via `supabase db dump` (gaps newsletter/wishlists/shop_settings, tables droppées encore listées)
- **Contenu** : prix réels, About placeholders, juridique ES/EN, INCI/benefits produits

---

## Re-vérification authz RPC / route (WS03 — 2026-05-28)

> Rapport complet : [`rpc-route-authz-2026-05-28/WS03-rpc-route-authorization.md`](./rpc-route-authz-2026-05-28/WS03-rpc-route-authorization.md)

Re-vérification ciblée de la classe « RPC `SECURITY DEFINER` qui fait confiance à un ID fourni par le client ». **Les routes sont saines** (les 26 routes `/api/admin/*` gardées `requireAdmin()` ; les routes publiques dérivent l'identité côté serveur via `getUser()` / cookie httpOnly ; `/api/wishlist` + `/api/account/preferences` utilisent le client session + RLS). **Mais 10 findings ouverts sur les RPC** : le `GRANT EXECUTE ON ALL FUNCTIONS … TO anon` du baseline n'a pas été walké-back pour les RPC panier/messages, qui restent appelables directement via la clé anon publique (PostgREST `/rest/v1/rpc/*`) et **bypassent la RLS** (car `SECURITY DEFINER`).

| ID | Sév | RPC / route | Problème | Statut |
|---|---|---|---|---|
| F-RPC-1 | **P1** | `remove_from_cart` | `COALESCE(p_user_id, auth.uid())` — un `p_user_id` client écrase l'identité de session → vider le panier d'autrui | confirmed |
| F-RPC-2 | **P1** | `get_or_create_cart` | identité 100 % client → fuite/appropriation du `cart_id` d'autrui + carts junk | confirmed |
| F-RPC-3 | P2 | `add_to_cart` | check de propriété sauté si `p_anon_id` NULL → écriture dans un cart arbitraire | confirmed |
| F-RPC-4 | P2 | `create_contact_message` | appel direct contourne rate-limit/CSRF/regex → énumération de comptes + messages usurpés | confirmed |
| F-RPC-5 | P2 | `mark_message_as_read` | RPC morte (0 call-site), anon, sans check admin → tamper du triage | confirmed |
| F-RPC-6 | P3 | `get_messages_stats` | anon → fuite des compteurs de messages | confirmed |
| F-RPC-7 | P3 | `is_user_admin` | anon → sonde « tel UUID est-il admin ? » (gating par ailleurs sain) | confirmed |
| F-RPC-8 | P2 | `merge_anon_cart_to_user` | `p_anon_id` non lié au caller → vol d'un panier anon connu (UUID requis) | suspected |
| F-ROUTE-1 | P3 | RLS `contact_messages` INSERT | `user_email IN (auth.users)` au lieu de « = own » → usurpation directe (authenticated) | confirmed |
| F-ROUTE-2 | P3 | `/api/admin/upload` | `fileName`/`contentType` client + `upsert:true` (admin-only) | confirmed |

**Correctif structurel** : `REVOKE EXECUTE … FROM PUBLIC, anon` + `GRANT … TO service_role` sur `get_or_create_cart`, `add_to_cart`, `remove_from_cart`, `create_contact_message`, `get_messages_stats`, `mark_message_as_read` (la route les appelle déjà en service-role) ; `is_user_admin` → `REVOKE anon` + `GRANT authenticated`. Aligner sur le pattern déjà appliqué à `create_reservation` / `check_rate_limit`. Effort ~S (1-2 migrations).

**Précondition atténuante** (F-RPC-1/2/3) : nécessite l'UUID `auth.users.id` / `carts.id` de la victime, non énuméré par une surface publique (profiles RLS = own) → pas d'exploitation de masse, mais c'est une frontière d'autorisation reposant sur l'obscurité d'un UUID (à corriger malgré tout).

---

## Points forts confirmés

- TypeScript strict, **0 erreur tsc, 0 `any`, 0 alert, 0 ink-400, 0 console.error brut**
- **Sécurité** : Zod sur toutes les routes admin, CSRF, CSP, httpOnly cookies, RLS optimisées
- **i18n quasi-complet** : ~1 442 clés/locale, admin + blog entièrement localisés FR/ES/EN
- Logger structuré `src/lib/logger.ts` (0 console.error brut dans src/)
- Toutes les modales/drawers ont focus trap via `useModalA11y`
- Delete confirmations unifiées via `useConfirmDialog` (0 modal custom)
- Error boundaries sur les routes principales
- JSON-LD CollectionPage + og:image dynamique
- shop_settings SSR dans réservation + Footer + CartEmpty
- Code splitting avec skeletons sur les 4 pages client les plus lourdes
- Blog complet avec admin CRUD + pages publiques + sitemap
- Newsletter double opt-in avec Resend + fallback gracieux
- Banner slots avec enums typés + admin UI Sprint 3
- CI : lint + typecheck + vitest + build + e2e
- Supabase SDKs à jour (2.106 + 0.10)
