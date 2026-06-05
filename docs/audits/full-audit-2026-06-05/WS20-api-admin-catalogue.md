# WS20 — API admin (catalogue)

**Périmètre** : `src/app/api/admin/{products/route.ts, products/[id]/route.ts, products/with-tags/route.ts, brands/route.ts, brands/[id]/route.ts, ranges/route.ts, ranges/[id]/route.ts, tags/route.ts, tags/[id]/route.ts, tag-types/route.ts, tag-types/[id]/route.ts, upload/route.ts, banners/route.ts, banners/stats/route.ts, home-layout/route.ts}`
**Fichiers lus** : 15 routes + 6 dépendances (`requireAdmin.ts`, `csrf.ts`, `apiError.ts`, `supabaseAdmin.ts`, `schemas.ts`, form client `product/page.tsx` + `_lib/types.ts` + `_components/ProductFormModal.tsx`) · **Lignes parcourues (approx.)** : ~1450
**Synthèse** : P0=0 · P1=2 · P2=5 · P3=4

> Contrôle clé OK : **`requireAdmin()` est présent sur CHAQUE méthode exportée de CHAQUE route** (GET/POST/PATCH/PUT/DELETE) — vérifié ligne par ligne. `requireAdmin()` inclut une garde CSRF par Origin centralisée (`assertOriginFromHeaders`) appliquée même aux GET. Aucune route non gardée. Aucun secret exposé. `supabaseAdmin` (service-role) est l'unique client utilisé, cohérent.

## Findings

### [WS20-01] `POST /api/admin/products` : Zod contourné (déstructure le `body` BRUT) + schéma `.passthrough()` ⇒ mass-assignment & prix/stock NON validés — P1
- **Fichier** : `src/app/api/admin/products/route.ts:79-83,130-138` ; schéma `src/lib/schemas.ts:164-171`
- **Catégorie** : sécurité / data / logique-métier
- **Constat** : la route valide (`parseBody(productCreate, body)`) mais déstructure ensuite **`body`** (la valeur brute) et non `parsed.data` :
  ```ts
  const parsed = parseBody(productCreate, body)
  if (!parsed.ok) return parsed.response
  const { brand_id, range_id, selectedTags, imageFile, ...productData } = body   // ← body, pas parsed.data
  ...
  .insert({ ...productData, currency: productData.currency || DEFAULT_CURRENCY, range_id: effectiveRangeId })
  ```
  Aggravant : `productCreate` est `.passthrough()` (schemas.ts:171) et **ne type ni `price`, ni `stock`, ni `is_active`** ; il ne valide que `name`/`slug` (strings) + quelques UUID optionnels. Conséquence : **aucune** validation de `price`/`stock` (un `price: "abc"` ou négatif, un `stock: -5` ou non-entier passe Zod), et tout champ supplémentaire de `products` est écrit tel quel (`is_active`, `is_featured`, `is_new`, `old_price`, et même `id`/`created_at`/`updated_at` qui sont des colonnes réelles — cf. live DB).
- **Impact** : un admin (compromis, ou simple erreur de payload) peut injecter des valeurs arbitraires/typées-faux dans `products` : prix non numérique (le `CHECK price >= 0` côté PG attrape le négatif mais pas la confusion de type sur d'autres champs), écrasement de `id`/`created_at`, activation/mise en avant non voulue. Pas d'auth-bypass (route admin-only) → P1, pas P0 ; mais c'est une vraie faiblesse d'intégrité + le « piège » exact annoncé au brief. Le `productData.currency` lu (ligne 134) confirme qu'on lit le body brut — le formulaire n'envoie jamais `currency`.
- **Reco** : déstructurer `parsed.data` au lieu de `body` ; **retirer `.passthrough()`** de `productCreate` et y typer explicitement les champs autorisés (`price: z.number().nonnegative()`, `stock: z.number().int().min(0)`, `description`, `volume`, `benefits`, `is_active`/`is_featured`/`is_new` en `boolean().optional()`, etc.), en interdisant `id`/`created_at`/`updated_at`. Allowlist de colonnes plutôt que spread.
- **Confiance** : haute

### [WS20-02] `PATCH /api/admin/products/[id]` : AUCUNE validation Zod + mass-assignment direct + écriture d'`image_url` (colonne droppée) — P1
- **Fichier** : `src/app/api/admin/products/[id]/route.ts:16-106`
- **Catégorie** : sécurité / data / bug
- **Constat** : la route ne fait **aucun** `parseBody` (contrairement à toutes les autres routes du périmètre). Elle déstructure le body brut et fait `update({ ...updateData, updated_at: ... }).eq('id', id)` (lignes 64-72). N'importe quelle clé envoyée est écrite : `price`, `stock`, `is_active`, `is_featured`, `slug`, et toute colonne arbitraire — sans contrôle de type ni de présence. De plus, lorsqu'une `imageFile` est fournie (lignes 21-62), le code pose `productData.image_url = publicUrl` puis sépare `const { image_url, ...updateData } = productData` (ligne 64) : `image_url` est exclu de l'`update` produits (bien), MAIS si le **client** envoie directement un champ `image_url` dans le body (sans `imageFile`), il est extrait en ligne 64 et déclenche le bloc lignes 82-89 (delete+insert dans `product_images`) — comportement non documenté/non validé. La colonne `products.image_url` n'existe plus en base (droppée, migration 2026-05-22) ; la logique repose entièrement sur cette extraction implicite.
- **Impact** : intégrité produit (modification de champs non destinés à l'édition par un payload forgé d'admin), pas de garde-fou type/plage sur `price`/`stock`, divergence avec le contrat de toutes les autres routes admin (qui valident). Risque d'erreur 500 opaque si un champ inattendu n'existe pas comme colonne (PostgREST rejette). P1 (admin-only).
- **Reco** : introduire un `productUpdate` Zod (mêmes champs typés que WS20-01, tous `.optional()`, `id` interdit dans le body puisqu'il vient de `params`), déstructurer `parsed.data`, et expliciter la gestion image (champ dédié, pas une extraction implicite d'`image_url`).
- **Confiance** : haute

### [WS20-03] `POST /api/admin/tag-types` & `DELETE /api/admin/tag-types/[id]` : fuite de `error.message` Postgres au client — P2
- **Fichier** : `src/app/api/admin/tag-types/route.ts:60` ; `src/app/api/admin/tag-types/[id]/route.ts:68`
- **Catégorie** : sécurité
- **Constat** : `return NextResponse.json({ error: typeError.message }, { status: 500 })` (création) et `{ error: checkError.message }` (delete) renvoient le message Postgres brut au client, contournant la normalisation `apiError` utilisée partout ailleurs. `apiError`/`apiError.ts:6-13` documente explicitement que `error.message` peut divulguer noms de tables/colonnes/contraintes. Idem côté `tag_types` POST le `tagError` du tag initial n'est pas remonté (volontaire, OK), mais le `typeError.message` l'est.
- **Impact** : divulgation d'internes de schéma (noms de contraintes/colonnes) à un acteur ayant la session admin — surface d'information pour pivoter. Incohérent avec le durcissement « Pattern B » du commit `b686366`.
- **Reco** : remplacer par `return apiError('Erreur serveur', typeError, 500)` (resp. `checkError`), comme le reste du fichier le fait déjà aux lignes 37/82.
- **Confiance** : haute

### [WS20-04] `[id]` jamais validé comme UUID sur les 5 routes paramétrées — P2
- **Fichier** : `products/[id]/route.ts:18`, `brands/[id]/route.ts:18`, `ranges/[id]/route.ts:18`, `tags/[id]/route.ts:19`, `tag-types/[id]/route.ts:19`
- **Catégorie** : bug / data
- **Constat** : `const { id } = await params` est passé tel quel à `.eq('id', id)` / `.delete()` sans validation `z.string().uuid()`. Les routes `brands`/`ranges` font un SELECT de pré-existence (renvoie 404 propre), mais `products/[id]` (PATCH+DELETE) et `tags/[id]` (PATCH+DELETE) n'en font pas : un `id` non-UUID part directement en requête PostgREST sur une colonne `uuid` → erreur 500 (cast `invalid input syntax for type uuid`) au lieu d'un 400/404 propre. `tag-types/[id]` DELETE idem sur le SELECT `tags`.
- **Impact** : 500 opaques sur entrées malformées (mauvaise robustesse / bruit de logs), pas d'exploit (PostgREST paramétré, pas d'injection SQL). Risque faible mais réel d'erreur non gérée.
- **Reco** : valider `id` via `z.string().uuid().safeParse(id)` en tête de chaque handler paramétré → 400 si invalide, avant toute requête DB.
- **Confiance** : haute

### [WS20-05] `DELETE /api/admin/upload?path=...` : suppression Storage arbitraire (path non contraint) — P2
- **Fichier** : `src/app/api/admin/upload/route.ts:104-116`
- **Catégorie** : sécurité / data
- **Constat** : le DELETE prend `path` directement depuis la query (`searchParams.get('path')`) et appelle `supabaseAdmin.storage.from('product-image').remove([path])` sans aucune validation. Contraste fort avec le POST, très bien durci (magic-bytes, taille, extension, **chemin généré côté serveur** `folder/uuid.ext` pour éviter la traversée). Le DELETE annule cette discipline : un admin peut supprimer **n'importe quel objet** du bucket `product-image` (toutes images produits/blog/bannières), ou un `path` arbitraire. Aucune vérification que le path appartient bien à une ressource gérée.
- **Impact** : un admin (ou un CSRF échappant à la garde Origin — atténué mais la garde Origin n'exige pas de Content-Type sur ce GET-like DELETE sans body) peut purger des assets du bucket. Pas de perte hors-bucket (scope `product-image`), donc P2, mais c'est une primitive de destruction non bornée incohérente avec le POST.
- **Reco** : restreindre `path` à `^(products|blog|banners)/[0-9a-f-]+\.(png|jpg|webp)$` (le format que le POST génère) ; rejeter tout `..`/`/` initial. Optionnellement vérifier que l'URL est référencée par un `product_images.url` avant suppression.
- **Confiance** : moyenne (admin-gated ; la sévérité dépend du modèle de menace admin)

### [WS20-06] `productCreate.imageFile` / upload produit hérité non borné (taille/type/magic-bytes) — P2
- **Fichier** : `src/app/api/admin/products/route.ts:97-117` ; `products/[id]/route.ts:21-62`
- **Catégorie** : sécurité / perf
- **Constat** : l'upload d'image **via la route produits** (champ `imageFile` base64 → `storage.from('product-image').upload(..., { contentType: 'image/png', upsert: true })`) ne bénéficie PAS des protections de `/api/admin/upload` : pas de check de taille (`MAX_BYTES`), pas de sniff magic-bytes, `contentType` forcé à `image/png` quel que soit le contenu, chemin dérivé d'un `slug`/`brandName` contrôlés (path = `${brandName}/${slug}.png`). `upsert: true` permet d'écraser une image existante d'un autre produit si les slugs collisionnent. Le formulaire actuel passe par ce chemin (`product/page.tsx:68` envoie `formData` incluant `imageFile`), alors que `/api/admin/upload` (le code durci) n'est utilisé que par le blog/bannières.
- **Impact** : un base64 volumineux (DoS mémoire `Buffer.from`), ou un fichier non-image servi depuis un bucket public, ou un écrasement d'asset par collision de slug. Admin-gated → P2.
- **Reco** : faire transiter l'upload produit par `/api/admin/upload` (ou factoriser `sniffImageType`+taille+ext dans un helper partagé et l'appliquer aux deux chemins). Éviter `upsert: true` sur un chemin déterministe partagé.
- **Confiance** : haute

### [WS20-07] `banners/stats` : incrément lecture-puis-écriture sujet à perte de comptage (race) — P3
- **Fichier** : `src/app/api/admin/banners/stats/route.ts:22-46`
- **Catégorie** : data / perf
- **Constat** : compteur incrémenté en read-modify-write (`select view_count` → `+1` → `update`). Deux requêtes concurrentes perdent un incrément (pas atomique). Mineur ici car (a) la route est `requireAdmin()`-only donc le trafic est négligeable, (b) le tracking impressions/clics n'est pas branché côté client (cf. CLAUDE.md « jamais branchées → toujours 0 »). Aucune RPC `increment` atomique utilisée alors qu'une existe pour `reorder_banners`.
- **Impact** : sous-comptage possible si jamais branché tel quel. Aujourd'hui dormant.
- **Reco** : si activé un jour, utiliser un `UPDATE ... SET view_count = view_count + 1` (RPC SECURITY DEFINER ou `.rpc`) atomique. Note transverse : route admin-gated alors que des vues/clics publics ne pourront jamais l'appeler (incohérence de design, cf. WS hors périmètre).
- **Confiance** : haute

### [WS20-08] `banners` PUT : `position` peut devenir `undefined` dans l'`update` — P3
- **Fichier** : `src/app/api/admin/banners/route.ts:118-152`
- **Catégorie** : bug
- **Constat** : `bannerUpdate.position` est `.optional()` ; si absent, `position` vaut `undefined` et est passé dans l'objet `update({ ... position, ... })`. Supabase-js ignore les `undefined` (donc OK en pratique), mais `title`/`description`/`banner_type` aussi optionnels sont passés bruts : `title: undefined` est ignoré, en revanche un `banner_type` omis l'est aussi — le comportement « PATCH partiel » repose entièrement sur le tri des `undefined` par le client JS, fragile et implicite. Les `direction`/`attribution_*` sont gérés explicitement (`=== undefined ? undefined : ...`), pas les autres champs ⇒ asymétrie. Le client envoie toujours l'objet complet (`{ ...banner }`), donc pas d'impact réel aujourd'hui.
- **Impact** : aucun aujourd'hui (client envoie l'objet entier) ; piège latent si un appelant fait un vrai PATCH partiel.
- **Reco** : construire l'objet `update` en n'incluant que les clés définies (ou documenter que PUT = remplacement complet et exiger les champs requis).
- **Confiance** : moyenne

### [WS20-09] `parseInt`/pagination produits non bornée + recherche `ilike` non échappée — P2
- **Fichier** : `src/app/api/admin/products/route.ts:18-19,37-38` ; `products/with-tags/route.ts:15-16,34-35`
- **Catégorie** : perf / bug
- **Constat** : `limit = parseInt(searchParams.get('limit') || '10')` n'est ni borné ni validé : `?limit=999999` charge tout, `?limit=abc` → `NaN` → `.range(offset, offset + NaN - 1)` ⇒ comportement indéfini / 500. `?page=-5` → offset négatif. De plus `search` est interpolé dans `.or(\`name.ilike.%${search}%,description.ilike.%${search}%\`)` : un `search` contenant une virgule ou des méta-caractères PostgREST (`,` `)` `*`) casse/altère le filtre `or` (pas une injection SQL — PostgREST paramètre les valeurs — mais une injection de **syntaxe de filtre** : `search=a,is_active.eq.false` modifie la clause). Présent à l'identique sur les deux routes GET.
- **Impact** : DoS léger (limit énorme), 500 sur entrées malformées, filtres détournables (fuite de produits inactifs via manipulation du `or`). Admin-only → P2.
- **Reco** : `z.coerce.number().int().min(1).max(100).catch(...)` pour page/limit ; pour `search`, utiliser `.ilike()` paramétré sur chaque colonne (ou échapper `%_,()*` ) plutôt qu'une chaîne `.or()` interpolée.
- **Confiance** : haute

### [WS20-10] `tag_types` POST : tag initial créé sans rollback si échec partiel (best-effort silencieux) — P3
- **Fichier** : `src/app/api/admin/tag-types/route.ts:63-76`
- **Catégorie** : data / logique-métier
- **Constat** : après création du `tag_type`, l'insertion du `initial_tag` est best-effort — en cas d'erreur, on logge mais on renvoie quand même 200 avec le type. Pas de transaction. Idem côté produits POST : l'insert `product_images` (ligne 142-150) et `product_tags` (152-161) ne sont pas vérifiés (`await` sans capture d'erreur) ⇒ un produit peut être créé sans son image/ses tags, succès renvoyé. Pas atomique.
- **Impact** : incohérences silencieuses (type sans tag, produit sans image/tags) non remontées à l'admin. Faible.
- **Reco** : soit RPC transactionnelle, soit vérifier les erreurs des inserts secondaires et les remonter (au moins en avertissement dans la réponse).
- **Confiance** : haute

## Points positifs (court)
- **`requireAdmin()` systématique** sur 100 % des méthodes exportées, avec garde CSRF Origin centralisée (même sur GET) et `getUser()` (validation JWT serveur, pas `getSession()`).
- **`/api/admin/upload` POST est exemplaire** : magic-bytes (`sniffImageType`), borne taille (5 Mo), allowlist d'extensions, **chemin généré serveur** (`folder/uuid.ext`, anti-traversée), `upsert: false`, folder validé par enum Zod.
- **`apiError`** bien conçu (log serveur + message générique) et utilisé sur la majorité des routes ; `brands`/`ranges` valident proprement avec `parsed.data` et gèrent 23505/404.
- Gestion des contraintes d'intégrité référentielle avant DELETE (`brands`/`ranges`/`tag-types` refusent la suppression si dépendances) — bonne hygiène métier.

## Signalements hors périmètre (1 ligne chacun, max 5)
- `db/schema.sql` est périmé pour `products` (liste encore `image_url`, omet les 13 colonnes sprint-2 réelles) — divergence doc/DB (WS DB/schema).
- `banners/stats` est `requireAdmin()`-gated mais censé tracer des vues/clics publics → ne pourra jamais être appelé par un visiteur (design mort, cf. CLAUDE.md « jamais branchées »).
- `bannerCreate.slot`/`status`/`start_date`/`end_date` sont validés/round-trippés mais jamais lus par la home (colonnes dormantes documentées) — confirmer qu'on ne les croit pas actives.

## Zones non couvertes / à re-vérifier humainement
- **Policies Storage du bucket `product-image`** (public en lecture ?) — non auditables ici ; le DELETE arbitraire (WS20-05) et l'upload produit non-sniffé (WS20-06) servent depuis ce bucket. À recouper avec WS24/Storage.
- Modèle de menace « admin de confiance » : si l'admin est considéré pleinement de confiance, WS20-01/02/05/06 redescendent en robustesse/intégrité plutôt qu'en sécurité — décision produit à trancher.
- Comportement exact de PostgREST sur une clé inconnue dans `.insert/.update` (rejet 400 vs ignore) selon la version déployée — déterminera si le mass-assignment crashe ou écrit silencieusement les colonnes existantes (les deux scénarios restent des défauts).
