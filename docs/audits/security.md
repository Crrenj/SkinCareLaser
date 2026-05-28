# Audit Sécurité

Dernière mise à jour : 2026-05-26

## Synthèse

**Note : B− (révisé 2026-05-28 — re-vérification WS03 : 10 findings RPC ouverts, dont 2 P1 IDOR panier. Voir section dédiée ci-dessous.)**

La posture sécurité a été radicalement améliorée depuis l'audit initial (2026-05-19) où la note était **Critique**. Les 3 findings critiques originaux sont fermés : toutes les routes admin sont authentifiées, le fallback `localStorage` pour les tokens a été supprimé, et le système d'authentification unifié autour de la RPC `is_user_admin`.

### Couches de défense actuelles

1. **Middleware** (`/admin/*`) — vérifie session JWT via `getUser()` + RPC `is_user_admin`
2. **Layout admin** — re-check client via `useIsAdmin` hook
3. **API routes** — `requireAdmin()` sur les 24 routes `/api/admin/*`
4. **RLS** — actif sur 20/21 tables, service-role uniquement pour les opérations légitimes
5. **Rate limiting** — `/api/contact` (5/min/IP), `/api/newsletter` (3/min/IP)
6. **Cookies** — `SameSite=Lax`, `Secure` en production, pas de `localStorage` fallback

## ⚠️ Re-vérification authz RPC / route (WS03 — 2026-05-28)

> Rapport : [`rpc-route-authz-2026-05-28/WS03-rpc-route-authorization.md`](./rpc-route-authz-2026-05-28/WS03-rpc-route-authorization.md). Ce fichier (daté 2026-05-26) est antérieur ; ces findings n'y étaient pas couverts.

La classe « RPC `SECURITY DEFINER` qui fait confiance à un ID fourni par le client » a rouvert **10 findings**. Les routes sont saines (26 routes `/api/admin/*` gardées `requireAdmin()` ; routes publiques dérivent l'identité serveur). Mais le `GRANT EXECUTE ON ALL FUNCTIONS … TO anon` du baseline n'a pas été walké-back pour les RPC panier/messages → elles sont appelables en direct via la clé anon publique (PostgREST `/rest/v1/rpc/*`) en **bypassant la RLS** (car `SECURITY DEFINER`).

| ID | Sév | RPC/route | Problème |
|---|---|---|---|
| F-RPC-1 | **P1** | `remove_from_cart` | `COALESCE(p_user_id, auth.uid())` → un `p_user_id` client vide le panier d'autrui |
| F-RPC-2 | **P1** | `get_or_create_cart` | identité 100 % client → fuite/appropriation du `cart_id` d'autrui |
| F-RPC-3 | P2 | `add_to_cart` | check de propriété sauté si `p_anon_id` NULL |
| F-RPC-4 | P2 | `create_contact_message` | appel direct contourne rate-limit/CSRF → énumération + messages usurpés (ré-ouvre #9) |
| F-RPC-5 | P2 | `mark_message_as_read` | RPC morte (0 call-site), anon, sans check admin → `DROP` |
| F-RPC-6/7 | P3 | `get_messages_stats` / `is_user_admin` | anon → fuite compteurs / sonde « tel UUID est admin ? » |
| F-RPC-8 | P2 | `merge_anon_cart_to_user` | vol d'un panier anon connu (UUID requis) |
| F-ROUTE-1/2 | P3 | RLS INSERT `contact_messages` / `/api/admin/upload` | INSERT trop large ; `fileName`/`contentType` client + `upsert` |

**Fix** : `REVOKE EXECUTE … FROM PUBLIC, anon` + `GRANT … TO service_role` sur les 6 RPC panier/messages (la route les appelle déjà en service-role) ; `is_user_admin` → `REVOKE anon` + `GRANT authenticated`. Aligner sur `create_reservation`/`check_rate_limit` (déjà durcies).

**Statut des findings ci-dessous corrigé** (ce fichier était stale) : #3 (cart `httpOnly`) ✅ fermé (`route.ts:30`), #6 (CSRF) ✅ fermé (`csrf.ts`/`checkOrigin`), #11 (Zod) ✅ fermé (`src/lib/schemas.ts`), #13 (CSP) ✅ fermé (`next.config.ts`). #9 persiste → repris en F-RPC-4. #10 (`ilike`) : en fait **sûr** — `.ilike()` PostgREST est paramétré (pas de concaténation SQL).

## Findings

### ~~1. Routes `/api/admin/*` non authentifiées~~ ✅ FERMÉ
- `requireAdmin()` appelé en tête de chaque handler (24 routes)
- Helper centralisé dans `src/lib/requireAdmin.ts`
- Vérifie `getUser()` (validation JWT serveur) + table `admin_users`

### ~~2. `SUPABASE_SERVICE_ROLE_KEY` exposée / dupliquée~~ ✅ FERMÉ
- Singleton `supabaseAdmin` dans `src/lib/supabaseAdmin.ts`
- Un seul nom accepté : `SUPABASE_SERVICE_ROLE_KEY` (fallback `SUPABASE_SERVICE_KEY` gardé pour compat)
- La clé n'est plus exposée dans aucun output visible

### ~~3. Bypass horizontal panier (`anonymous_id`)~~ ⚠️ PARTIEL
- Routes `/api/cart` utilisent `supabaseAdmin` avec validation côté serveur
- `cart_id` cookie toujours `httpOnly: false` — exposé au JS côté client
- **Recommandation** : passer `httpOnly: true` (aucun code client ne lit le cookie directement)

### ~~4. Fallback `localStorage` pour tokens~~ ✅ FERMÉ
- Supprimé dans le commit `a037202`
- Navigation privée : message clair plutôt que dégradation sécurité

### ~~5. Cookie Supabase sans `Secure`~~ ✅ FERMÉ
- `Secure` posé en production via middleware

### 6. Aucune CSRF protection — ❌ OUVERT
- Les POST publics (`/api/newsletter`, `/api/contact`) n'ont pas de token CSRF
- Atténué par `SameSite=Lax` mais pas une garantie complète
- **Recommandation** : vérifier `request.headers.get('origin')` sur les routes mutantes

### ~~7. UUID admin hardcodé~~ ✅ FERMÉ
- Supprimé, utilise `auth.uid()` via session

### ~~8. `is_user_admin` sans `SET search_path`~~ ✅ FERMÉ
- Migration `20260522092810` a fixé les 9 fonctions SECURITY DEFINER

### ~~9. `/api/contact` énumération emails~~ ⚠️ PARTIEL
- Rate limit ajouté (5/min/IP)
- La réponse distingue encore "email non trouvé" vs succès
- **Recommandation** : uniformiser la réponse (pas de leak d'existence)

### ~~10. Recherche `ilike` injection PostgREST~~ ❌ OUVERT (Low)
- Pattern `search` non sanitisé dans les filtres admin
- Impact bas (admin-only, pas de SQL injection réelle)

### 11. Validation body API admin — ❌ OUVERT (Medium)
- Les routes admin acceptent `...productData` en spread sans liste blanche
- **Recommandation** : Zod schema sur tous les POST/PATCH admin

### ~~12. Rate limit absents~~ ✅ FERMÉ
- `/api/contact` 5/min/IP, `/api/newsletter` 3/min/IP
- Stratégie fail-open (RPC error → request allowed) — acceptable mais à monitorer

### 13. CSP headers manquants — ❌ OUVERT (Low)
- Aucun Content-Security-Policy configuré
- **Recommandation** : `default-src 'self'; script-src 'self'` via `next.config.ts`

## Matrice protection API

| Route | Méthode | Auth | Rate limit |
|---|---|---|---|
| `/api/admin/*` (24 routes) | GET/POST/PATCH/DELETE | `requireAdmin()` | Non |
| `/api/cart` | GET/POST/DELETE | Service-role + anon_id cookie | Non |
| `/api/cart/reserve` | POST | Session JWT obligatoire | Non |
| `/api/contact` | POST | Public | 5/min/IP |
| `/api/newsletter` | POST | Public | 3/min/IP |
| `/api/newsletter` | GET/DELETE | Session JWT | Non |
| `/api/wishlist` | GET/POST | Session JWT + RLS | Non |
| `/api/search` | GET | Public (anon role) | Non |
| `/api/account/preferences` | PATCH | Session JWT | Non |

## Recommandations priorisées

1. **(Medium)** Ajouter validation Zod sur les body POST/PATCH admin
2. **(Medium)** Vérifier `origin` header sur les routes mutantes publiques
3. **(Low)** Passer `cart_id` en `httpOnly: true`
4. **(Low)** Uniformiser la réponse `/api/contact` (pas de leak email)
5. **(Low)** Ajouter CSP headers
6. **(Low)** Alerter sur les fail-open rate limit (quand RPC échoue)
