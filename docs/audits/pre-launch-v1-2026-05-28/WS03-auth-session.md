# WS03 — Auth & Session (Audit PRE-V1, lecture seule)

**Date** : 2026-05-28 · **Scope** : stockage tokens, validation session, gating admin, OAuth callback, pages auth, purge logout, flags cookies, redirections post-login · **Mode** : READ-ONLY (lecture/grep/git log uniquement, pas de MCP Supabase).

> **Sévérités** : P0 = bloquant V1 · P1 = important non-bloquant · P2 = mineur. La doc WS03 RPC utilisait P1/P2/P3 ; ici on re-mappe en P0/P1/P2.
> **Hors scope (couvert par un autre agent)** : l'authz des RPC `SECURITY DEFINER` (panier/messages, `is_user_admin` anon-exécutable) est traitée dans `docs/audits/rpc-route-authz-2026-05-28/WS03-rpc-route-authorization.md`. Non ré-audité ici.

---

## Verdict

**Posture AUTH & SESSION solide pour la V1. Aucun P0.** Le système est cohérent autour de `getUser()` (validation JWT serveur) + RPC `is_user_admin` (source de vérité `admin_users`), sans aucun token en `localStorage`. Les 26 routes `/api/admin/*` sont toutes gardées `requireAdmin()` par handler. La colonne legacy `profiles.is_admin` est morte (0 référence dans `src/`).

Trois écarts résiduels, tous **P2 / défense-en-profondeur** (pas d'exposition de données réelle, car la frontière effective reste la RLS / l'`auth.uid()` interne) :
1. **`getSession()` utilisé pour des décisions d'accès** dans 4 emplacements serveur (account layout, 2 pages réservation, `/api/cart/reserve`) au lieu de `getUser()` — incohérence avec le pattern durci ailleurs.
2. **Cookie `cart_id`** sans flag `Secure` en production (les cookies session Supabase + locale admin l'ont).
3. **Cookies session Supabase posés côté client non-`HttpOnly`** (inhérent au browser client `@supabase/ssr` ; tradeoff framework documenté).

Aucun open-redirect exploitable : `redirectedFrom`/`next` ne sont jamais utilisés tels quels comme URL externe — les cibles sont re-préfixées par locale ou passées à `router.push()` (navigation interne Next, pas `window.location` brut sur entrée client).

---

## Findings

### WS03-01 · P2 · `getSession()` pour décision d'accès (4 emplacements) · confirmé
**Preuve.**
- `src/app/[locale]/account/layout.tsx:20` — `getSession()` ; redirige `/login` si absente (gate du hub account).
- `src/app/[locale]/reservation/page.tsx:44` — `getSession()` ; redirige si absente.
- `src/app/[locale]/reservation/confirmation/[id]/page.tsx:35` — `getSession()`.
- `src/app/api/cart/reserve/route.ts:26` — `getSession()` puis SELECT `carts` par `session.user.id`.

**Impact.** `getSession()` (`@supabase/ssr`) **décode le cookie sans valider le JWT côté serveur** (vs `getUser()` qui fait l'appel API de validation). Supabase documente explicitement de ne pas s'en servir pour l'autorisation serveur. **Mais l'exploitation réelle est nulle ici** : (a) le hub account ne montre que `session.user.email` et chaque page enfant re-vérifie via `getUser()` (`profile/security/preferences/reservations`) ; (b) `/api/cart/reserve` n'expose pas de donnée — la mutation passe par la RPC `create_reservation` qui dérive `auth.uid()` en interne + `WHERE user_id = auth.uid()`, et le SELECT `carts` tourne sous RLS (client anon-key) → un cookie forgé/expiré ne lit rien d'autrui. C'est une **incohérence de pattern** (defense-in-depth), pas une faille d'accès.

**Reco.** Aligner sur `getUser()` partout où la présence/identité de session décide d'un rendu ou d'un branchement (account layout + 2 pages réservation + reserve). Coût ~50-200 ms/req, acceptable sur ces surfaces. **Effort : S.**

### WS03-02 · P2 · Cookie `cart_id` sans `Secure` en production · confirmé
**Preuve.** `src/app/api/cart/route.ts:27-31` :
```ts
cookieStore.set('cart_id', anonId, {
  maxAge: 60 * 60 * 24 * 30,
  sameSite: 'lax',
  httpOnly: true,
  // pas de `secure: process.env.NODE_ENV === 'production'`
})
```
Par contraste, les cookies session Supabase (`middleware.ts:64,73`, `supabaseClient.ts:36`) et le cookie locale admin (`set-locale/route.ts:29`) posent bien `secure` en prod.

**Impact.** L'UUID `cart_id` (httpOnly, donc pas lisible par JS) peut transiter en clair sur une connexion HTTP non-TLS (man-in-the-middle réseau). Le secret n'expose que le panier anonyme (pas de PII, pas d'auth). Faible — `farmau.do` est servi en HTTPS, mais le flag manque par cohérence.

**Reco.** Ajouter `secure: process.env.NODE_ENV === 'production'` au `set()`. **Effort : S.**

### WS03-03 · P2 · Cookies session Supabase non-`HttpOnly` côté client · confirmé (inhérent framework)
**Preuve.** `src/lib/supabaseClient.ts:32-38` — le `set()` du browser client écrit via `document.cookie` (impossible d'y poser `HttpOnly`). Les tokens d'accès/refresh Supabase sont donc lisibles par JS sur le chemin client.

**Impact.** Une XSS pourrait lire les tokens depuis `document.cookie`. **C'est le tradeoff documenté de `@supabase/ssr` browser client** : le finding sécurité #4 historique (fallback `localStorage`) est bien fermé (aucun token en localStorage — vérifié, cf. Points sains), et la CSP (`next.config.ts:35-47`) limite la surface XSS (`object-src 'none'`, `base-uri 'self'`, `form-action 'self'`). Le `script-src` autorise toutefois `'unsafe-inline' 'unsafe-eval'` (nécessaire à Next/Turbopack actuel) ce qui réduit la protection XSS. Pas d'action simple sans changer de modèle de session (cookies serveur-only).

**Reco.** Accepter pour la V1 (standard `@supabase/ssr`). À moyen terme : durcir `script-src` (retirer `unsafe-eval`, viser nonce) pour réduire le risque XSS qui rend ce point exploitable. **Effort : M (CSP nonce).**

### WS03-04 · P2 · Énumération de comptes via signup (réponse différenciée) · confirmé
**Preuve.** `src/app/[locale]/(auth)/signup/page.tsx:91-112` — sur erreur `signUp`, le code distingue `emailAlreadyUsed` (`already registered`/`duplicate key`/`23505`) d'autres erreurs et affiche un message dédié `errors.emailAlreadyUsed`.

**Impact.** Un attaquant peut tester si un email a déjà un compte (réponse « déjà utilisé » vs succès). Énumération de comptes. `forgot-password` (`page.tsx:25-27`) est en revanche **correct** (success affiché systématiquement, anti-énumération). Login (`page.tsx:70-75`) renvoie un message générique `invalidCredentials` (pas de distinction email/mot de passe) — **correct**.

**Impact réel limité** : Supabase peut aussi révéler l'existence côté serveur selon la config (`Confirm email`), et un signup n'a pas de rate-limit applicatif. Faible pour une boutique catalogue.

**Reco.** Optionnel V1 : uniformiser le message signup (« vérifiez votre boîte mail ») et activer la confirmation email Supabase si pertinent. **Effort : S.**

### WS03-05 · P2 · Politique mot de passe minimale (8 car., sans complexité serveur) · confirmé
**Preuve.** `signup/page.tsx:24,61` + `reset-password/page.tsx:12,74` — `MIN_PASSWORD_LENGTH = 8`, validé **côté client uniquement**. Un `PasswordStrength` (indicatif) est affiché mais non bloquant. La règle serveur dépend de la config Supabase Auth (non vérifiable depuis le code — à confirmer DB live).

**Impact.** 8 caractères sans exigence de complexité est faible mais acceptable. La validation client est contournable (appel direct `supabase.auth.signUp`), donc la **vraie** garantie est la policy Supabase Auth côté projet.

**Reco.** Confirmer la longueur min + complexité dans le dashboard Supabase Auth (Settings → Auth → Password). Ne pas se fier au check client. **Effort : S (config).**

---

## Tableau récap

| ID | Sév | Emplacement | Problème | Effort | Statut |
|---|---|---|---|---|---|
| WS03-01 | P2 | `account/layout.tsx:20`, `reservation/page.tsx:44`, `reservation/confirmation/[id]/page.tsx:35`, `api/cart/reserve/route.ts:26` | `getSession()` pour décision d'accès au lieu de `getUser()` (frontière réelle = RLS/`auth.uid()`) | S | confirmé |
| WS03-02 | P2 | `api/cart/route.ts:27-31` | Cookie `cart_id` sans `Secure` en prod | S | confirmé |
| WS03-03 | P2 | `lib/supabaseClient.ts:32-38` | Tokens session non-`HttpOnly` côté client (tradeoff `@supabase/ssr`) | M | confirmé (inhérent) |
| WS03-04 | P2 | `(auth)/signup/page.tsx:91-112` | Énumération de comptes (réponse « email déjà utilisé ») | S | confirmé |
| WS03-05 | P2 | `signup/page.tsx:61`, `reset-password/page.tsx:74` | Min 8 car. validé client-only ; garantie = config Supabase | S | suspecté (DB/config) |

**0 P0, 0 P1, 5 P2.**

---

## Points sains (vérifiés)

- **Aucun token en `localStorage`** (finding #4 fermé) : `grep localStorage|persistSession|storageKey|storage:` sur `src/` → les seuls hits sont le thème visiteur (`farmau:mode`), recents de recherche (`farmau:search:recents`), consentement cookies (`farmau:cookies:consent`) et `auth.persistSession:false` sur les clients **service-role/anon-sans-cookies** (`supabaseAdmin.ts:20`, `getThemeConfig.ts:33`). `supabaseClient.ts` documente explicitement l'absence de fallback localStorage.
- **`getUser()` (JWT validé serveur) sur toutes les décisions d'accès critiques** : `middleware.ts:90` (gate `/admin/*`), `requireAdmin.ts:32` (gate routes API admin), `api/cart/route.ts:18`, `api/cart/merge/route.ts:17`, `api/wishlist/route.ts:19,39`, `api/account/preferences/route.ts:21`, `api/newsletter/route.ts:43,138,167`, et les 4 pages account enfants (`profile/security/preferences/reservations`). `getSession()` ne sert que pour WS03-01 (gates de présence sans exposition).
- **Gating admin complet** : les **26** routes `/api/admin/*` appellent `await requireAdmin()` **par handler exporté** (vérifié : nombre d'appels = nombre de méthodes HTTP pour chaque fichier). `requireAdmin` = `getUser()` + lookup `admin_users` via service-role (pas de policy SELECT publique sur `admin_users`). Middleware (`is_user_admin` RPC, `:106`) + layout client (`useIsAdmin` → `_AdminShell` redirige, `:21-28`) = 3 couches.
- **`profiles.is_admin` legacy mort** : `grep is_admin src/` → 0 hit. La source de vérité est `admin_users` (via RPC `is_user_admin` ou lookup direct service-role).
- **OAuth callback** (`auth/callback/page.tsx`) : passthrough middleware (`middleware.ts:33`), gère PKCE (`exchangeCodeForSession`), hash flow, et erreurs provider → `/login?error=…`. Le check `is_user_admin` y est cosmétique (la vraie garde reste le middleware côté serveur). La redirection finale re-préfixe la locale et n'accepte que des chemins commençant par `/` (`:86`) — pas d'open-redirect externe.
- **Pas d'open-redirect via `redirectedFrom`/`next`** : login stocke `next` en `sessionStorage` et redirige via `router.push(redirectPath)` (navigation interne Next) ; admin → `/admin/product` codé en dur ; callback re-localise la cible. Aucune entrée client n'est passée brute à `window.location.href` comme URL absolue.
- **Redirection post-login admin** : `login/page.tsx:96-111` utilise `next/navigation` `router.push('/admin/product')` (non-localisé, correct car `/admin` n'a pas de segment locale). `_AdminShell.tsx:24-26` utilise `window.location.href` vers `/login?redirectedFrom=${pathname}` (chemin interne).
- **Purge au logout** : `signOut()` (NavBar `:37`, AccountSidebar `:29`, admin Sidebar `:151`) déclenche `onAuthStateChange('SIGNED_OUT')` → `useAuth` (monté globalement via `AuthProvider`) appelle `refreshCart()` → re-fetch `/api/cart` désormais non-authentifié (panier anon/vide). Le cookie `cart_id` n'est pas effacé au logout, mais c'est **voulu** : il identifie un panier anonyme distinct du panier user. Le merge anon→user (`/api/cart/merge`) supprime le `cart_id` au login (`merge/route.ts:32`).
- **Anti-double-`SIGNED_IN`** : `useAuth` (`:43-55`) et `useIsAdmin` (`:67-81`) comparent l'`incomingUserId` à un `useRef` → ignorent les ré-émissions `SIGNED_IN`/`TOKEN_REFRESHED` au focus de tab. Pas de re-merge panier ni de flash spinner. `INITIAL_SESSION` enregistre l'ID sans side-effect.
- **`set-locale` admin-only** : `api/admin/set-locale/route.ts:14` → `requireAdmin()` avant de poser le cookie. Cookie `farmau_admin_locale` : `httpOnly:false` (lu côté client), `sameSite:lax`, `secure` en prod, 1 an. `httpOnly:false` acceptable (donnée non-sensible = locale ; lue par le client pour le switch in-place).
- **Flags cookies session** : `Secure` posé en prod (middleware `:64,73`, `supabaseClient.ts:36`) ; `SameSite=Lax` partout.
- **Cookie `cart_id` httpOnly** : `route.ts:30` `httpOnly:true` (aucun code client ne le lit — finding #3 fermé), seul le flag `Secure` manque (WS03-02).
- **`forgot-password` anti-énumération** : success affiché systématiquement (`page.tsx:25-27`). **Login générique** : pas de distinction email/mot de passe (`page.tsx:70-75`).
- **CSP + headers de sécurité** : `next.config.ts:13-52` — X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy, CSP (`object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `connect-src` restreint à supabase + google).

---

## À confirmer en DB live / config Supabase

1. **Policy mot de passe** (WS03-05) : dashboard Supabase Auth → Settings → longueur min + exigences de complexité réellement appliquées côté serveur (le check `MIN_PASSWORD_LENGTH=8` est client-only). Requête : pas de SQL — inspection console Auth.
2. **Confirmation email Supabase** (WS03-04) : si « Confirm email » est ON, le signup ne crée pas de session immédiate et la réponse côté serveur peut elle-même révéler l'existence d'un compte (orthogonal au message client). Vérifier console Auth → Email.
3. **Rate-limit Auth Supabase** : pas de rate-limit applicatif sur `signInWithPassword`/`signUp`/`resetPasswordForEmail` (le rate-limit projet ne couvre que `/api/contact` + `/api/newsletter`). Confirmer les limites Auth par défaut Supabase (par projet/IP) suffisent pour la V1. Console Auth → Rate Limits.
4. **`admin_users` non lisible par anon** : confirmer qu'aucune policy SELECT publique n'existe sur `admin_users` (le lookup `requireAdmin` passe par service-role, donc OK ; mais une policy large casserait l'hypothèse). Requête : `SELECT polname, polcmd, polroles::regrole[] FROM pg_policy WHERE polrelid = 'public.admin_users'::regclass;`
5. **Cookie chunking Supabase** : `@supabase/ssr` peut découper les cookies (`sb-*-auth-token.0/.1`) ; vérifier que la taille n'excède pas les limites navigateur en prod (non bloquant, opérationnel).
