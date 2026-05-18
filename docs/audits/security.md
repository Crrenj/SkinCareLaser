# Audit Sécurité

## Synthèse

Note globale : **Critique — à corriger avant prod**. La défense en profondeur repose presque entièrement sur le middleware Next.js, mais les routes `/api/admin/*` sont explicitement laissées passer par celui-ci alors qu'elles utilisent toutes la `SUPABASE_SERVICE_ROLE_KEY` qui contourne RLS. Conséquence : tout le panneau admin (CRUD produits, marques, tags, bannières, messages, stock, suppression d'images) est accessible **sans authentification** par n'importe quel client capable d'envoyer une requête HTTP.

Trois findings critiques en tête : (1) absence d'auth sur les routes `/api/admin/*` côté serveur (sauf `upload`), (2) panier anonyme — bypass d'autorisation horizontal trivial par manipulation du cookie `cart_id`, (3) le secret `SUPABASE_SERVICE_ROLE_KEY` est présent en clair dans `.env.local` et exposé à l'instant où une route `/api/admin/*` est appelée non authentifiée.

## Findings

### Routes `/api/admin/*` non authentifiées (service-role + middleware bypass) — **Severity: Critical**
**Fichier** : `src/middleware.ts:20` ; `src/app/api/admin/products/route.ts:17-19,94` ; `src/app/api/admin/banners/route.ts:7-9,52,105,160` ; `src/app/api/admin/brands/route.ts:17-19,51` ; `src/app/api/admin/tags/route.ts:34` ; `src/app/api/admin/tag-types/route.ts:36` ; `src/app/api/admin/messages/route.ts:7,60,101` ; `src/app/api/admin/stock/route.ts:130` ; `src/app/api/admin/ranges/route.ts:17-19,60` ; `src/app/api/admin/products/[id]/route.ts:22,180`
**Description** : Le middleware exclut explicitement `/api` (ligne 20 : `if (pathname.startsWith('/api')) return NextResponse.next()`). Aucune des routes `/api/admin/*` (hormis `upload`) ne vérifie l'identité de l'appelant. Toutes instancient un client Supabase avec la `SUPABASE_SERVICE_ROLE_KEY` (qui bypass RLS) et exécutent l'opération demandée sans contrôle.
**Impact** : Un attaquant non authentifié peut :
- `curl -X POST $HOST/api/admin/products -d '{"name":"x","slug":"x","price":0,"description":"<phishing link>"}'` → injecter, modifier, supprimer n'importe quel produit, bannière, message, marque, tag.
- `curl -X DELETE $HOST/api/admin/products/<uuid>` → effacer le catalogue.
- `curl -X PATCH $HOST/api/admin/messages -d '{"id":"<uuid>","status":"archived"}'` → masquer les messages de contact (incidents commerciaux).
- Modifier les prix (`stock` accepte `price` indirectement, mais surtout `/api/admin/products` accepte n'importe quel champ via `...productData`).

**Remediation** :
1. Ajouter en tête de chaque handler une vérification via un client lié à la session de l'appelant :
```ts
const supabase = await createSupabaseServerClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({error:'unauth'}, {status:401})
const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id',user.id).single()
if (!profile?.is_admin) return NextResponse.json({error:'forbidden'}, {status:403})
```
   Effectuer ce check **avant** d'utiliser `supabaseAdmin`.
2. Idéalement, retirer aussi la dérogation `/api` du middleware et le protéger explicitement par pattern (matcher `['/admin/:path*','/api/admin/:path*']`).

---

### `SUPABASE_SERVICE_ROLE_KEY` exposée au format `sb_secret_*` et alias `SUPABASE_SERVICE_KEY` accepté — **Severity: Critical**
**Fichier** : `.env.local:3` ; `src/app/api/admin/products/route.ts:7` (et 9 autres routes admin) ; `src/app/admin/setup/page.tsx:135-137`
**Description** : Le secret service-role est stocké en clair dans `.env.local` (acceptable en local, mais .env.local est exclu via `.gitignore:34`). Cependant le projet copie cette clé sous deux noms (`SUPABASE_SERVICE_KEY` *ou* `SUPABASE_SERVICE_ROLE_KEY`), ce qui complique la rotation et augmente la surface d'erreur. De plus, la page `/admin/setup` (accessible à tout admin, et donc à tout utilisateur via le finding 1) divulgue dans des messages d'erreur dont la clé est présente ou non (`'SUPABASE_SERVICE_KEY ou SUPABASE_SERVICE_ROLE_KEY non configurée'`) — info utile pour un attaquant.
**Impact** : Couplé au finding 1, n'importe quelle requête `/api/admin/*` exécute du code avec service-role. Une `.env.local` partagée par erreur (ex. screenshot, partage Discord, fuite via `.next/server/...`) compromettrait l'ensemble de la base. **La clé actuellement dans `.env.local` (format `sb_secret_***`) a été partagée dans des outputs d'agents Claude pendant cet audit ; elle doit donc être considérée compromise et révoquée immédiatement.**
**Remediation** :
1. Standardiser sur un seul nom (`SUPABASE_SERVICE_ROLE_KEY`) et retirer le fallback `SUPABASE_SERVICE_KEY` (10 endroits).
2. Faire tourner la clé Supabase service-role immédiatement (le secret apparaît littéralement dans `.env.local` versionné dans le contexte de cet audit).
3. Centraliser la création du client admin dans `src/lib/supabaseAdmin.ts` avec un check `if (!key) throw` au boot, plutôt que de répliquer le pattern dans chaque route.
4. En prod, ne plus servir la page `/admin/setup` (ou la planquer derrière une auth solide).

---

### Bypass d'autorisation horizontal sur le panier (`anonymous_id` côté cookie, client anon) — **Severity: High**
**Fichier** : `src/app/api/cart/route.ts:7-14,20,35,164,175-180,227-231` ; `db/schema.sql:539-558,355-374`
**Description** : Le panier anonyme est identifié uniquement par le cookie `cart_id` (UUID v4), positionné par la route serveur avec `httpOnly: false` (ligne 27 : commentaire `Permettre l'accès côté client`). La route serveur utilise le client **anonyme** (NEXT_PUBLIC_SUPABASE_ANON_KEY) et appelle l'RPC `get_or_create_cart`/`add_to_cart`/`remove_from_cart` qui sont déclarées `SECURITY DEFINER` (bypass RLS) et reçoivent l'UUID brut. La policy RLS sur `carts` exige `anonymous_id::text = auth.jwt()->>'anonymous_id'` mais **ce claim n'est jamais set** par l'application (aucun `setJWT`, aucun custom JWT) — la policy ne protège donc rien : tout transite par les RPCs `SECURITY DEFINER` qui n'imposent que la correspondance `cart_id ↔ anon_id` (ligne 362-367 de `schema.sql`), pas l'appartenance à un user.
**Impact** : Si un attaquant connaît ou devine un `cart_id` (UUIDv4 est non énumérable mais peut fuiter via logs ou XSS — cookie non httpOnly !), il peut :
- Lire le contenu du panier (`GET /api/cart` après avoir remplacé son cookie).
- Modifier le contenu d'un autre panier anonyme via `POST /api/cart` puisque `add_to_cart` vérifie seulement que `(p_cart_id, p_anon_id)` correspond (ligne 362) — il suffit d'envoyer les deux valeurs cohérentes obtenues du même cookie volé.
- À l'inverse, `remove_from_cart` n'a aucun check `cart_id`, juste `cart_id IN (SELECT id FROM carts WHERE anonymous_id = p_anon_id)` (`schema.sql:382-386`) — équivalent.

Couplé au cookie `httpOnly: false`, n'importe quel XSS (voir finding 6) exfiltre le cart_id et permet ce takeover.

**Remediation** :
1. Cookie `httpOnly: true` pour `cart_id` (`src/app/api/cart/route.ts:27,125`) — le client n'a besoin que de la route serveur pour interagir avec le panier.
2. Activer un secret HMAC : signer le `cart_id` avec une clé serveur ; ne reconnaître côté serveur que les cart_id signés.
3. Migrer les policies RLS de `carts`/`cart_items` pour qu'elles fonctionnent réellement (set un custom claim ou abandonner la voie JWT et tout faire via RPC `SECURITY DEFINER` *avec* vérification du couple `cart_id↔anon_id` strict).
4. `httpOnly` mis à jour devrait obliger l'utilisation côté client uniquement via les routes API (ce qui est déjà le cas).

---

### Cookie de session Supabase poussé en `localStorage` (fuite cross-XSS, isolation entre profils) — **Severity: High**
**Fichier** : `src/lib/supabaseClient.ts:42-83`
**Description** : Le client browser tente d'abord le cookie, mais en mode navigation privée il bascule sur `localStorage` (`localStorage.setItem('sb-${name}', value)`). Les tokens Supabase (access_token + refresh_token) y sont donc stockés en clair. C'est aussi accessible à tout JS du même origin (XSS = exfiltration immédiate du refresh_token, persistance d'accès même après logout normal). Le commentaire en haut indique que ce code est intentionnel et "ne pas modifier sans autorisation" — c'est précisément ce qu'il faut revoir.
**Impact** : un XSS unique (dans un descriptif produit injecté via l'API admin non protégée, ou via la page contact) suffit à récupérer un access_token admin et à appeler `/api/admin/*` au nom de l'admin. Le refresh_token permet de rester connecté plusieurs jours.
**Remediation** :
1. Supprimer le fallback `localStorage` (lignes 49-52, 76-83, 99-103). Si l'utilisateur est en navigation privée et bloque les cookies, l'app peut afficher un message clair plutôt que dégrader la sécurité.
2. Si on doit absolument supporter ce cas, chiffrer la valeur (mais c'est de la sécurité par obscurité — pas une vraie solution).
3. Combiner avec le finding 6 : ajouter une CSP stricte pour limiter l'impact d'un XSS.

---

### Cookie Supabase posé sans `Secure`, sans `httpOnly`, sans `Path` (côté browser) — **Severity: High**
**Fichier** : `src/lib/supabaseClient.ts:68`
**Description** : Le client browser écrit lui-même les cookies de session via `document.cookie = ${name}=${value}; path=/; ${maxAge}; SameSite=Lax`. Manquent : `Secure` (donc envoyés en HTTP clair si l'utilisateur tombe sur HTTP), `HttpOnly` (impossible depuis JS, mais c'est précisément le problème : les cookies de session Supabase sont accessibles par tout JS). L'utilisation de `document.cookie` côté browser est en soi sub-optimale.
**Impact** : Toute interception réseau (Wi-Fi public, attaque MITM) sur HTTP révèle les tokens. Tout XSS lit les cookies de session via `document.cookie`.
**Remediation** :
1. Laisser le SDK Supabase gérer les cookies via le pattern `@supabase/ssr` standard côté serveur (route handler ou Server Action qui set le cookie en `httpOnly; Secure; SameSite=Lax`).
2. Forcer `Secure` en production : `${process.env.NODE_ENV === 'production' ? 'Secure;' : ''}`.
3. Aligner avec le middleware (`src/middleware.ts:42-43,51-52`) qui pose bien `secure` en prod — paradoxal d'avoir l'un sans l'autre.

---

### Aucune CSRF protection sur les routes mutantes (POST/PATCH/PUT/DELETE) — **Severity: High**
**Fichier** : toutes les routes `/api/admin/*` ; `src/app/api/cart/route.ts:115,202` ; `src/app/api/contact/route.ts:10`
**Description** : Les routes mutantes ne vérifient pas l'origin, n'utilisent pas de token CSRF, et acceptent un `Content-Type: application/json` (souvent traité comme "non-simple" donc préflighté par le navigateur, mais pas une garantie). Le cookie `cart_id` est `SameSite=Lax` (`src/app/api/cart/route.ts:26,124`) — ça atténue certaines attaques GET, mais pas les POST cross-site déclenchés depuis un lien ou un formulaire malveillant.
**Impact** : Couplé au finding 1, un attaquant n'a même pas besoin de CSRF pour les routes admin (puisque non authentifiées). Mais pour `/api/contact`, un attaquant peut faire spammer la base de messages avec n'importe quel email valide via une page tierce (la validation côté backend exige juste un compte existant — voir finding 9).
**Remediation** :
1. Vérifier `request.headers.get('origin')` ou `referer` correspond au domaine de l'app dans toutes les routes mutantes.
2. Activer la protection CSRF native de Next 15 si elle s'applique (Server Actions ont une protection intégrée — préférer les Server Actions aux route handlers pour les mutations admin).
3. Pour les routes API publiques (`/api/contact`), ajouter un rate-limit (voir finding 10).

---

### UUID admin hardcodé dans un handler — **Severity: Medium**
**Fichier** : `src/app/api/admin/messages/route.ts:74`
**Description** : `updateData.replied_by = 'e7bc4c23-a9c8-4551-b212-b6a540af21ed' // Admin UUID`. L'UUID d'un compte admin est embarqué dans le code source.
**Impact** : Toute modification de message via cette route attribue la réponse à cet utilisateur précis, ce qui (a) fausse l'audit interne quand un autre admin répond, (b) divulgue un UUID utilisateur réel dans le repo (utile pour pivoter si jamais une autre vulnérabilité expose l'UUID-vers-email).
**Remediation** :
1. Récupérer l'utilisateur authentifié via `auth.getUser()` (suppose finding 1 corrigé) et utiliser `user.id`.
2. Si l'UUID est vraiment un compte fonctionnel, le déplacer en env var `ADMIN_REPLY_USER_ID`.

---

### Helper `is_user_admin` sans `SET search_path` — **Severity: Medium**
**Fichier** : `db/schema.sql:277-282` (et `handle_new_user:294-306`, `get_or_create_cart:331-352`, `add_to_cart:355-374`, `remove_from_cart:377-388`, `create_contact_message:425-447`, `mark_message_as_read:450-458`, `get_messages_stats:461-478`)
**Description** : Toutes les fonctions `SECURITY DEFINER` du schéma n'ont pas de `SET search_path = public, pg_temp`. C'est l'avertissement classique de Supabase Advisor — un attaquant capable de créer un objet (table, fonction) dans un schéma précédent dans `search_path` peut détourner les appels (`admin_users` → `evil.admin_users`).
**Impact** : Difficile à exploiter directement (il faut déjà un accès écriture au schéma public ou à un schéma earlier dans le search_path), mais c'est un risque latent qui annule le bénéfice de `SECURITY DEFINER`. Notamment `is_user_admin` est la pierre angulaire de toutes les policies RLS (utilisé 15+ fois dans schema.sql).
**Remediation** : Ajouter `SET search_path = public, pg_temp` à toutes les fonctions `SECURITY DEFINER`. Exemple :
```sql
CREATE OR REPLACE FUNCTION public.is_user_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = check_user_id);
$$;
```

---

### `/api/contact` accepte n'importe quel email d'un compte existant (énumération + spam) — **Severity: Medium**
**Fichier** : `src/app/api/contact/route.ts:14-44` ; `db/schema.sql:425-447,588-590`
**Description** : La route POST `/api/contact` est non authentifiée (pas de check de session) ; elle utilise `supabaseAdmin` service-role et délègue à la fonction `create_contact_message` qui (1) cherche l'utilisateur par email (`SELECT id INTO v_user_id FROM auth.users WHERE email = p_email`), (2) si trouvé → crée le message, (3) sinon → renvoie l'erreur `'Email non trouvé...'`. Cette erreur permet d'**énumérer les emails enregistrés** sur la plateforme. La policy RLS `Insert valid email` (ligne 588-590) ferait la même chose mais c'est la fonction RPC qui agit, donc bypassée par service-role.
**Impact** :
1. Énumération d'emails (`POST /api/contact` avec divers emails → "Email non trouvé" ou succès).
2. Spam de la table `contact_messages` : si l'attaquant trouve un email valide, il peut envoyer des milliers de messages sans limite (pas de rate limit, pas de captcha).
3. Spoof d'un autre utilisateur : l'attaquant entre un email qui n'est pas le sien mais qui existe, et envoie un message en son nom (le `user_id` lié dans la table contiendra la vraie victime).
**Remediation** :
1. Exiger une session : `const { data: { user } } = await supabaseServer.auth.getUser(); if (!user) return 401;` Et imposer `p_email === user.email`.
2. Réponse uniforme : ne pas distinguer "email inconnu" de "succès" côté API publique.
3. Ajouter un rate limit (IP + email) et un captcha si la page reste publique.

---

### Recherche `name.ilike.%${search}%` — pseudo-injection PostgREST — **Severity: Low**
**Fichier** : `src/app/api/admin/products/route.ts:60` ; `src/app/api/admin/products/with-tags/route.ts:45` ; `src/app/api/admin/stock/route.ts:68` ; `src/app/api/admin/banners/route.ts:34-35`
**Description** : Le paramètre `search` (string non sanitisée) est interpolé dans `query.or(\`name.ilike.%${search}%,description.ilike.%${search}%\`)`. PostgREST parse cette chaîne avec sa propre grammaire DSL : la présence d'une virgule, parenthèse, ou opérateur dans `search` casse la requête voire injecte une condition. Ce n'est pas une SQL injection classique (le client `@supabase/supabase-js` paramètre la requête réelle), mais ça permet :
- Erreurs 500 sur input bénin (un produit cherché avec virgule).
- Récupération de produits supplémentaires (`search=)&is_active.eq.false,(name.ilike.*`) → peut faire matcher autre chose que prévu, par exemple échapper aux filtres "actifs".
- Dans `banners` (ligne 33-35), `now = new Date().toISOString().split('T')[0]` est sûr, mais le pattern reste préoccupant.

**Impact** : Bas en pratique (admin-only, et le client supabase-js ne permet pas SQL natif), mais signal d'hygiène faible.
**Remediation** :
1. Escape les caractères PostgREST spéciaux (`,`, `(`, `)`, `*`, `:`) ou rejeter les valeurs contenant ces caractères.
2. Préférer `.ilike('name', \`%${escapeLike(search)}%\`).or('description.ilike.' + ...)` séparément, ou utiliser `textSearch` Postgres avec un index `tsvector`.

---

### Upload sans validation MIME / chemin contrôlé côté serveur — **Severity: Medium**
**Fichier** : `src/app/api/admin/upload/route.ts:41-50` ; `src/components/admin/ImageUpload.tsx:52` ; `src/components/admin/DirectImageUpload.tsx:48` ; `src/app/api/admin/products/route.ts:127-138`
**Description** :
1. `/api/admin/upload` reçoit `fileName` depuis le body et le passe directement à `.upload(fileName, ...)`. Aucune validation : un appelant authentifié admin (ou non, voir finding 1) peut écrire `../../something.png` ou `../brands/legit.png` et écraser une image existante. Le bucket Supabase Storage normalise certains chemins, mais le pattern est dangereux.
2. Le `contentType` provient aussi du body et est utilisé tel quel. Le bucket impose `image/png,jpeg,jpg,webp` (schema.sql:254) — ok, mais le serveur ne re-valide pas.
3. `src/app/api/admin/products/route.ts:135-138` force `contentType: 'image/png'` quelle que soit l'image fournie en base64 (même chose pour edit ligne 84). Un fichier base64 contenant un script et envoyé avec extension `.png` finit servi par Storage en `image/png`, donc non exécutable côté serveur, mais peut tromper certains workflows.

**Impact** : Écrasement d'images légitimes (defacement catalogue), pollution du bucket public.
**Remediation** :
1. Reconstruire `fileName` côté serveur à partir de `productSlug` validé (regex `[a-z0-9-]+`) + nom hashé.
2. Valider le MIME via la magic number du buffer (ex. `file-type` npm), pas seulement la chaîne fournie.
3. Limiter explicitement la taille post-décodage : `if (imageBuffer.length > 5*1024*1024) return 413`.

---

### Open redirect interne via `sessionStorage.redirect_to` — **Severity: Low**
**Fichier** : `src/app/(auth)/login/page.tsx:57,107` ; `src/app/auth/callback/page.tsx:53-56`
**Description** : Le paramètre `redirectedFrom` (URL search param) est stocké dans `sessionStorage` puis utilisé tel quel par `router.push(redirectPath)` après login. Next router refuse les URLs externes (https://…), mais pas les chemins internes. Un attaquant peut fabriquer un lien `/login?redirectedFrom=/admin/setup`, l'envoyer à un admin qui pense aller au login normal, et le router le redirige vers une page sensible après authentification. Combiné avec un faux flow, ça peut servir de phishing.
**Impact** : Faible (toutes les destinations sont sur le même domaine), mais peut être utilisé pour des attaques UX (redirect vers une page d'admin spécifique pour faire croire à une action).
**Remediation** : Whitelister les chemins de redirection (regex `^/(admin/[a-z-/]+|catalogue|product/.*)$`) avant le `router.push`.

---

### `httpOnly: false` et acceptation aveugle du `cart_id` côté serveur — **Severity: Medium**
**Fichier** : `src/app/api/cart/route.ts:27,125`
**Description** : Le cookie `cart_id` est posé avec `httpOnly: false` explicitement (commentaire "Permettre l'accès côté client"). Or, **aucun code client ne le lit côté JS** : tout passe par `/api/cart`. L'option est inutile et expose le cookie à toute exfiltration XSS. C'est le vecteur principal du finding 3.
**Impact** : Toute XSS = vol du cart_id = takeover du panier (voir finding 3).
**Remediation** : Passer `httpOnly: true` (lignes 27 et 125). Si jamais un composant client en a besoin, exposer l'info via une route serveur qui le filtre.

---

### Pas de rate-limiting ni d'instrumentation des routes publiques — **Severity: Medium**
**Fichier** : `src/app/api/contact/route.ts:10` ; `src/app/api/cart/route.ts:17,115,202` ; absence de middleware de throttle global
**Description** : Aucun rate-limit. Routes ouvertes à l'internet :
- `/api/contact` POST → spam de messages (couplé au finding 9 = énumération).
- `/api/cart` POST → création illimitée de carts en BD (table grossit, attaque DoS BDD).
- Routes `/api/admin/*` non auth (finding 1) → l'attaquant peut DoS toute la BD via service-role qui bypass RLS.
**Impact** : Coûts Supabase qui explosent, DoS applicative possible (Postgres saturé).
**Remediation** :
1. Ajouter `@upstash/ratelimit` ou équivalent en middleware/route.
2. Cap explicite par IP (ex. 20 req/min sur `/api/contact`, 60 req/min sur `/api/cart`).
3. Activer les logs Supabase + alerte de pic.

---

### `description` produit affichée en texte brut (pas de XSS direct), mais entrée non validée côté API — **Severity: Info**
**Fichier** : `src/components/ProductDetailCard.tsx:78` ; `src/app/api/admin/products/route.ts:152-157` ; `src/app/api/admin/products/[id]/route.ts:102-110`
**Description** : Le rendu de la description (`{product.description}` ligne 78) est interpolé par React, donc échappé par défaut — pas de XSS direct. **Mais** la création/édition produit (POST/PATCH `/api/admin/products`) accepte tous les champs via `...productData` et `...updateData` (spread sans liste blanche). Couplé au finding 1, un attaquant non auth peut écrire dans n'importe quel champ de `products` (y compris `is_active`, `currency`, `slug`, `image_url`, `stock`). Aucun XSS, mais data integrity nulle.
**Impact** : Pas d'XSS, mais corruption massive du schéma possible (modifier `currency='XX'`, `is_active=false` partout, etc.).
**Remediation** :
1. Définir explicitement la liste des champs autorisés : `const ALLOWED = ['name','slug','price','currency','description','stock','is_active']` et construire `productData` à partir d'un `pick(body, ALLOWED)`.
2. Valider avec Zod en entrée (`z.object({ name: z.string().max(200), price: z.number().nonnegative(), ... })`).

---

## Recommandations prioritaires

1. **(Critique)** Avant tout déploiement non-local, ajouter une vérification d'identité dans **chaque** route `/api/admin/*` (récupérer la session via `createSupabaseServerClient` puis check `admin_users.user_id = auth.uid()` *avant* d'instancier le client service-role). Mettre à jour le matcher du middleware pour couvrir `/api/admin/:path*`. Sans ça, les findings 4, 5, 7, 12, 14, 15 sont accessibles à des attaquants anonymes.
2. **(Critique)** Faire tourner immédiatement `SUPABASE_SERVICE_ROLE_KEY` (la valeur visible dans `.env.local:3` doit être considérée compromise par cet audit) et centraliser sa lecture dans `src/lib/supabaseAdmin.ts` avec un check de présence au boot.
3. **(Haute)** Passer `cart_id` en `httpOnly: true`, supprimer le fallback `localStorage` des tokens Supabase (`src/lib/supabaseClient.ts:49-103`), et durcir les cookies côté browser (`Secure` en prod).
4. **(Haute)** Authentifier `/api/contact` (session obligatoire, email = user.email), aligner la réponse pour ne pas leak l'existence des emails, ajouter un rate-limit IP-based (ex. Upstash).
5. **(Moyenne)** Ajouter `SET search_path = public, pg_temp` à toutes les fonctions `SECURITY DEFINER` (`db/schema.sql`). Audit avec `mcp__supabase__get_advisors` pour vérifier ce que Supabase signale.
6. **(Moyenne)** Mettre en place une validation Zod + listes blanches sur tous les body POST/PATCH côté API admin (spread `...productData` est à proscrire).
7. **(Moyenne)** Ajouter une CSP stricte via `next.config.ts` (`default-src 'self'; script-src 'self'`) pour limiter l'impact d'un éventuel XSS.
8. **(Basse)** Whitelister les destinations de redirection après login (parser `redirectedFrom` côté serveur, autoriser uniquement les chemins internes connus).
9. **(Hygiène)** Retirer l'UUID admin hardcodé dans `src/app/api/admin/messages/route.ts:74`. Migrer vers `auth.uid()`.
10. **(Hygiène)** Re-tester la chaîne complète login → cookies → middleware → admin layout sur navigation privée *après* avoir simplifié `src/lib/supabaseClient.ts` — la complexité actuelle vient d'avoir tout entassé pour contourner des cas particuliers, et c'est précisément cette complexité qui crée les vulnérabilités 4-5-13.
