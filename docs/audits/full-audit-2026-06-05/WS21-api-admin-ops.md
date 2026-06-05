# WS21 — API admin (opérations)

**Périmètre** : `src/app/api/admin/{reservations,messages,stock,sidebar-stats,newsletter,newsletter/[id],posts,users,users/[id],admins,appearance,settings,set-locale}/route.ts`
**Fichiers lus** : 13 routes + 4 helpers (`requireAdmin`, `schemas`, `apiError`, `csrf`, `supabaseAdmin`) + recoupements DB (baseline, tickets migration, posts/newsletter migrations) + chemin de rendu blog (`blog/[slug]/page.tsx`)
**Fichiers lus** : ~17 · **Lignes parcourues (approx.)** : ~1 250
**Synthèse** : P0=0 · P1=1 · P2=5 · P3=4

> Recoupements clés effectués : matrice d'authz par route/méthode (toutes gardées), CHECK constraints `contact_messages`, `body` blog assaini **au rendu** (DOMPurify), CSRF centralisée dans `requireAdmin`. Verdict global : surface **saine**, aucune faille d'authz/IDOR. Les constats sont surtout de la robustesse/validation côté admin (acteur de confiance) + une fuite PII modérée à l'export newsletter.

---

## Findings

### [WS21-01] Export CSV newsletter divulgue l'IP des abonnés (PII) — P1
- **Fichier** : `src/app/api/admin/newsletter/route.ts:32,53-62` (SELECT `..., ip` + colonne `ip` dans le CSV) ; JSON aussi : `:32` renvoie `ip` dans `subscribers`
- **Catégorie** : sécurité | data
- **Constat** : la route sélectionne et exporte la colonne `ip` des `newsletter_subscribers` (capturée à l'inscription) dans le CSV téléchargeable **et** dans la réponse JSON listant les abonnés. L'IP est une **donnée personnelle** (RGPD / loi RD 172-13 sur la protection des données). Elle n'a aucune utilité opérationnelle pour la gestion newsletter et se retrouve dans un fichier exporté qui peut circuler hors du système.
- **Impact** : exfiltration triviale d'un dataset email↔IP (corrélation d'identité, géolocalisation grossière) dès qu'un export CSV fuite ou qu'un compte admin est compromis. Augmente l'exposition réglementaire pour un bénéfice nul.
- **Reco** : retirer `ip` du `select` (l.32), de l'entête + des lignes CSV (l.51-62), et du payload JSON. Si une trace anti-abus est nécessaire, la garder en DB sans jamais l'exporter, ou ne l'exposer qu'agrégée. Confiance **haute** sur le fait que c'est de la PII exportée ; sévérité P1 (fuite réelle mais derrière auth admin).

### [WS21-02] Pagination `/api/admin/messages` cassée : `total`/`totalPages` toujours 0 — P2
- **Fichier** : `src/app/api/admin/messages/route.ts:24,32,46-47`
- **Catégorie** : bug
- **Constat** : la requête fait `.select('*')` **sans** l'option `{ count: 'exact' }`, mais la réponse lit `count` (l.32) et calcule `total: count || 0` / `totalPages: Math.ceil((count||0)/limit)` (l.46-47). PostgREST ne renvoie `count` que si on le demande → `count` est **toujours `null`** → `total = 0` et `totalPages = 0`. Le contraste est net avec `posts/route.ts:21` qui fait correctement `.select('*', { count: 'exact' })`.
- **Impact** : l'UI de pagination des tickets de support ne connaît jamais le nombre total → impossible de naviguer au-delà de la page 1 / compteur faux. Sur une boîte de support qui grossit, les anciens tickets deviennent inaccessibles via cette liste.
- **Reco** : `\.select('*', { count: 'exact' })`.
- **Confiance** : haute.

### [WS21-03] `page`/`limit` non bornés sur `messages` GET et `posts` GET (NaN / offset négatif / fetch non borné) — P2
- **Fichier** : `src/app/api/admin/messages/route.ts:18-20` · `src/app/api/admin/posts/route.ts:16-18`
- **Catégorie** : bug | perf
- **Constat** : `page`/`limit` sont passés par `parseInt(... || '1')` sans clamp. `parseInt('abc')` → `NaN` (offset `NaN`), `page=0` → `offset = -limit` (PostgREST `.range(négatif, …)` → erreur 500), `limit=100000` → fetch potentiellement énorme. Aucune borne basse ni haute. Les routes voisines `newsletter/route.ts:27` et `users/route.ts:28-29` clampent pourtant via `Math.min/Math.max` — incohérence interne.
- **Impact** : 500 facile sur entrée malformée (mauvaise UX, bruit de logs) ; `limit` non plafonné = risque perf/mémoire (admin authentifié, donc DoS limité, mais réel). 
- **Reco** : aligner sur le pattern existant : `const page = Math.max(1, Number(...) || 1)` et `const limit = Math.min(MAX, Math.max(1, Number(...) || DEFAULT))`.
- **Confiance** : haute.

### [WS21-04] `messages` GET : query param `status` non validé, passé brut à `.eq('status', status)` — P2
- **Fichier** : `src/app/api/admin/messages/route.ts:17,28-29`
- **Catégorie** : bug | data
- **Constat** : `status` est lu du query string sans contrôle d'appartenance à l'enum `('open','in_progress','resolved','closed')` (cf. CHECK `contact_messages_status_check`, migration `20260604130000`) puis injecté dans `.eq('status', status)`. Pas une faille d'injection (PostgREST paramétrise la valeur), mais toute valeur hors-enum renvoie silencieusement **0 résultat** au lieu d'un 400 explicite. À noter aussi : la migration tickets a migré les statuts vers `open/in_progress/resolved/closed`, alors que la même route **écrit** ces valeurs via `messagePatch` (validé) — la lecture, elle, accepte n'importe quoi.
- **Impact** : filtre silencieusement vide en cas de désynchronisation front/back ou d'appel API direct ; debugging trompeur. Faible.
- **Reco** : valider `status` contre `TICKET_STATUSES` (déjà exporté dans `schemas.ts:115`) ou ignorer la valeur si hors-enum.
- **Confiance** : haute.

### [WS21-05] Transitions de statut réservation : `confirmed_at`/`collected_at` jamais réinitialisés en cas de retour arrière — P2
- **Fichier** : `src/app/api/admin/reservations/route.ts:196-200`
- **Catégorie** : data | logique-métier
- **Constat** : sur PATCH, on **pose** `confirmed_at` quand `status='confirmed'` et `collected_at` quand `status='collected'`, mais on ne les **efface jamais**. Si un admin repasse une réservation `collected` → `cancelled`/`pending`/`expired` (ou `confirmed` → `pending`), `collected_at`/`confirmed_at` restent renseignés alors que l'état ne le justifie plus. Les timestamps deviennent des « horodatages fantômes ». De plus le schéma `reservationPatch` autorise n'importe quelle transition (pas de machine à états) — un saut `pending` → `collected` poserait `collected_at` mais laisserait `confirmed_at` nul.
- **Impact** : incohérence de données (une réservation `cancelled` avec `collected_at` non nul), reporting/analytics faussés, confusion opérateur. Pas une corruption bloquante.
- **Reco** : à l'écriture, dériver explicitement les deux timestamps depuis le statut cible (poser **ou** remettre à `null`), p.ex. `confirmed_at = (statut ∈ {confirmed,collected}) ? now/conservé : null` ; idéalement valider les transitions autorisées.
- **Confiance** : moyenne (dépend des transitions réellement permises par l'UI `/admin/reservations`, mais l'API les autorise toutes).

### [WS21-06] Réponses d'erreur non normalisées via `apiError` → fuite de `error.message` Postgres — P2
- **Fichier** : `src/app/api/admin/reservations/route.ts:139,161` · `src/app/api/admin/messages/route.ts` (catchs génériques OK mais `apiError` mélangé) · `src/app/api/admin/newsletter/route.ts:47` & `newsletter/[id]/route.ts:29` (codes en dur) · `users/[id]/route.ts:73,86`
- **Catégorie** : sécurité | dette
- **Constat** : `apiError` (helper dédié, l.15-22) existe précisément pour ne JAMAIS renvoyer `error.message` brut (qui divulgue noms de tables/colonnes/contraintes Postgres). Or `reservations` POST renvoie `insertError?.message` (l.139) et `itemsError.message` (l.161) **directement au client**. Incohérence : la même route utilise `apiError` ailleurs (l.59,219). Effet inverse côté newsletter : codes opaques (`select_failed`, `delete_failed`, `list_failed`) au lieu d'un message FR cohérent avec le reste — dette de normalisation, pas une fuite.
- **Impact** : (reservations) divulgation d'internes DB à un client en cas d'erreur d'insert/contrainte. Atténué par le fait que l'appelant est admin, mais c'est exactement le pattern que `apiError` doit fermer (commit `b686366` « normalisation erreurs Pattern B » incomplet ici).
- **Reco** : remplacer les deux `NextResponse.json({ error: ...message }, 500)` de `reservations` par `apiError('Erreur lors de la création', insertError, 500)`. Optionnel : uniformiser newsletter sur `apiError`.
- **Confiance** : haute (fuite reservations) / moyenne (cohérence newsletter).

### [WS21-07] `stock` GET : `.or(\`name.ilike.%${search}%\`)` — interpolation brute + `.or()` superflu — P3
- **Fichier** : `src/app/api/admin/stock/route.ts:44`
- **Catégorie** : sécurité | dette
- **Constat** : `search` (query param non échappé) est interpolé dans une chaîne de filtre PostgREST `.or()`. Les méta-caractères PostgREST (`,` `(` `)` `*`) dans `search` peuvent altérer la sémantique du filtre (filter-injection PostgREST classique). Ici l'acteur est un admin et `products` est de toute façon entièrement lisible en service-role → impact pratique quasi nul, mais c'est un pattern fragile répliqué dans `products`/`with-tags`. Accessoirement, `.or()` avec **une seule** condition est inutile : un `.ilike('name', \`%${search}%\`)` (valeur paramétrée, donc non injectable) serait plus sûr et plus clair.
- **Impact** : faible (admin de confiance) ; surtout dette/incohérence avec `newsletter`/`users` qui filtrent proprement (`.ilike(...)` ou filtrage en mémoire).
- **Reco** : `query = query.ilike('name', \`%${search}%\`)`.
- **Confiance** : haute.

### [WS21-08] `messagePatch.replied_at` = `z.string()` libre, écrit tel quel dans une colonne TIMESTAMPTZ — P3
- **Fichier** : `src/lib/schemas.ts:125` (schéma) consommé par `messages/route.ts:86-88`
- **Catégorie** : bug | data
- **Constat** : `replied_at: z.string().optional()` n'impose aucun format datetime ; la valeur est passée directement à `.update({ replied_at })` sur une colonne `TIMESTAMPTZ`. Une chaîne non-date (`"x"`) provoque une **erreur Postgres 500** plutôt qu'un 400 de validation. Par ailleurs c'est un horodatage **fourni par le client** (le serveur pourrait le poser lui-même comme il le fait déjà pour `replied_by = auth.userId` à la l.88, et comme `reservations` fait `new Date().toISOString()`).
- **Impact** : 500 sur input malformé ; horodatage potentiellement incohérent (le client peut envoyer une date arbitraire). Très faible (admin).
- **Reco** : soit `z.string().datetime()`, soit — mieux — ignorer la valeur client et poser `replied_at = new Date().toISOString()` côté serveur quand le statut passe à `resolved`/`closed`.
- **Confiance** : haute.

### [WS21-09] `reservationPatch` / `messagePatch` : tous les champs `.optional()` sans `.refine()` « au moins un » — P3
- **Fichier** : `src/lib/schemas.ts:119-126` (`messagePatch`), `137-141` (`reservationPatch`)
- **Catégorie** : dette | bug (bénin)
- **Constat** : un body `{ id }` seul passe la validation Zod (tous les autres champs sont optionnels). `reservations` PATCH rattrape ça avec `Object.keys(updateData).length === 0 → 400` (l.206) ; `messages` PATCH **ne le rattrape pas** : il construira un `updateData` ne contenant que `updated_at` (l.78-79) et exécutera un UPDATE no-op (bump `updated_at` sans autre changement). Inoffensif mais c'est un effet de bord silencieux.
- **Impact** : `updated_at` d'un ticket peut bouger sans modification réelle (tri « récents » faussé). Négligeable.
- **Reco** : ajouter un `.refine()` « au moins un champ utile » sur `messagePatch` (le pattern `reservations` est déjà correct côté route).
- **Confiance** : haute.

### [WS21-10] `userPatch` (schemas.ts:173-175) semble mort — supplanté par le schéma inline `userAdminPatch` — P3
- **Fichier** : `src/lib/schemas.ts:173-175`
- **Catégorie** : dette (code mort)
- **Constat** : `export const userPatch = z.object({ is_admin: z.boolean().optional() })`. La route `users/[id]/route.ts` définit son **propre** schéma inline `userAdminPatch` (`{ isAdmin?, role? }`, l.8-15) et n'importe pas `userPatch`. `grep -rn "userPatch\b" src/` ne renvoie que la définition (aucun import/usage). Le champ `is_admin` (snake_case) ne correspond même plus au contrat actuel `isAdmin` (camelCase).
- **Impact** : confusion (deux conventions de nommage), risque qu'un futur dev recâble le mauvais schéma. Nul à l'exécution.
- **Reco** : supprimer `userPatch` ou le réutiliser dans la route (préférer un schéma unique partagé).
- **Confiance** : haute (grep complet sur `src/`).

---

## Points positifs (court)
- **Authz exhaustive et correcte** : chaque route × chaque méthode appelle `requireAdmin()` ; `users/[id]` PATCH passe bien par `requireSuperAdmin()`. Garde CSRF (Origin) centralisée dans `requireAdmin`/`requireSuperAdmin`, donc appliquée même aux GET — propre.
- **Garde-fous super-admin solides** : anti-auto-modification (`cannot_modify_self`, l.58) **et** anti-modification d'un autre super_admin (`cannot_modify_super_admin`, l.63-66) côté **serveur**, pas seulement masquage UI. Conforme à l'intention documentée.
- **Posts** : `body` HTML assaini **au rendu** via `DOMPurify.sanitize(post.body)` (`blog/[slug]/page.tsx:113`) ; stockage brut + assainissement à la lecture est un choix défendable et effectivement appliqué. Validation Zod sur les 4 méthodes, gestion propre du `23505` (slug dupliqué → 409), `published_at` dérivé serveur.
- **Validation** : `set-locale` valide `locale ∈ {fr,es,en}` (`setLocaleBody`) et consomme `parsed.data` (pas de déstructuration du body brut) ; `appearance`/`settings` PATCH passent par allowlist Zod / liste de champs explicite + `revalidateTag('shop-theme-config')` correct ; `settings` protège le NOT NULL `shop_name` ; `stamped` `updated_by`/`replied_by` depuis la session serveur.
- **Reservations POST** : snapshot prix/nom figés + rollback best-effort de la réservation orpheline si l'insert des items échoue (bonne hygiène en l'absence de transaction PostgREST).

## Signalements hors périmètre (1 ligne chacun, max 5)
- `src/app/api/admin/products/route.ts:38` & `with-tags/route.ts:35` répliquent le même `.or(\`name.ilike.%${search}%,...\`)` à interpolation brute (cf. WS21-07) — à traiter avec WS20.
- `set-locale` pose le cookie `httpOnly:false` (l.27) — nécessaire car relu côté client, mais aucune donnée sensible dedans ; à confirmer côté WS23/middleware i18n.
- `messages` GET fait un `get_messages_stats()` RPC à chaque appel paginé (1 requête de plus par page) — micro-coût, à voir avec WS22 si la sidebar/poll est agressive.

## Zones non couvertes / à re-vérifier humainement
- **Transitions de statut réservation autorisées par l'UI** (`/admin/reservations`) : WS21-05 suppose que des retours arrière sont possibles ; à confirmer côté composant client (hors périmètre) pour calibrer la sévérité.
- **Conformité RGPD/loi 172-13 de la rétention d'IP newsletter** (WS21-01) : la décision de garder/supprimer la colonne `ip` relève d'un arbitrage produit/juridique, pas seulement technique.
- **Comportement réel de `.range()` avec offset négatif/NaN** selon la version PostgREST déployée (WS21-03) : non exécuté (audit lecture seule) — à valider en intégration.
