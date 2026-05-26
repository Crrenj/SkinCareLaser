# Audit Sécurité

Dernière mise à jour : 2026-05-26

## Synthèse

**Note : B+ (solide, production-ready avec réserves mineures)**

La posture sécurité a été radicalement améliorée depuis l'audit initial (2026-05-19) où la note était **Critique**. Les 3 findings critiques originaux sont fermés : toutes les routes admin sont authentifiées, le fallback `localStorage` pour les tokens a été supprimé, et le système d'authentification unifié autour de la RPC `is_user_admin`.

### Couches de défense actuelles

1. **Middleware** (`/admin/*`) — vérifie session JWT via `getUser()` + RPC `is_user_admin`
2. **Layout admin** — re-check client via `useIsAdmin` hook
3. **API routes** — `requireAdmin()` sur les 24 routes `/api/admin/*`
4. **RLS** — actif sur 20/21 tables, service-role uniquement pour les opérations légitimes
5. **Rate limiting** — `/api/contact` (5/min/IP), `/api/newsletter` (3/min/IP)
6. **Cookies** — `SameSite=Lax`, `Secure` en production, pas de `localStorage` fallback

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
