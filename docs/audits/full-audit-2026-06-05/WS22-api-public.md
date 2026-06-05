# WS22 — API publiques

**Périmètre** : `src/app/api/cart/route.ts`, `cart/reserve/route.ts`, `cart/merge/route.ts`, `src/app/api/contact/route.ts`, `search/route.ts`, `newsletter/route.ts`, `newsletter/confirm/route.ts`, `wishlist/route.ts`, `theme/route.ts`, `account/preferences/route.ts`, `src/lib/apiError.ts`. Lus en support (hors périmètre, pour juger) : `src/lib/csrf.ts`, `src/lib/rateLimit.ts`, `src/lib/env.ts`, `src/lib/resend.ts`, `src/lib/getThemeConfig.ts`, `src/lib/schemas.ts`, `src/lib/constants.ts`, `src/hooks/useCart.ts`, `supabaseServer.ts`, `supabaseAdmin.ts`, `next.config.ts` + RPC/RLS/grants live (MCP read-only).
**Fichiers lus** : 11 (périmètre) + ~12 (support) · **Lignes parcourues (approx.)** : ~1 050 (périmètre) + ~700 (support/SQL)
**Synthèse** : P0=0 · P1=1 · P2=5 · P3=5

> Recoupé en base live (`adxpoxcynrpnbbxnncsk`) : définitions des RPC `add_to_cart`/`get_or_create_cart`/`remove_from_cart`/`create_reservation`/`create_ticket`/`merge_anon_cart_to_user`, GRANTs EXECUTE, policies RLS de `carts`/`cart_items`/`contact_messages`/`wishlists`/`newsletter_subscribers`/`shop_settings`, et grants table anon/authenticated.

## Verdict sur les lentilles critiques du prompt (statut réel)

- **IDOR cart** — **PAS exploitable via les routes applicatives.** Le client ne transmet **jamais** `cart_id`/`user_id`/`anonymous_id` : `resolveCartContext()` dérive `userId` via `getUser()` (JWT validé) ou `anonId` via le cookie **httpOnly** `cart_id`, puis `get_or_create_cart(userId, anonId)` renvoie le cart de l'appelant. GET/POST/PATCH/DELETE n'opèrent que sur ce `cart_id` dérivé. Les RPC panier sont `service_role`-only (vérifié : grantees = `postgres,service_role`), donc l'accès PostgREST direct est de toute façon bloqué pour anon/authenticated sur ces fonctions. La **classe d'IDOR en accès PostgREST direct** (table grants anon = ALL, `carts.Create own cart` sans WITH CHECK, `Update own cart`/`Manage own cart items` sans WITH CHECK explicite) est **réelle mais possédée par WS24** (`rls-idor-audit-2026-06-05.md`) — je ne la développe pas ici. Voir hors-périmètre.
- **Rate-limit IP spoofable (`x-forwarded-for`)** — **CORRIGÉ.** `getClientIp` (`rateLimit.ts:56`) lit d'abord `x-vercel-forwarded-for` (posé par l'edge Vercel), puis le **dernier** hop de `x-forwarded-for`, puis `x-real-ip`. Le finding historique (1er hop spoofable, CWE-348) ne tient plus. Résidu mineur : voir WS22-08.
- **CSP `unsafe-eval`** — **CORRIGÉ.** `next.config.ts:65` → `script-src 'self' '<sha256 du script anti-flash>'`, pas de `unsafe-eval` ni `unsafe-inline`.
- **CSRF origin check** — présent et solide (`guardMutation` sur toutes les mutations : origin same-host + allowlist + exigence `Content-Type: application/json`).
- **Double opt-in newsletter** — token 32 octets aléatoires, TTL 24h, vérifié au confirm (`.gt('token_expires_at', now)` + `.is('confirmed_at', null)`), rate-limit 10/min/IP. Correct.
- **Search ilike injection** — wildcards `% _ \` échappés (`search/route.ts:89`). Correct (PostgREST couvre l'injection SQL).

## Findings

### [WS22-01] GET `/api/contact` : route morte qui fuiterait `admin_notes` + auth pattern obsolète — P2
- **Fichier** : `src/app/api/contact/route.ts:85-111`
- **Catégorie** : sécurité | dette
- **Constat** : (1) **Aucun appelant** dans `src/` (les seuls call-sites de `/api/contact` — `ContactForm.tsx:30`, `HelpForm.tsx:25` — sont des **POST**). Route orpheline. (2) Si jamais réactivée, elle fait `.from('contact_messages').select('*')` avec la session user ; la policy RLS *Users view own messages* (`user_email = auth.users.email`) laisse l'owner lire **toute la ligne**, donc `admin_notes` (notes internes de triage) et `replied_by` (UUID admin) — confirmé : ces colonnes existent. (3) Elle s'authentifie via `Authorization: Bearer <token>` reconstruit côté client, pattern **abandonné** par l'audit sécu #4 (suppression du fallback token localStorage) — incohérent avec tout le reste du repo qui passe par cookie SSR + `getUser()`.
- **Impact** : exposition de notes internes au client si la route est branchée ; surface d'API morte et incohérente qui peut être recâblée par erreur.
- **Reco** : supprimer la fonction `GET` (le hub `/account` ne l'utilise pas). Si un endpoint « mes tickets » est voulu, le réécrire avec `getUser()` (cookie SSR) et une `.select()` **colonne par colonne** excluant `admin_notes`/`replied_by`.
- **Confiance** : haute (call-sites greppés, colonnes + RLS vérifiées en base).

### [WS22-02] POST `/api/cart` : stock validé sur le delta, jamais sur le cumul → sur-réservation possible — P2
- **Fichier** : `src/app/api/cart/route.ts:199-204` (+ RPC `add_to_cart` qui INCRÉMENTE)
- **Catégorie** : logique-métier | data
- **Constat** : POST valide `(product.stock ?? 0) < quantity` où `quantity` est le **delta** envoyé, puis `add_to_cart` fait `quantity = cart_items.quantity + EXCLUDED.quantity`. Rien ne contrôle `quantité_existante + delta` contre le stock. En POSTant `quantity = stock` plusieurs fois, chaque requête passe le check et le panier dépasse le stock disponible.
- **Impact** : un panier peut excéder le stock ; `create_reservation` ne re-valide pas non plus le stock (il somme les `cart_items` tels quels) → réservation de quantités > stock. À ce stade le stock est un placeholder (50 partout), donc impact limité tant que la gestion de stock réelle n'est pas branchée, mais le bug est structurel.
- **Reco** : dans POST, lire la quantité courante de la ligne (ou faire le check dans `add_to_cart`) et valider `existant + delta <= stock`. Idéalement déplacer la validation stock dans la RPC `SECURITY DEFINER` (atomique, évite la TOCTOU entre le SELECT stock et l'INSERT).
- **Confiance** : haute.

### [WS22-03] `MAX_CART_QUANTITY` jamais appliqué côté serveur — P2
- **Fichier** : `src/app/api/cart/route.ts:176, 256` (POST/PATCH) ; constante `src/lib/constants.ts:15`
- **Catégorie** : logique-métier | bug
- **Constat** : la constante `MAX_CART_QUANTITY = 99` n'est importée **ni** par POST **ni** par PATCH. POST n'impose aucun plafond (uniquement `quantity <= 0` rejeté + stock par-delta, cf. WS22-02). PATCH valide `quantity > 0` et `< stock` mais ignore le plafond 99. Un client peut donc fixer une quantité absolue arbitraire jusqu'au stock (et au-delà via POST cumulé).
- **Impact** : valeurs de quantité aberrantes en base/réservation ; incohérence avec l'intention produit (plafond 99). Pas d'exploitation sévère mais intégrité de donnée.
- **Reco** : valider `quantity <= MAX_CART_QUANTITY` dans POST et PATCH (et idéalement via un schéma Zod partagé, cf. WS22-05).
- **Confiance** : haute (la constante n'a aucun import dans les deux handlers).

### [WS22-04] `create_ticket` lie un ticket au compte d'un email **non vérifié** → usurpation d'expéditeur — P2
- **Fichier** : `src/app/api/contact/route.ts:46-51` (route) + RPC `create_ticket` (DB, `20260604130000_tickets_system.sql`)
- **Catégorie** : sécurité | data
- **Constat** : la route transmet l'`email` du body (anonyme, **non vérifié** — par design pour autoriser les tickets sans compte) à `create_ticket`, qui fait `SELECT id INTO v_user_id FROM auth.users WHERE email = p_email` et insère `(user_email, user_id)`. Un anonyme peut donc créer un ticket en se faisant passer pour `victime@x.com` : le message est **attribué au compte de la victime** (`user_id` + `user_email` renseignés), et apparaîtrait dans la vue « mes messages » de la victime (RLS *Users view own messages* matche `user_email`).
- **Impact** : injection de contenu arbitraire dans l'historique de tickets d'un utilisateur tiers + fausse attribution (le staff voit un ticket « de » la victime). Pas de prise de contrôle, mais intégrité/confiance des tickets compromise. Le rate-limit (5/min/IP) borne le volume.
- **Reco** : ne lier `user_id`/`user_email` au compte **que** si l'appelant est authentifié et que l'email correspond à sa session ; pour les tickets anonymes, stocker l'email en clair **sans** résoudre `user_id` (ou marquer `is_verified=false`). Décision transverse route+RPC — à coordonner avec le propriétaire des tickets.
- **Confiance** : moyenne (comportement confirmé par la def RPC + la RLS ; la gravité dépend de l'usage réel de la vue côté `/account`).

### [WS22-05] Validation des bodies cart/wishlist/newsletter ad-hoc, pas de Zod — P3
- **Fichier** : `cart/route.ts:173-181,253-261,332-340` · `wishlist/route.ts:46-56` · `newsletter/route.ts:28-51`
- **Catégorie** : archi | dette
- **Constat** : le repo a centralisé la validation via Zod (`src/lib/schemas.ts`, 20 routes admin) et `ticketCreate` est utilisé par `/api/contact`. Mais les routes panier/wishlist/newsletter valident à la main (`!productId`, `quantity <= 0`, regex email locale `EMAIL_RE`). Pas de bornes sur `quantity` (cf. WS22-03), pas de `z.string().uuid()` sur `productId`/`product_id` (un `productId` non-UUID part vers `.eq('id', …)` → 404 propre, donc bénin, mais incohérent).
- **Impact** : surface de validation hétérogène, plafonds manquants, dérive par rapport à la convention du projet.
- **Reco** : ajouter des schémas `cartItemBody`/`wishlistBody`/`newsletterBody` dans `schemas.ts` (uuid + `quantity` int ∈ [1, MAX_CART_QUANTITY] + email) et `parseBody()`.
- **Confiance** : haute.

### [WS22-06] GET `/api/cart` crée une ligne `carts` + pose un cookie à chaque visite anonyme, sans purge — P2
- **Fichier** : `src/app/api/cart/route.ts:52-60` (`get_or_create_cart` sur un **GET**) + absence de cron de nettoyage
- **Catégorie** : data | perf
- **Constat** : `useCart` (SWR) appelle `GET /api/cart` au mount de quasiment toutes les pages. Pour un visiteur anonyme sans cookie, `resolveCartContext` génère un UUID, **pose le cookie httpOnly**, et `get_or_create_cart` **INSÈRE une ligne `carts`** (vide). Aucun `pg_cron` ne purge les carts anonymes vides/abandonnés (seul `expire_stale_reservations` existe — vérifié : un seul `cron.schedule` dans les migrations).
- **Impact** : croissance non bornée de `carts` (chaque bot/crawler/visiteur unique = 1 ligne) ; pollution du KPI dashboard « paniers actifs » (`_dashboard/data.ts:489` compte les `cart_id` distincts de `cart_items`, donc partiellement protégé, mais la table `carts` enfle). Effet de bord d'écriture sur une requête GET (sémantique HTTP discutable).
- **Reco** : ne créer le cart que sur la **première écriture** (POST/PATCH/reserve), pas sur GET — un GET sans cart connu renvoie un panier vide synthétique. À défaut, ajouter un `pg_cron` qui supprime les `carts` anonymes sans `cart_items` et `updated_at` > N jours.
- **Confiance** : haute (effet de bord confirmé ; absence de cron confirmée).

### [WS22-07] `/api/cart/reserve` utilise `getSession()` au lieu de `getUser()` — P3
- **Fichier** : `src/app/api/cart/reserve/route.ts:30`
- **Catégorie** : sécurité (défense en profondeur)
- **Constat** : la route gate le 401 et le lookup `carts` sur `getSession()` (décode le cookie **sans** valider le JWT auprès du serveur Auth), alors que le reste du repo est passé à `getUser()` (commit `57a92cc`, middleware/requireAdmin). **Non exploitable** : le vrai contrôle est la RPC `create_reservation` qui re-dérive `auth.uid()` en base (JWT validé par PostgREST) et vérifie `carts.id = p_cart_id AND user_id = auth.uid()` (P0004). Un cookie forgé/expiré échouerait au niveau RPC.
- **Impact** : incohérence de pattern + le lookup `carts` intermédiaire s'appuie sur une identité non re-validée (sans conséquence ici, mais fragile si la logique évolue).
- **Reco** : remplacer par `getUser()` pour aligner et garantir la validation JWT au plus tôt.
- **Confiance** : haute.

### [WS22-08] `getClientIp` : le dernier hop de `x-forwarded-for` reste falsifiable hors edge Vercel — P3
- **Fichier** : `src/lib/rateLimit.ts:63-69` (hors périmètre strict mais cœur du rate-limit des routes WS22)
- **Catégorie** : sécurité
- **Constat** : en prod sur Vercel, `x-vercel-forwarded-for` est fiable (posé par l'edge) → OK. Le fallback « dernier hop de `x-forwarded-for` » suppose qu'un proxy de confiance ajoute toujours le hop final ; si l'app est servie **sans** proxy de confiance qui réécrit/append (déploiement non-Vercel, ou si `x-vercel-forwarded-for` venait à manquer), un client peut envoyer `X-Forwarded-For: <ip>` et contrôler le « dernier » hop → bucket de rate-limit renouvelable.
- **Impact** : contournement du rate-limit contact/newsletter hors contexte Vercel-edge. Faible (le déploiement cible **est** Vercel, où le 1er chemin couvre le cas).
- **Reco** : documenter/garder l'hypothèse Vercel ; si un autre runtime est visé, n'utiliser que l'IP de connexion fournie par l'infra de confiance (ne pas dériver d'en-tête client).
- **Confiance** : moyenne (dépend du runtime ; sur Vercel le risque est neutralisé).

### [WS22-09] Cookie `cart_id` sans flag `Secure` — P3
- **Fichier** : `src/app/api/cart/route.ts:28-32`
- **Catégorie** : sécurité (durcissement)
- **Constat** : le cookie est posé `httpOnly: true, sameSite: 'lax'` mais **sans `secure`**, contrairement à `set-locale/route.ts:29` (`secure: production`). Le cookie pourrait théoriquement transiter en clair.
- **Impact** : très faible — HSTS (`Strict-Transport-Security`, `next.config.ts:58`) force HTTPS sur le domaine, et le cookie n'est pas un secret d'auth (juste un identifiant de panier anonyme). Cohérence.
- **Reco** : ajouter `secure: process.env.NODE_ENV === 'production'`.
- **Confiance** : haute.

### [WS22-10] Réponses d'erreur non normalisées via `apiError` (incohérence) — P3
- **Fichier** : tout WS22 sauf `contact/route.ts:103` ; `src/lib/apiError.ts`
- **Catégorie** : dette
- **Constat** : `apiError()` (log serveur + message générique) n'est utilisé **qu'à un seul endroit** (la GET morte de `/api/contact`). Toutes les autres routes inline `logger.error(...)` + `NextResponse.json({ error: '…' }, { status })`. Le comportement final est correct (messages génériques, pas de fuite de `error.message` Postgres), mais le helper conçu pour ça n'est quasi pas adopté.
- **Impact** : duplication, risque qu'une future route oublie de masquer `error.message`. Aucun défaut de sécurité actuel.
- **Reco** : router les 5xx internes via `apiError()` (ou retirer le helper s'il est jugé superflu).
- **Confiance** : haute.

## Points positifs (court)
- **Modèle cart sans IDOR par construction** : identité 100 % dérivée serveur (session/cookie httpOnly), RPC panier `service_role`-only, jamais de `cart_id`/`user_id` client. Le commentaire d'en-tête `cart/route.ts:37-49` documente précisément le contournement RLS et sa justification.
- **CSRF cohérent** : `guardMutation` (origin same-host robuste indépendant de l'env + allowlist + exigence `application/json`) appliqué à **toutes** les mutations (cart POST/PATCH/DELETE, reserve, merge, contact, newsletter, wishlist, preferences).
- **Rate-limit fail-open documenté + IP non-spoofable sur Vercel** ; double opt-in newsletter avec TTL token vérifié à la confirmation.
- **`search/route.ts`** : clamp du `limit` ∈ [1,20], garde `q.length < 2`, échappement correct des wildcards LIKE.
- **`apiError` + `getThemeConfig`** : pas de fuite de détails Postgres au client ; `theme` en `no-store` correctement justifié (revalidateTag n'invalide pas l'edge).

## Signalements hors périmètre (1 ligne chacun, max 5)
- **WS24** : grants table anon/authenticated = ALL (INSERT/UPDATE/DELETE) sur `carts`/`cart_items`/`wishlists`/`profiles`/`reservations`/`contact_messages`/`newsletter_subscribers` → l'unique frontière en accès PostgREST direct est la RLS (IDOR possédé par WS24).
- **WS24** : `carts` policy *Create own cart* (INSERT) a `using=null` et (cf. audit RLS) pas de WITH CHECK → un authenticated en accès direct pourrait INSERT un cart avec `user_id` arbitraire (hors flux app, qui passe en service-role).
- **Login open-redirect (`redirectedFrom`/`next`)** : finding historique à vérifier dans `(auth)/login/page.tsx` + `auth/callback` (hors WS22, ce sont des pages, pas des routes API).
- `next.config.ts:89-94` : `images.remotePatterns` autorise `https://**/**` (tout hôte) — surface SSRF/optimizer large (WS sécu config).
- `merge_anon_cart_to_user` fusionne tout cart d'un `p_anon_id` donné dans le cart de l'appelant : vol d'items possible si un UUID anon victime est deviné (UUID httpOnly → risque négligeable ; défense en profondeur).

## Zones non couvertes / à re-vérifier humainement
- **Usage réel de la vue « mes tickets »** côté `/account` : confirmer si l'attribution forgée (WS22-04) est visible par la victime in-app (sinon impact réduit à la vue admin).
- **Comportement `x-forwarded-for` en prod** : confirmer que `x-vercel-forwarded-for` est toujours présent sur le déploiement Vercel cible (WS22-08) — non testable en lecture de code seule.
- **Volume réel de lignes `carts` orphelines** en base (WS22-06) : un `SELECT count(*) FROM carts WHERE user_id IS NULL` (live) chiffrerait la dette ; non exécuté ici pour rester focalisé code.
- Flux email double opt-in non testé bout-en-bout (nécessite `RESEND_API_KEY` + envoi réel).
