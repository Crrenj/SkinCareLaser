# WS36 — Scripts (`scripts/*`)

**Périmètre** : `scripts/build-favicons.cjs`, `check-products.js`, `create-admin-user.js`, `make-existing-user-admin.js`, `parse-pdfs.cjs`, `prices-export.cjs`, `prices-import.cjs`, `prices-set-default.cjs`, `reset-password.js`, `seed-example-content.cjs`, `seed-import.cjs`, `validate-catalog.cjs`, `scripts/package.json`
**Fichiers lus** : 13 (+ recoupé `db/schema.sql`, `package.json`, migrations `2026052214/2055/2310*`, et **schéma live** via SELECT read-only) · **Lignes parcourues (approx.)** : ~1 050
**Synthèse** : P0=0 · P1=3 · P2=4 · P3=5

> Note de cadrage : ce sont des outils **dev/ops** lancés à la main, hors runtime du site et hors CI (aucun n'est appelé par `ci.yml`). Un script cassé ne casse donc ni le site live ni le build → plafonné **P1** (pas P0), sauf s'il corrompt des données. Les findings de schéma ci-dessous ont été **vérifiés contre la base live** (project `adxpoxcynrpnbbxnncsk`), pas seulement contre les docs.

## Findings

### [WS36-01] `seed-import.cjs` est cassé contre le schéma actuel — `products.image_url` n'existe plus → 0 produit importé — P1
- **Fichier** : `scripts/seed-import.cjs:267` (clé `image_url` dans l'upsert `products`, lignes 259-268 ; chemin d'erreur 271-274)
- **Catégorie** : bug | data | dette
- **Constat** : l'upsert `products` envoie `image_url: imageUrl`. La colonne `products.image_url` a été **droppée** (migration `20260522144853_drop_products_image_url.sql`) — **confirmé en base live** (`information_schema.columns` → 0 ligne). PostgREST rejette toute colonne inconnue (`PGRST204 "Could not find the 'image_url' column"`). Le code attrape l'erreur (`log(...); continue`) au lieu de throw → **chaque produit est sauté silencieusement**. Comme `product_images` et `product_tags` sont insérés *après* dans la même itération (lignes 284-299), ils ne sont jamais atteints non plus.
- **Impact** : le pipeline d'import documenté comme la voie de seed (`npm run seed-import`, CLAUDE.md) **n'importe aucun produit, aucune image produit, aucun tag produit** sur le schéma courant. Pire : `tag_types`, `brands`, `ranges` sont upsertés *avant* l'échec (lignes 108-118, 186-219) → un run laisse des **gammes/marques orphelines sans aucun produit** (état partiel, pas un rollback). Idempotent au re-run, donc pas de perte, mais inutilisable tel quel. (Les 353 produits actuels datent d'avant le drop.)
- **Reco** : retirer `image_url` du payload `products` ; faire passer l'image **uniquement** par `product_images` (déjà fait lignes 284-287). Transformer le `continue` silencieux en échec comptabilisé (push dans `failed`) pour ne plus masquer ce genre de régression.
- **Confiance** : haute (vérifié en base live).

### [WS36-02] `seed-import.cjs` écrit dans `product_ranges` (table droppée) et ne pose jamais `products.range_id` — P1
- **Fichier** : `scripts/seed-import.cjs:279-281` (upsert `product_ranges`) ; payload `products` lignes 259-268 (aucun `range_id`)
- **Catégorie** : bug | data
- **Constat** : la liaison produit↔gamme passe par `supabase.from('product_ranges').upsert(...)`. La table `product_ranges` a été **supprimée** (migration `20260522205544`, remplacée par `products.range_id` FK directe) — **confirmé en base live** (table absente). L'upsert renvoie un objet `{ error }` jamais inspecté (pas de `if (error) throw`) → **échec silencieux**. Le payload `products` (lignes 259-268) ne pose **pas** `range_id`. Donc même si le finding WS36-01 était corrigé, tous les produits seraient importés avec `range_id = NULL`.
- **Impact** : produits orphelins de gamme → invisibles dans le catalogue (les requêtes catalogue/marques joignent/filtrent sur `range_id`) et `range_id` est la seule association gamme depuis 2026-05-22. (`range_id` est *nullable* en base, donc pas de violation NOT NULL qui ferait au moins échouer bruyamment — l'erreur reste muette.)
- **Reco** : supprimer le bloc `product_ranges` (lignes 279-281) ; ajouter `range_id: rangeId` au payload de l'upsert `products`. Vérifier les erreurs de toutes les écritures secondaires (`product_images`, `product_tags`) qui sont aussi `await` sans contrôle d'erreur (lignes 285-286, 296).
- **Confiance** : haute (vérifié en base live).

### [WS36-03] `create-admin-user.js` + `make-existing-user-admin.js` écrivent `profiles.is_admin` (colonne droppée) → bootstrap admin cassé — P1
- **Fichier** : `scripts/create-admin-user.js:91-98` (et `scripts/make-existing-user-admin.js:40-47`)
- **Catégorie** : bug | data
- **Constat** : les deux scripts font `supabase.from('profiles').upsert({ id, is_admin: true, role: 'admin', display_name: ... })`. La colonne `profiles.is_admin` a été **droppée** (migration `20260523104708_drop_profiles_is_admin_legacy.sql`) — **confirmé en base live** (absente ; `profiles.role` existe encore). L'upsert échoue (`PGRST204`), `profileError` est truthy → `throw profileError` (ligne 100 / 49) → `process.exit(1)`. La ligne `admin_users` (la vraie source de vérité) n'est jamais atteinte car elle est *après* l'upsert profiles.
- **Impact** : `npm run create-admin` (documenté comme **la** commande de bootstrap admin dans CLAUDE.md + README) **échoue systématiquement** sur une base à jour ; aucun admin ne peut être créé via ce chemin. `make-existing-user-admin.js` (promotion de `j@gmail.com`) idem.
- **Reco** : retirer `is_admin` du payload `profiles` (garder éventuellement `role`/`display_name`), puis upsert `admin_users` (= source de vérité unifiée, cf. CLAUDE.md). Ordre robuste : faire l'upsert `admin_users` **avant** ou indépendamment de profiles, pour qu'un échec cosmétique sur profiles ne bloque pas l'octroi du privilège.
- **Confiance** : haute (vérifié en base live).

### [WS36-04] Mots de passe admin exposés en clair (argv + stdout) — P2
- **Fichier** : `scripts/create-admin-user.js:32,77` ; `scripts/reset-password.js:23,53`
- **Catégorie** : sécurité
- **Constat** : le mot de passe est lu depuis `process.argv[3]` (visible dans `ps`/historique shell) puis **ré-affiché en clair** sur stdout : `console.log(\`🔑 Mot de passe: ${password}\`)` (create, ligne 77) et `console.log(\`🔑 Nouveau mot de passe: ${newPassword}\`)` (reset, ligne 53). Pas de secret de service exposé ici (la service key vient de l'env, jamais loggée — bien), mais le credential utilisateur l'est.
- **Impact** : fuite du mot de passe admin dans l'historique shell, les logs de terminal, un éventuel CI/capture d'écran. Risque réel mais limité (outil local, opérateur de confiance).
- **Reco** : ne pas ré-imprimer le mot de passe (l'opérateur vient de le taper) ; idéalement le lire via prompt masqué (`read -s` / `readline` sans echo) plutôt qu'en argv. Au minimum supprimer les deux `console.log` du secret.
- **Confiance** : haute.

### [WS36-05] Scripts destructifs sur `db/catalog.json` (fichier **versionné**) sans `--dry-run` — P2
- **Fichier** : `scripts/prices-set-default.cjs:48` ; `scripts/prices-import.cjs:95` ; `scripts/parse-pdfs.cjs:319`
- **Catégorie** : data | dette
- **Constat** : `prices-set-default.cjs` réécrit **tous** les prix de `catalog.json` (le mode `--only-missing` est *opt-in* ; sans lui, écrasement global) et n'a **aucun `--dry-run`**, contrairement à `seed-import`/`seed-example-content`. `prices-import.cjs` et `parse-pdfs.cjs` réécrivent aussi `catalog.json` en place. Or `db/catalog.json` **n'est pas gitignoré** (`git check-ignore` négatif — il est tracké/commité, cf. brief §3). `parse-pdfs.cjs` écrase intégralement le JSON édité à la main (les corrections post-`validate-catalog`, p.ex. descriptions tronquées) sans avertissement.
- **Impact** : un `npm run prices:default 100` ou un re-`parse-pdfs` malencontreux écrase des données curées d'un fichier sous contrôle de version (récupérable via git, donc pas une perte définitive, mais surprenant et non garde-fou). Asymétrie d'UX avec les scripts DB qui, eux, ont `--dry-run`.
- **Reco** : ajouter un `--dry-run` (affiche le diff/compteurs, n'écrit pas) à `prices-set-default.cjs` ; pour `parse-pdfs.cjs`, refuser d'écraser si `catalog.json` existe sauf `--force`, ou écrire dans un `.new.json` à diff. Documenter que `catalog.json` est versionné.
- **Confiance** : haute (statut git vérifié).

### [WS36-06] Aucun rollback sur échec partiel d'import (DB) — état incohérent possible — P2
- **Fichier** : `scripts/seed-import.cjs:223-301` ; `scripts/seed-example-content.cjs:109-168`
- **Catégorie** : data | logique-métier
- **Constat** : `seed-import` upserte séquentiellement tag_types → brand → PDF storage → ranges → products → images → tags, sans transaction. Un échec en milieu de marque (ou le WS36-01) laisse marque+gammes créées sans produits. `seed-example-content` fait un `throw` à la première erreur SELECT/INSERT/UPDATE (lignes 119/128/134…) → si l'article 3/4 échoue, les 2 premiers sont déjà écrits, le run s'arrête. Les upserts sont idempotents (re-run sûr), ce qui atténue, mais l'état intermédiaire reste exposé entre deux runs.
- **Impact** : back-office/catalogue dans un état partiel après un run interrompu. Pas de corruption (idempotent), mais pas d'« tout ou rien ».
- **Reco** : envelopper chaque marque dans une RPC transactionnelle, ou au minimum documenter que le re-run est la stratégie de récupération (déjà le cas pour `--brands` ; étendre le message à seed-example). Acceptable de garder tel quel vu le contexte ops, mais à noter.
- **Confiance** : moyenne.

### [WS36-07] `prices-import.cjs` : parser CSV ne gère pas les retours-ligne dans les champs quotés — P2
- **Fichier** : `scripts/prices-import.cjs:48` (`.split('\n')` avant le parsing champ-par-champ)
- **Catégorie** : bug | data
- **Constat** : le fichier est d'abord découpé en lignes sur `\n` (ligne 48), *puis* chaque ligne passe dans `parseCsvLine` qui gère les quotes. Mais un champ `description` exporté par `prices-export.cjs` peut contenir un `\n` (les descriptions PDF sont multi-lignes, et `escape()` les entoure de guillemets sans les retirer). Un tel champ casse le découpage : la ligne est tronquée, le `product_slug`/`new_price` décalés → prix appliqué au mauvais produit ou ligne ignorée.
- **Impact** : si l'opérateur édite/réexporte un CSV avec une description multi-ligne, l'import de prix peut **mal associer** ou perdre des prix silencieusement. Probabilité moyenne (dépend des données réelles), impact data réel.
- **Reco** : soit exclure la colonne `description` de l'export (elle n'est pas relue à l'import — seuls `product_slug`+`new_price` le sont, cf. lignes 55-56), soit utiliser un vrai parseur CSV gérant les newlines quotés. La première option est triviale et suffisante.
- **Confiance** : moyenne (dépend de la présence de `\n` dans les descriptions exportées).

### [WS36-08] `check-products.js` interroge en clé **anon** → résultat dépendant des RLS, trompeur comme diagnostic — P3
- **Fichier** : `scripts/check-products.js:25-28,35-46`
- **Catégorie** : dette | logique-métier
- **Constat** : ce script de « diagnostic Supabase » (README) utilise `NEXT_PUBLIC_SUPABASE_ANON_KEY` et SELECT `products` + `product_images`. La policy `products` ne montre que `is_active = true` à l'anon ; un produit inactif/masqué n'apparaîtra pas. Le `.limit(10)` rend aussi le « ✅ N produits trouvés » non représentatif du total.
- **Impact** : un opérateur peut conclure « la base est vide / OK » à tort selon l'état RLS. Mineur (outil de debug).
- **Reco** : soit assumer (commenter que c'est la vue *publique*), soit basculer en service-role comme les autres scripts pour un vrai diagnostic d'intégrité.
- **Confiance** : haute.

### [WS36-09] `scripts/package.json` `"type":"module"` : cohérence ESM/CJS correcte mais fragile — P3
- **Fichier** : `scripts/package.json:1-3` ; `.cjs` (8 fichiers) vs `.js` ESM (`check-products.js`, `create-admin-user.js`, `make-existing-user-admin.js`, `reset-password.js`)
- **Catégorie** : dette | archi
- **Constat** : `scripts/package.json` force `type: module`, donc les `.js` sont traités ESM (ils utilisent bien `import`/`import.meta.url` → OK) et les `.cjs` restent CJS (`require` → OK). **Pas de casse** actuelle. Mais : (a) `check-products.js` est ESM et fait `require('dotenv').config(...)` — `require` n'existe pas en ESM. **Vérification** : ce fichier mélange `const { createClient } = require(...)` (ligne 8) avec une extension `.js` sous `type:module` → **ce script crash au lancement** (`ReferenceError: require is not defined in ES module scope`).
- **Impact** : `npm run check-products` est **cassé** (ESM + `require`). Confirmé par lecture : lignes 8-9 utilisent `require`, fichier `.js` sous `type:module`. (Les 3 autres `.js` — create/make/reset — utilisent bien `import`, donc OK.)
- **Reco** : renommer `check-products.js` en `.cjs`, **ou** convertir ses 2 `require` en `import`. Trancher la convention : tout en `.cjs`, ou tout en ESM `import`, pour éviter ce piège (déjà noté dans CLAUDE.md « nouveaux scripts `.cjs` ou ES »).
- **Confiance** : haute (incohérence visible à la lecture ; non exécuté par respect du périmètre lecture-seule, mais le mode ESM + `require` est une erreur runtime déterministe).

### [WS36-10] `parse-pdfs.cjs` : `execSync(pdftotext ...)` avec interpolation de chemin + dépendance binaire externe non vérifiée — P3
- **Fichier** : `scripts/parse-pdfs.cjs:18,177`
- **Catégorie** : sécurité | dette
- **Constat** : `execSync(\`pdftotext -layout "${pdfPath}" -\`)`. `pdfPath` est construit depuis `readdirSync(FICHE_DIR)` filtré `.pdf` — les noms viennent d'un dossier local **gitignoré** (`contenu_bd/fiche`), donc pas d'entrée attaquant ; mais un nom de fichier contenant `"` ou `$()` casserait/injecterait la commande shell. Par ailleurs aucune vérification que `pdftotext` (poppler) est installé → message d'erreur cryptique si absent.
- **Impact** : faible (données locales de confiance), mais shell-injection latente + dépendance système silencieuse. ReDoS écarté : les regex de parsing sont linéaires (testé, ~1 ms sur entrée adversariale 40k).
- **Reco** : préférer `execFileSync('pdftotext', ['-layout', pdfPath, '-'])` (pas de shell). Vérifier la présence de `pdftotext` au démarrage avec un message clair.
- **Confiance** : haute (chemin de données), moyenne (exploitabilité — surface locale uniquement).

### [WS36-11] `build-favicons.cjs` : `Buffer.allocUnsafe` non réinitialisé — robuste ici mais à surveiller — P3
- **Fichier** : `scripts/build-favicons.cjs:53-63`
- **Catégorie** : dette
- **Constat** : `Buffer.allocUnsafe(px * 4)` puis remplissage **complet** des 4 canaux pour chaque pixel dans la boucle (lignes 56-62) → toute la mémoire est écrasée, pas de fuite de données résiduelles. Correct. À noter seulement : si un jour la boucle devenait conditionnelle (skip de pixels), des octets non initialisés fuiraient dans le PNG.
- **Impact** : aucun aujourd'hui (couverture totale). Note de vigilance.
- **Reco** : `Buffer.alloc` (zéro-initialisé) coûte négligeable ici et supprime le risque. Sinon laisser tel quel.
- **Confiance** : haute.

## Points positifs (court)
- **Gestion des secrets exemplaire** : tous les scripts DB lisent `SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_KEY` depuis `.env.local`, vérifient leur présence et `exit(1)` proprement si absent ; **la service key n'est jamais loggée**. Aucun secret en dur.
- **`--dry-run` bien fait** sur `seed-import.cjs` et `seed-example-content.cjs` (ce dernier ne se connecte même pas à la base en dry-run — lignes 69-91).
- **Idempotence soignée** : upserts `onConflict` partout ; `seed-example-content` préserve `published_at` au re-run (lignes 123-124) ; `product_images` delete-then-insert pour rejouabilité.
- **`prices-import.cjs`** valide les prix (NaN/négatif ignorés avec warning, ligne 69) et le `parseCsvLine` gère correctement les guillemets échappés `""`.
- **`validate-catalog.cjs`** est un bon garde-fou pré-import (slugs dupliqués, descriptions tronquées, déficit d'images) — exactement le bon réflexe avant `seed-import`.

## Signalements hors périmètre (1 ligne chacun, max 5)
- `db/schema.sql` est **périmé** : liste encore `products.image_url` (l.78) et le commentaire product_ranges, alors que les colonnes/tables sont droppées en base (full regen `supabase db dump` à faire — déjà noté dans CLAUDE.md « Reste à faire »).
- L'écriture muette sans contrôle d'erreur sur les `await supabase.from(...).upsert/insert` secondaires est un pattern à risque répété (seed-import) — vérifier `.error` partout.

## Zones non couvertes / à re-vérifier humainement
- Les scripts n'ont **pas été exécutés** (respect du périmètre lecture-seule) : les diagnostics PostgREST (`PGRST204` sur `image_url`/`is_admin`, crash ESM `check-products`) sont déduits du schéma live + de la sémantique connue, non observés au runtime. À confirmer par un run réel sur une base de staging.
- `contenu_bd/fiche` et `contenu_bd/image` étant gitignorés/absents, le comportement réel de `parse-pdfs.cjs`/`seed-import.cjs` sur les vraies données (stratégie `positional` vs `by-slug`, Levenshtein) n'a pas pu être rejoué.
- L'historique exact ayant produit les 353 produits actuels (avant le drop `image_url`) n'a pas été reconstitué — sans incidence sur les findings.
