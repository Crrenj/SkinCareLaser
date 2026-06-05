# WS28 — Clients Supabase + lib cœur

**Périmètre** : `src/lib/supabaseClient.ts`, `supabaseServer.ts`, `supabaseAdmin.ts`, `getShopSettings.ts`, `getThemeConfig.ts`, `constants.ts`, `formatPrice.ts`, `slug.ts`, `logger.ts`, `resend.ts`, `seo.ts`, `whatsapp.ts` (+ `env.ts` et `shipping.ts` lus pour le contexte, hors périmètre formel).
**Fichiers lus** : 14 · **Lignes parcourues (approx.)** : ~600 (périmètre) + ~250 (vérifs croisées : `ConfirmationClient.tsx`, `api/theme`, `app/layout.tsx`, `cart/*`, `.env.local.example`).
**Synthèse** : P0=0 · P1=1 · P2=4 · P3=4

## Findings

### [WS28-01] Lien WhatsApp de confirmation de réservation toujours mort (env `NEXT_PUBLIC_WHATSAPP_NUMBER` jamais fournie) — P1
- **Fichier** : `src/lib/whatsapp.ts:39,87-92`
- **Catégorie** : bug | logique-métier
- **Constat** : `buildReservationWhatsappLink` lit le numéro depuis `process.env.NEXT_PUBLIC_WHATSAPP_NUMBER` (ligne 39). Cette variable **n'est définie nulle part** dans le repo : `grep -rn NEXT_PUBLIC_WHATSAPP_NUMBER` sur tout le projet (TS/TSX/JS/JSON/.env/.example, hors `.next`) ne ressort que sa propre lecture dans `whatsapp.ts` ; elle est **absente de `.env.local.example`** (qui ne documente que le `whatsapp_number` côté `shop_settings`). `git log -S NEXT_PUBLIC_WHATSAPP_NUMBER` confirme qu'elle n'a jamais été câblée sur une valeur — elle est arrivée avec la feature confirmation (`9f2bf35`/`d5fa9aa`) puis le commit `5c81dcb` a migré le WhatsApp du Footer/CartEmpty vers `shop_settings`, laissant `whatsapp.ts` orphelin sur l'env var. Résultat : `digits` (ligne 89) est toujours `''`, donc la fonction retourne **systématiquement** le fallback `/contact?ref=...` (ligne 90).
- **Impact** : Sur `/reservation/confirmation/[id]`, le CTA WhatsApp (`whatsappUrl`, utilisé par le hero CTA + la sticky bar mobile — cf. `ConfirmationClient.tsx:133,145,194`) est la **principale action** offerte au client pour coordonner sa réservation. En prod, il ne pré-remplit jamais WhatsApp : il renvoie vers `/contact`. Le client ne reçoit pas le message pré-rempli (référence + produits + total) ; toute la valeur du flux « réserver → coordonner sur WhatsApp » est perdue côté client final. C'est une régression du chemin cœur réservation.
- **Reco** : Aligner `whatsapp.ts` sur la source de vérité unique du reste du site (`shop_settings.whatsapp_number` via `getShopSettings()` / `whatsappHref`). Comme `buildReservationWhatsappLink` tourne dans un Client Component, passer le numéro normalisé en prop (résolu côté Server par le parent qui charge déjà `pickupLocation` depuis `shop_settings`) plutôt que via une env `NEXT_PUBLIC_*` jamais alimentée. À défaut, documenter `NEXT_PUBLIC_WHATSAPP_NUMBER` dans `.env.local.example` et la renseigner en prod (Vercel).
- **Confiance** : haute (env var introuvable dans le repo ; fallback déterministe). *Réserve* : si la valeur est injectée uniquement dans le dashboard Vercel (non visible ici), l'impact serait nul — à confirmer côté déploiement.

### [WS28-02] `buildReservationMessage` chiffre des frais de livraison sur un modèle click-&-collect uniquement — P2
- **Fichier** : `src/lib/whatsapp.ts:45-81` (esp. 46-54, 74-75)
- **Catégorie** : logique-métier
- **Constat** : Le message WhatsApp gère une branche `shipping.kind === 'delivery'` : il imprime une adresse (62-64), un libellé « Entrega Santo Domingo · 24-48h » / « Entrega Interior · 3-5 días » (49-51), un coût `SHIPPING_COSTS[zone]` (300/600 DOP) et un **« Total a coordinar »** qui ajoute ce coût au sous-total (53-54, 75). Or le projet est **click-&-collect uniquement** (pas de livraison payante — décision intentionnelle, brief §3). La branche `delivery` **est réellement atteignable** : `ConfirmationClient.tsx:98-100` la sélectionne dès qu'un `draft.shipping.kind === 'delivery'` + `draft.address` existent dans le localStorage du tunnel.
- **Impact** : Si un client passe par la variante « livraison » du tunnel, le message WhatsApp envoyé annonce un total **gonflé d'un frais d'envoi (300 ou 600 DOP) qui ne correspond à aucun service réel**, et promet une livraison que la pharmacie n'opère pas. Incohérence client-facing + risque de litige sur le montant annoncé.
- **Reco** : Je ne demande pas de re-câbler les tarifs livraison (connu/intentionnel). Mais cette fonction *expose* activement ces tarifs au client : forcer le message en mode retrait (n'émettre que la branche `pickup`, retirer le `shippingCost` du total), ou neutraliser la branche `delivery` tant que la livraison n'est pas un vrai service. Couplé à WS28-01, le vrai correctif (numéro WhatsApp depuis `shop_settings`) devrait s'accompagner d'un message « retiro » only.
- **Confiance** : haute.

### [WS28-03] `formatPrice` affiche 2 décimales par défaut → prix DOP en `100.00` côté client — P2
- **Fichier** : `src/lib/formatPrice.ts:20` (+ appels `src/components/cart/*`, `reservation/*`, `confirmation/*`)
- **Catégorie** : i18n | logique-métier (UX devise)
- **Constat** : `fractionDigits = 2` par défaut (ligne 20). Tous les composants **client-facing** appellent `formatPrice(n, { locale })` **sans** `fractionDigits: 0` : `CartSummary.tsx:31`, `CartLineItem.tsx:21`, `CartDrawerSummary.tsx:24`, `CartEmpty.tsx:24`, `ReviewStep.tsx:43`, `ShippingStep.tsx:23`, `ReservationSummary.tsx:32`, `ConfirmationRecap.tsx:58`, et `whatsapp.ts:55`. Ces prix sont rendus suivis d'un `DOP` (ex. `CartSummary.tsx:51` → « 100.00 DOP »). À l'inverse, **tous** les widgets admin passent explicitement `fractionDigits: 0` (`admin/page.tsx:50`, `RevenueWidget`, `InventoryWidget`, `TopProductsWidget`, `ReservationStatusWidget`). Le DOP n'utilise pas les centavos en retail RD.
- **Impact** : Incohérence devise : le client voit « 100.00 DOP » / « 1,234.50 DOP » (centavos parasites) alors que l'admin voit « 100 DOP ». Look peu professionnel sur tout le tunnel d'achat + message WhatsApp. Étant donné que les 353 produits sont à des prix entiers, c'est visible partout.
- **Reco** : Soit changer le défaut de `formatPrice` à `fractionDigits: 0` (le DOP retail est entier ; les rares cas voulant 2 décimales les passeraient explicitement), soit aligner les appels client-facing sur `{ fractionDigits: 0 }` comme l'admin. Le défaut à 0 est le plus cohérent avec la devise cible.
- **Confiance** : haute (défaut du code + absence d'override dans 9 composants vérifiés).

### [WS28-04] `generateSlug` réduit à vide tout nom non-latin → slugs vides / collisions — P2
- **Fichier** : `src/lib/slug.ts:6-13`
- **Catégorie** : data | bug
- **Constat** : Le pipeline `NFD` + suppression des diacritiques + `replace(/[^a-z0-9]+/g, '-')` ne conserve **que** `[a-z0-9]`. Tout caractère hors alphabet latin de base est supprimé. Test exécuté : `"日本語" → ""`, `"   " → ""`, `"ISDIN® 50+" → "isdin-50"`. Un nom intégralement non-latin (ou uniquement symboles/espaces) produit une **chaîne vide**. `generateSlug` est la source unique de slug pour produits/marques/gammes/tags/bannières (saisis par l'admin).
- **Impact** : Un nom non-latin ou symbolique génère `slug = ''`. Sur les tables avec contrainte `UNIQUE(slug)` (produits, posts, tags…), la **première** insertion à slug vide passe, la **seconde** échoue (violation d'unicité) avec une erreur opaque côté admin ; les pages `[slug]` à slug vide sont inatteignables. Risque faible sur le catalogue dermo actuel (noms latins), mais réel dès qu'un admin saisit un nom atypique.
- **Impact secondaire — pas de dédup** : `generateSlug` ne garantit aucune unicité (deux noms distincts mais identiques après normalisation → même slug). La responsabilité de l'unicité est déléguée à la DB / aux routes, mais le helper ne propose pas de suffixe.
- **Reco** : Fallback non vide quand le résultat est `''` (ex. `|| 'item'` ou suffixe horodaté/aléatoire), et éventuellement translittération (`@sindresorhus/slugify`/`transliteration`) pour préserver un slug lisible sur l'unicode. Au minimum, garantir un slug non vide pour éviter l'erreur d'unicité silencieuse.
- **Confiance** : haute (comportement reproduit en Node).

### [WS28-05] `env.ts` : la validation publique (`getPublicEnv`) et le rapport d'erreurs (`getServerEnv().ok/.errors`) ne sont consommés nulle part — P3
- **Fichier** : `src/lib/env.ts:44-86` (+ `supabaseAdmin.ts:18`)
- **Catégorie** : dette | archi
- **Constat** : `grep -rln "getServerEnv\|getPublicEnv" src/` (hors `env.ts`) ne ressort **que** `supabaseAdmin.ts`, qui n'utilise que `getServerEnv().serviceKey`. Les champs `ok`/`errors` de `ServerEnv` et toute la fonction `getPublicEnv()` (throwante, schéma `publicSchema`) n'ont **aucun consommateur**. Côté navigateur, `supabaseClient.ts:23` fait son propre garde `requiredPublicEnv` (volontaire, anti-bloat). Côté serveur, `supabaseServer.ts:13-14` et `getThemeConfig.ts:28-29` lisent `process.env.NEXT_PUBLIC_*!` en direct sans passer par `getPublicEnv()`.
- **Impact** : Surface morte : un module Zod (~40 LOC) dont la moitié n'est jamais appelée, et un mécanisme de rapport d'erreurs (`ok`/`errors`) jamais lu → si la clé service-role est mal formée, `supabaseAdmin` devient `null` silencieusement sans que `getServerEnv().errors` soit jamais surfacé. La centralisation annoncée (« source unique ») est partielle : 3 sites lisent encore `process.env` en direct.
- **Reco** : Soit brancher réellement `getPublicEnv()` dans `supabaseServer.ts`/`getThemeConfig.ts` (cohérence), soit retirer `getPublicEnv` et le champ `errors`/`ok` non utilisés. Au minimum, faire remonter `getServerEnv().errors` dans un log au boot serveur pour ne pas masquer une clé mal formée.
- **Confiance** : haute (grep exhaustif des consommateurs).

### [WS28-06] `FALLBACK.shipping_*` (300/600) dans `getShopSettings` propage des tarifs livraison sur un modèle click-&-collect — P3
- **Fichier** : `src/lib/getShopSettings.ts:25-26`
- **Catégorie** : dette | data
- **Constat** : Le fallback hardcode `shipping_santo_domingo: 300` / `shipping_interior: 600`. Ces colonnes sont des reliquats orphelins (modèle click-&-collect, brief §3). Le fallback réplique donc des valeurs « livraison » qui ne devraient pas exister fonctionnellement, et qui alimentent indirectement WS28-02.
- **Impact** : Faible — c'est un miroir du schéma. Mais ça pérennise des chiffres trompeurs dans le code applicatif (et non plus seulement en DB), et un dev pourrait les croire actifs.
- **Reco** : Mettre `0`/`null` dans le fallback tant que la livraison n'est pas un service réel, ou commenter explicitement que ces champs sont morts. Cohérent avec la neutralisation de WS28-02.
- **Confiance** : moyenne (jugement de pertinence ; techniquement correct).

### [WS28-07] `getShopSettings` retourne `theme/default_mode/allow_visitor_mode` non revalidés (typage permissif) — P3
- **Fichier** : `src/lib/getShopSettings.ts:45-63` vs `getThemeConfig.ts:46-48`
- **Catégorie** : dette | data
- **Constat** : `getThemeConfig` valide soigneusement `data.theme`/`data.default_mode` via `isThemeName`/`isThemeMode` avant de les retourner (defensive). `getShopSettings` retourne `data` brut (`select('*')`), donc `theme`/`default_mode` arrivent tels quels (le type DB est `string`/enum, mais une valeur DB hors-enum — improbable mais possible si la contrainte CHECK est altérée — ne serait pas filtrée). Deux helpers lisent la même row avec deux niveaux de confiance.
- **Impact** : Très faible (la contrainte CHECK DB protège déjà). Surtout une asymétrie de robustesse + une double lecture de `shop_settings` par requête (une via `getShopSettings`/cookies, une via `getThemeConfig`/anon-no-cookie). Pas de bug observable.
- **Reco** : Acceptable tel quel ; noter que les consommateurs de `getShopSettings().theme` (s'il y en a) ne bénéficient pas de la garde de `getThemeConfig`. Pas d'action urgente.
- **Confiance** : moyenne.

### [WS28-08] `supabaseClient` parse les cookies de façon naïve (split sur `=`) — P3
- **Fichier** : `src/lib/supabaseClient.ts:33-39`
- **Catégorie** : bug (cas limite) | dette
- **Constat** : `get(name)` fait `.find(row => row.startsWith(name + '='))?.split('=')[1]`. Si la valeur du cookie contient un `=` (les tokens base64/`base64-` de `@supabase/ssr` peuvent finir par du padding `=`), `split('=')[1]` **tronque** la valeur au premier `=`. De plus, la valeur n'est pas passée par `decodeURIComponent` (le `set` n'encode pas non plus, donc symétrique, mais fragile si une valeur contient `;` ou des caractères réservés). `@supabase/ssr` stocke souvent des tokens longs potentiellement chunkés.
- **Impact** : Risque de cookie tronqué → session non restaurée côté client dans le cas edge d'une valeur contenant `=`. En pratique `createBrowserClient` chunk et la lib réassemble, mais le `split('=')[1]` reste incorrect par principe. Faible probabilité, impact = re-login.
- **Reco** : Utiliser `row.slice(row.indexOf('=') + 1)` au lieu de `split('=')[1]`, et envisager `decodeURIComponent` côté get (avec `encodeURIComponent` côté set) pour la robustesse. Aligner sur le parsing standard.
- **Confiance** : moyenne (cas limite ; dépend du format exact des cookies `@supabase/ssr`).

## Points positifs (court)
- `supabaseAdmin.ts` : `import 'server-only'` + singleton + `persistSession:false`/`autoRefreshToken:false`, et **aucun import depuis un Client Component** (vérifié : `grep -rl supabaseAdmin src/` croisé avec `'use client'` → 0 fuite). Le P0 attendu est clean.
- `supabaseClient.ts` : fallback `localStorage` bien retiré (cookie SSR only), commentaire de threat model clair, `Secure` en prod.
- `getThemeConfig.ts` : utilise `createClient` (supabase-js, **sans cookies**) wrappé dans `unstable_cache` → ne force pas le rendu dynamique, exactement comme requis ; validation `isThemeName`/`isThemeMode` + fallback `DEFAULT`. `/api/theme` met bien `Cache-Control: no-store`.
- `logger.ts` : en prod, sérialise les `Error` en `{message, stack}` (évite les objets bruyants) ; `info` muet en prod. Aucun appel ne logge de token/clé/PII dans le périmètre lib.
- `seo.ts` : `buildLanguageAlternates` ajoute bien `x-default` → locale par défaut (`fr`) ; logique hreflang correcte.
- `getShopSettings.ts` : `cache()` React (dédup par render) + fallback gracieux qui ne casse pas le rendu public sur erreur DB.

## Signalements hors périmètre (1 ligne chacun, max 5)
- `ConfirmationClient.tsx:98-100` : sélectionne la branche `delivery` depuis un `draft` localStorage non revalidé — couplé à WS28-02 (le tunnel ne devrait proposer que le retrait).
- `.env.local.example` documente `RESEND_FROM_EMAIL` alors que CLAUDE.md décrit Resend comme optionnel et ne liste pas cette var dans « variables requises » — dérive doc mineure (WS gère docs).
- `shipping.ts:23-27,47-54` : `SHIPPING_COSTS` + `zoneFromPostalCode` (zone par code postal) sont encore référencés par le tunnel alors que livraison = hors service (connu/intentionnel) — alimente WS28-02/06.

## Zones non couvertes / à re-vérifier humainement
- **WS28-01 dépend du déploiement** : impossible de voir le dashboard Vercel d'ici. Si `NEXT_PUBLIC_WHATSAPP_NUMBER` y est défini, le lien fonctionne en prod et l'impact tombe à P3 (var non documentée). À confirmer côté Vercel — sinon le CTA est mort.
- **WS28-08** : le format réel des cookies écrits par `@supabase/ssr` (chunking, padding `=`) n'a pas été reproduit en runtime ; la sévérité dépend de la présence effective d'un `=` dans une valeur de cookie non-chunkée.
- Comportement de `getServerEnv()` quand `SUPABASE_SERVICE_ROLE_KEY` est mal formée (non vide mais invalide) : non testé en runtime (le schéma n'exige que `min(1)`, donc une clé « bidon » passe et `supabaseAdmin` s'instancie avec une clé invalide → erreurs 401 à l'usage plutôt qu'un `null` propre). À considérer si durcissement souhaité.
