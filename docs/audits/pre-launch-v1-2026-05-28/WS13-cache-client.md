# WS13 — Cache client & state (SWR / thème / identité)

Audit PRE-V1 **lecture seule**. Périmètre : SWR (`useCart`, `useWishlist`), optimistic updates, cohérence anon↔auth, cache thème serveur (`getThemeConfig` + `revalidateTag`), `ThemeModeToggle` / script anti-flash, `useMediaQuery`, absence de Supabase Realtime. Aucune écriture de code, aucun MCP.

Date : 2026-05-28 · Branche `main` · HEAD `1949a2b`.

---

## Verdict

**ROUGE sur un point précis, vert ailleurs.** Le state client est globalement sain et bien construit (SWR centralisé, optimistic + rollback systématiques, `useRef` anti-flicker sur les transitions auth, script anti-flash thème correct, `useMediaQuery` SSR-safe, 0 Realtime confirmé). **Mais deux défauts bloquent / pénalisent la V1 :**

1. **WS13-01 (P1) — divergence durable panier** : le stepper de quantité (`updateQuantity`) envoie une **quantité absolue** au endpoint `POST /api/cart` dont la RPC `add_to_cart` **incrémente**. L'optimistic affiche la bonne valeur, puis `refreshCart()` révèle une quantité erronée (1→2 produit en DB 3). C'est la source confirmée de la flakiness du test `cart.spec.ts`.
2. **WS13-02 (P1) — fuite wishlist entre identités** : aucun logout/login ne purge le cache SWR `/api/wishlist` (ni `revalidateOnFocus`). Sur un navigateur partagé, l'utilisateur B peut voir les cœurs « favori » de l'utilisateur A jusqu'à une revalidation.

Le panier, lui, est réinitialisé correctement à chaque transition (`refreshCart` dans `useAuth`), donc **pas** de fuite panier — uniquement la wishlist.

---

## Findings

### WS13-01 · P1 · CONFIRMÉ — Stepper quantité : optimistic absolu vs RPC incrémentale → état corrompu

**Preuve :**
- `src/components/cart/CartLineItem.tsx:43-47` — le stepper calcule la **cible absolue** : `onUpdateQuantity(item.product_id, item.quantity + 1)`.
- `src/hooks/useCart.ts:185` — optimistic en **valeur absolue** : `optimisticData.cart.items[itemIndex].quantity = quantity`.
- `src/hooks/useCart.ts:195-199` — puis POST `/api/cart` avec `{ productId, quantity }` (la même payload que `addToCart`).
- `src/app/api/cart/route.ts:214-221` — le POST appelle la RPC `add_to_cart(p_quantity = quantity)`.
- `supabase/migrations/20260519092026_fix_add_to_cart_increment.sql:27-28` — la RPC fait `quantity = cart_items.quantity + EXCLUDED.quantity` (**incrément**, voulu pour « Ajouter au panier » répété).

**Impact :** quantité réellement persistée = `ancienne + cible`. Ex. 1 → clic « + » → optimistic affiche 2 → serveur écrit `1+2=3` → `refreshCart()` (useCart.ts:207) ramène 3. L'optimistic **masque transitoirement** le bug ; l'erreur n'est pas une erreur HTTP (200 OK), donc aucun rollback ne se déclenche — la divergence est **durable** et silencieuse. Idem au « − » : 3 → cible 2 → serveur `3+2=5`. Prix total et total panier deviennent faux.

**Lien flakiness tests (confirmé) :** `tests/cart.spec.ts:72-77` clique `quantity-increase` puis asserte `quantity-display = '2'` et `cart-badge = '2'`. L'assertion passe sur l'état optimiste mais l'état post-`refreshCart` est **3** ; selon le timing (revalidation arrivée avant/après l'assertion), le test flappe — exactement la flakiness documentée dans le HANDOFF.

**Reco :** le stepper doit exprimer un **delta**, pas une cible. Deux options :
- (a) Router `updateQuantity` vers un nouveau endpoint `PATCH /api/cart` (ou paramètre `mode=set`) faisant un `UPDATE cart_items SET quantity = $abs` ; ou
- (b) Garder le POST incrémental mais envoyer le **delta** (`quantity - item.quantity`, négatif possible) — nécessite que la RPC accepte un delta signé et clampe à ≥1/0.
Recommandé : (a) — sémantique « set » explicite pour le stepper, RPC incrémentale conservée pour le bouton « Ajouter ». Effort : **M** (1 migration RPC + 1 branche route + ajustement `useCart.updateQuantity` + test).

---

### WS13-02 · P1 · CONFIRMÉ — Cache SWR `/api/wishlist` non purgé au changement d'identité (fuite entre users)

**Preuve :**
- `src/hooks/useWishlist.ts:23-27` — SWR clé fixe `'/api/wishlist'`, `revalidateOnFocus: false`, aucune autre revalidation.
- `src/hooks/useAuth.ts:27-33,48` — le handler `SIGNED_OUT` n'appelle **que** `refreshCart()`. La wishlist n'est jamais touchée.
- Logout : `NavBar.tsx:36-39`, `account/AccountSidebar.tsx:28-32`, `admin/dashboard/Sidebar.tsx:151` → `supabase.auth.signOut()` + `router.push('/')` (navigation **client**, le cache SWR en mémoire **persiste**).
- `SWRProvider.tsx:11-31` — `SWRConfig` global **sans `provider`** : aucun reset de cache par identité.
- Le SIGNED_IN de `useAuth.ts:43-47` merge le panier + `refreshCart`, mais **ne revalide pas** `/api/wishlist`.

**Impact :** sur un navigateur partagé (cas courant en pharmacie / kiosk RD), après logout de A puis login de B (SPA, sans reload), les cœurs « favori » affichés (`ProductCardHeart`, `PdpWishlistButton` via `has(productId)`) reflètent **les favoris de A** jusqu'à ce qu'une revalidation survienne (mutation wishlist, reconnexion réseau, ou hard reload). Le fetcher renvoie `{ productIds: [] }` sur 401 (useWishlist.ts:10), donc une 401 nettoie — mais B est authentifié, donc pas de 401 ; B voit les données de A jusqu'à la 1re revalidation. Fuite de PII douce (préférences produit) entre comptes.

**Reco :** au `SIGNED_OUT` **et** au `SIGNED_IN` (transition d'identité), invalider explicitement la clé wishlist. Le plus simple : dans `useAuth`, importer `useSWRConfig().mutate` et appeler `mutate('/api/wishlist')` (revalidation) dans `handleUserLogin`/`handleUserLogout`. Alternative robuste : un reset ciblé du cache SWR sur changement d'`user.id`. Effort : **S**.

---

### WS13-03 · P2 · CONFIRMÉ — `clearCart` : N DELETE en parallèle, pas de tolérance à l'échec partiel

**Preuve :** `src/hooks/useCart.ts:236-245` — `Promise.all(data.cart.items.map(... DELETE ...))`. Un `fetch` rejette seulement sur erreur réseau ; un DELETE renvoyant 500 résout (response non-ok mais promesse tenue) → `Promise.all` ne rejette pas → pas de rollback, et le panier optimiste reste « vide » alors que des items subsistent côté serveur. `refreshCart()` final corrige l'affichage, donc l'incohérence n'est pas durable, mais l'utilisateur croit avoir vidé alors que la DB peut être partielle si certains DELETE échouent.

**Impact :** mineur (chemin « vider le panier », volume faible) ; pas de corruption durable grâce au `refreshCart`. **Reco :** vérifier `res.ok` de chaque DELETE et `throw` si l'un échoue (le `catch` fait déjà `refreshCart` + rethrow). Effort : **S**.

---

### WS13-04 · P2 · CONFIRMÉ — `getThemeConfig` : `revalidate: 300` masque la propagation du thème pendant 5 min en cas d'échec du tag

**Preuve :** `src/lib/getThemeConfig.ts:55-57` — `unstable_cache(..., { tags: [THEME_CONFIG_TAG], revalidate: 300 })`. `src/app/api/admin/appearance/route.ts:67` — `revalidateTag(THEME_CONFIG_TAG)` au PATCH.

**Impact :** le chemin nominal est correct (le `revalidateTag` invalide immédiatement, le visiteur voit le nouveau thème au prochain rendu serveur **sans hard refresh**). Mais : (1) `revalidateTag` n'invalide que le **cache serveur** ; une page `[locale]` déjà servie (SSG/ISR) côté **client navigation** garde son `data-theme`/`data-mode` jusqu'à un nouveau document HTML — le visiteur en SPA ne voit donc pas le changement avant une navigation full-document ou reload. (2) Si la déploiement multi-instance ne partage pas le cache, certaines instances servent l'ancien thème jusqu'au TTL 300 s. Comportement acceptable pour un réglage admin peu fréquent, mais à documenter. **Reco :** OK pour V1 ; noter dans le runbook que le changement de thème se voit au prochain chargement de page (pas en SPA in-place). Effort : **doc only**.

---

### WS13-05 · P3 · CONFIRMÉ — Page légale documente un mécanisme de stockage obsolète (`farmau:anonymous_id` localStorage)

**Preuve :** `src/app/[locale]/legal/cookies/page.tsx:90` liste `farmau:anonymous_id (localStorage)` comme stockage actif. Or l'identité panier anon est désormais un **cookie httpOnly `cart_id`** (`src/app/api/cart/route.ts:23-32`, commit `fab9c64`). Aucune écriture `localStorage['farmau:anonymous_id']` dans `src/`.

**Impact :** conformité/transparence RD — la page cookies décrit un stockage qui n'existe plus et omet le cookie `cart_id`. Pas un bug de cache, mais une incohérence état-déclaré vs état-réel. **Reco :** mettre à jour le tableau cookies (remplacer `farmau:anonymous_id` localStorage par le cookie `cart_id` httpOnly 30 j). Effort : **S** (recoupe WS06 PII/RD).

---

### WS13-06 · P3 · SUSPECTÉ — `addToCart` optimiste : placeholder `price: 0` fausse brièvement le total

**Preuve :** `src/hooks/useCart.ts:77-95` — pour un **nouvel** item, l'optimistic pousse un placeholder `{ name: 'Chargement...', price: 0 }` et recalcule `totalPrice` avec ce 0. Corrigé par `refreshCart()` (~ms plus tard).

**Impact :** flash visuel d'un total sous-évalué + libellé « Chargement... » dans le drawer si ouvert pendant l'ajout. Purement transitoire (pas de divergence durable). **Reco :** facultatif — n'afficher le total qu'une fois les vrais prix connus, ou ne pas pousser de placeholder à prix 0. Effort : **S**, basse priorité.

---

## Cohérence anon ↔ auth

| Aspect | État | Détail |
|---|---|---|
| Merge panier au login | ✅ Sain | `useAuth` SIGNED_IN (transition réelle uniquement, gardé par `previousUserIdRef`) → `POST /api/cart/merge` (RPC `merge_anon_cart_to_user`, supprime le cookie `cart_id`) → `refreshCart()`. |
| Anti-double-merge au focus tab | ✅ Sain | `useAuth.ts:43-47` ignore les ré-émissions `SIGNED_IN` à ID identique ; `INITIAL_SESSION` enregistre l'ID sans side-effect. Idem `useIsAdmin.ts:73-81`. |
| Purge panier au logout | ✅ Sain | SIGNED_OUT → `refreshCart()` ; le serveur résout désormais un cart anon (cookie `cart_id` recréé) → pas de fuite du panier de A vers B. |
| Purge wishlist au logout/login | ❌ **WS13-02** | Cache SWR `/api/wishlist` jamais invalidé sur changement d'identité → fuite des favoris entre comptes sur même navigateur. |
| Cookie identité anon | ✅ Sain | `cart_id` **httpOnly**, `sameSite=lax`, 30 j (route.ts:27-31) — non lisible par JS, pas d'exfiltration XSS. |
| localStorage `farmau:search:recents` | ⚠️ Mineur | Non scopé par user : les recherches récentes de A restent visibles pour B sur navigateur partagé (NavSearch.tsx:68,117). Non-PII sensible, mais à connaître. Pas purgé au logout. |
| localStorage `farmau:cookies:consent` | ✅ Acceptable | Préférence d'appareil, partage entre users attendu/inoffensif. |
| localStorage `farmau:mode` (thème) | ✅ Acceptable | Préférence d'appareil, partage attendu. |
| Reset cache SWR par identité | ❌ Absent | `SWRProvider` sans `provider` custom → aucune réinitialisation globale du cache à la transition d'identité (cause racine de WS13-02). |

**Synthèse :** le panier est correctement isolé entre identités (merge + refresh). La **wishlist ne l'est pas** (WS13-02, P1). Les `localStorage` non sensibles fuitent partiellement (recents), acceptable hors PII.

---

## Confirmation « 0 Realtime »

**CONFIRMÉ — aucune utilisation de Supabase Realtime / WebSocket.**

`grep -rn "\.channel\|\.subscribe(\|realtime\|postgres_changes\|removeChannel\|RealtimeChannel" src/` → **0 résultat**. Les seuls abonnements sont `supabase.auth.onAuthStateChange` (`useAuth.ts:35`, `useIsAdmin.ts:67`) qui est un listener client local (pas un WebSocket Realtime DB) et SWR (`refreshInterval: 0` partout → pas de polling). Aucun canal `postgres_changes`, aucune souscription temps réel attendue ni présente. Le rafraîchissement des données repose entièrement sur SWR (revalidation manuelle + `revalidateOnReconnect`).

---

## `useMediaQuery` / hydratation thème

- **`useMediaQuery` SSR-safe : ✅** (`src/hooks/useMediaQuery.ts`). Retourne `defaultValue` au SSR + 1er render, ne touche `window.matchMedia` que dans `useEffect` (garde `typeof window === 'undefined'`), met à jour au mount + `change`. Pas de mismatch d'hydratation. Seul consommateur réel : `layout.tsx` (le script anti-flash inline, pas le hook). Fallback Safari < 14 `addListener` géré.
- **Script anti-flash : ✅** (`src/app/layout.tsx:46`). Inline dans `<head>`, résout `data-mode` **avant le 1er paint** (override visiteur `localStorage['farmau:mode']` si `data-allow-mode==='1'` > défaut admin > `prefers-color-scheme` si `system`). Wrappé en try/catch (mode privé strict toléré).
- **`ThemeModeToggle` : ✅** (`src/components/ThemeModeToggle.tsx`). Rend `null` au SSR + 1er render (`mounted` false) → **aucun mismatch d'hydratation** ; lit l'état réel du DOM au mount, écrit `data-mode` + `localStorage` (try/catch). Le `data-mode` posé par le SSR (`layout.tsx:60`) et affiné par le script anti-flash est la source de vérité ; le toggle n'introduit pas de divergence SSR/CSR.

---

## Tableau récap

| ID | Sév. | Sujet | Statut | Effort |
|---|---|---|---|---|
| WS13-01 | **P1** | Stepper quantité absolue vs RPC incrémentale → panier corrompu durablement (+ flakiness test) | Confirmé | M |
| WS13-02 | **P1** | Cache SWR wishlist non purgé au changement d'identité → fuite favoris entre users | Confirmé | S |
| WS13-03 | P2 | `clearCart` ne détecte pas l'échec partiel des DELETE parallèles | Confirmé | S |
| WS13-04 | P2 | Thème : `revalidateTag` OK mais pas de propagation in-place SPA / TTL 300 s multi-instance | Confirmé | doc |
| WS13-05 | P3 | Page légale cookies décrit `farmau:anonymous_id` localStorage obsolète (vs cookie `cart_id`) | Confirmé | S |
| WS13-06 | P3 | `addToCart` optimiste : placeholder `price:0` fausse le total transitoirement | Suspecté | S |

---

## Points sains (à préserver)

- **SWR centralisé** (`SWRProvider`) : `revalidateOnFocus:false`, `revalidateOnReconnect:true`, `dedupingInterval:2000`, `errorRetryCount:3`, `focusThrottleInterval:5000` — config raisonnable, pas de polling intempestif.
- **Optimistic + rollback systématiques** : `useCart` (add/remove/update/clear) et `useWishlist.toggle` ré-appliquent l'état précédent dans le `catch` puis `refreshCart`/`mutate(data)`. La wishlist gère explicitement le 401 (rollback + `needAuth`).
- **Anti-flicker auth** : `previousUserIdRef`/`currentUserIdRef` neutralisent les ré-émissions `SIGNED_IN` au focus tab (cause de l'ancien flash « reload » admin) — robuste.
- **Cookie panier anon httpOnly** (`cart_id`) — pas d'exfiltration XSS du token panier.
- **0 Supabase Realtime** confirmé — surface d'attaque WebSocket nulle, pas de coût connexions persistantes.
- **`useMediaQuery` + `ThemeModeToggle` + script anti-flash** : aucun mismatch d'hydratation, transition de thème sans flash.
- **`getThemeConfig`** : client anon **sans cookies** + `unstable_cache` → les pages `[locale]` restent SSG (pas de bascule dynamic), invalidation on-demand au save admin.
