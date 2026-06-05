# WS02 — Catalogue + filtres

**Périmètre** : `src/app/[locale]/catalogue/page.tsx`, `src/components/CatalogueClient.tsx`, `src/components/catalogue/{CatalogueHeader,CataloguePagination,CatalogueSidebar,CatalogueToolbar,FiltersMobileSheet,FiltersPill}.tsx`, `src/lib/catalogueFilters.ts`
**Fichiers lus** : 8 du périmètre + 6 hors périmètre pour contexte (ProductCard, besoins/[slug], next.config, baseline.sql, fr/es/en.json) · **Lignes parcourues (approx.)** : ~1 350
**Synthèse** : P0=0 · P1=0 · P2=4 · P3=6

> Recoupé en DB live (read-only) : 353 produits actifs, 299 images, **0 produit avec >1 image**, 3 tag_types (`besoins`=14, `ingredients`=15, `types-peau`=7) — **aucun tag_type `categories`**.

## Findings

### [WS02-01] `buildPageRange` génère un numéro de page **dupliqué** sur les 3 dernières pages — P2
- **Fichier** : `src/components/catalogue/CataloguePagination.tsx:13-31` (utilisé l.59)
- **Catégorie** : bug
- **Constat** : quand `current >= total - 2` (page proche de la fin), la boucle pousse `last-1`, puis la branche post-boucle `else if (end === last - 1) out.push(last - 1)` (l.28) le pousse **une seconde fois**. Reproduit hors composant pour `total∈{8,9,12,19}` :
  - `total=19, current=18` → `[1,'ellipsis',17,18,**18**,19]`
  - `total=19, current=19` → `[1,'ellipsis',18,**18**,19]`
  - `total=8, current=6` → `[1,'ellipsis',5,6,7,**7**,8]`
  Le défaut est **asymétrique** (jamais au début : la branche `start === first+1` s'exécute *avant* la boucle et la boucle démarre à `max(start, first+2)`, donc pas de collision côté gauche). Avec 353 produits / 24 par page = **15 pages**, le bug se déclenche sur les pages **13, 14, 15**.
- **Impact** : (1) tuile de page **affichée en double** dans le pager ; (2) **collision de clé React** — deux `<button key={entry}>` avec la même valeur (l.70 `key={entry}`) → warning console + risque de glitch de reconciliation (l'un des deux boutons peut ne pas refléter l'`aria-current`). Touche un flux de navigation cœur du catalogue.
- **Reco** : dédupliquer la branche de fin, p.ex. ne pousser `last-1` que s'il n'est pas déjà dans `out` (`if (end === last - 1 && out[out.length-1] !== last-1) ...`), ou borner la boucle à `Math.min(end, last-2)` et ne gérer `last-1` que dans les branches. Ajouter un test unitaire (le helper est testable en isolation).
- **Confiance** : haute (reproduit numériquement)

### [WS02-02] Image produit non déterministe : `product_images[0]` sans `.order()` — P2
- **Fichier** : `src/app/[locale]/catalogue/page.tsx:104` (SELECT `product_images ( url, alt )`), consommé `catalogueFilters` n'ordonne pas et `ProductCard.tsx:83` lit `images?.[0]`
- **Catégorie** : data / bug
- **Constat** : la table `product_images` (baseline `00000000000000_baseline.sql:120-125`) n'a **aucune colonne d'ordre** (`id, product_id, url, alt` seulement). Le SELECT ne pose pas de `.order(...)`, donc PostgREST renvoie les lignes dans un ordre **non garanti** ; `ProductCard` affiche systématiquement `images[0]`. Pour un produit multi-images, l'« image principale » affichée peut **changer d'un build/requête à l'autre**.
- **Impact** : aujourd'hui **latent** (DB live : 0 produit a >1 image → invisible au lancement). Devient un défaut visible dès qu'un produit aura plusieurs photos (vignette catalogue instable, incohérente avec la PDP). Dette d'intégrité d'affichage.
- **Reco** : ajouter une colonne `sort_order`/`position` (ou `is_primary`) à `product_images` + `.order('sort_order')` dans le SELECT ; à défaut immédiat, `.order('id')` pour au moins figer le choix de façon déterministe. (Même cause partagée par `besoins/[slug]/page.tsx:56` et l'`og:image` — cf. hors périmètre.)
- **Confiance** : haute

### [WS02-03] Chips de filtres desktop sans `aria-pressed` (état toggle invisible aux lecteurs d'écran) — P2
- **Fichier** : `src/components/catalogue/CatalogueSidebar.tsx:126-138`
- **Catégorie** : a11y
- **Constat** : les filtres `types-peau` et `ingredients` (22 options en DB) sont rendus comme des `<button>` toggle dont l'état actif n'est exprimé **que visuellement** (`bg-ink-900` vs `bg-sand-50`). Aucun `aria-pressed`, pas de `role`. La version mobile (`FiltersMobileSheet.tsx:290`) pose pourtant correctement `aria-pressed={on}` — incohérence interne.
- **Impact** : un utilisateur de lecteur d'écran (desktop) ne perçoit pas quels filtres « type de peau » / « ingrédient » sont actifs → filtrage difficilement utilisable au clavier/AT. Bloqueur WCAG 4.1.2 (Name, Role, Value) sur 2 familles de filtres.
- **Reco** : ajouter `aria-pressed={on}` sur le `<button>` (l.126), comme dans la sheet mobile.
- **Confiance** : haute

### [WS02-04] Récupération de **tous** les produits non paginée + faceting O(facets × produits) à chaque requête — P2
- **Fichier** : `src/app/[locale]/catalogue/page.tsx:91-116` (`.limit(500)`) + `src/lib/catalogueFilters.ts:146-181` (`computeFacetedCounts`)
- **Catégorie** : perf
- **Constat** : la page lit **jusqu'à 500 produits** (353 actuels) avec leurs images + tags joints, puis pagine **en mémoire** (`page.tsx:172-176`). `computeFacetedCounts` itère, pour **chaque** facette (≈13 marques + 52 gammes + 36 tags ≈ **101 facettes**), un `.filter()` sur les 353 produits, chacun rappelant `matchesFilters` (qui re-boucle sur les tag types et les tags du produit) → ~35 000 évaluations `matchesFilters` **par requête de page**. Comme la page lit `searchParams`, elle est **rendue dynamiquement** (pas de cache HTML), donc ce coût est payé à **chaque navigation/filtre**.
- **Impact** : surcoût CPU serveur mesurable et croissance **quadratique** avec le catalogue (×2 produits + ×2 facettes ≈ ×4). Tenable au lancement, mais devient un goulet quand le catalogue grossit. Payload réseau aussi gonflé (353 produits sérialisés même si une page n'en montre que 24 — quoique seuls `pageProducts` soient passés au client, le travail serveur reste complet).
- **Reco** : à terme, pousser filtres + pagination + comptages côté SQL (vue/RPC avec `count` agrégé et `range()` PostgREST), ou au minimum mémoïser `computeFacetedCounts`/`filterProducts` sur la clé de filtres. Court terme acceptable vu l'échelle ; à tracer comme dette perf avant montée en volume.
- **Confiance** : moyenne (impact réel mais non bloquant à 353 produits)

### [WS02-05] `export const revalidate = 60` sans effet (page dynamique via `searchParams`) — P3
- **Fichier** : `src/app/[locale]/catalogue/page.tsx:29`
- **Catégorie** : dette / perf
- **Constat** : la page `await searchParams` (l.86) → Next 15 la rend en **dynamic**. `revalidate = 60` (ISR) ne s'applique pas au HTML d'une page dynamique, et les appels Supabase ne passent pas par le cache `fetch` de Next → la directive est **trompeuse** (laisse croire à un cache 60 s qui n'existe pas).
- **Impact** : aucun bug, mais fausse compréhension du comportement de cache (et masque le fait que chaque hit recalcule tout, cf. WS02-04).
- **Reco** : retirer `revalidate` ou documenter explicitement qu'il est inerte ici ; envisager un vrai cache des données catalogue (lecture produits) indépendant des `searchParams`.
- **Confiance** : haute

### [WS02-06] Doublon possible dans `tags['besoins']` quand `?need=` ET `?tag=besoins:` coexistent — P3
- **Fichier** : `src/lib/catalogueFilters.ts:78-94`
- **Catégorie** : bug (cas limite)
- **Constat** : `needParam` remplit `tags['besoins']` (l.80-82), puis la boucle `tagParam` (l.85-94) fait `tags[type] ??= []; tags[type].push(matched)` — sans dédup. Une URL `?need=hydratation&tag=besoins:hydratation` produit `tags['besoins'] = ['Hydratation','Hydratation']`.
- **Impact** : deux pills identiques côté client (`CatalogueClient.tsx:163-167`) avec la **même clé React** `besoins:Hydratation` → warning de clé dupliquée. Le filtrage reste correct (`some(...)`). Cas non atteint par l'UI interne (qui n'émet jamais les deux à la fois), seulement par une URL forgée/partagée.
- **Reco** : dédupliquer à l'insertion (`if (!tags[type].includes(matched)) tags[type].push(matched)`), cohérent avec la dédup déjà faite côté `ranges` dans `page.tsx:164`.
- **Confiance** : haute

### [WS02-07] `PRODUCTS_PER_PAGE` (24) dupliqué en dur côté client → risque de désync de l'étiquette « Affichage X–Y » — P3
- **Fichier** : `src/components/CatalogueClient.tsx:171` (`const startIndex = (currentPage - 1) * 24`) vs `src/app/[locale]/catalogue/page.tsx:31` (`PRODUCTS_PER_PAGE = 24`)
- **Catégorie** : dette
- **Constat** : la taille de page est définie côté serveur (`PRODUCTS_PER_PAGE`) et **réécrite en littéral `24`** côté client pour calculer la plage affichée (`gridShowing`). Aucun lien entre les deux constantes.
- **Impact** : si on change la taille de page côté serveur sans toucher le client, l'étiquette « Affichage {from}–{to} sur {total} » devient **fausse** (décalage de plage), sans erreur. Bug de cohérence silencieux.
- **Reco** : exporter `PRODUCTS_PER_PAGE` (ou le passer en prop au client) et l'utiliser des deux côtés.
- **Confiance** : haute

### [WS02-08] Mapping/traductions `categories` morts (aucun tag_type `categories` en base) — P3
- **Fichier** : `src/components/catalogue/CatalogueSidebar.tsx:25-30`, `FiltersMobileSheet.tsx:8-13`, clés `Filters.tagTypes.categories` (fr/es/en)
- **Catégorie** : dette (code mort, confiance haute)
- **Constat** : `TAG_TYPE_KEY`/`TAG_TYPE_TRANSLATION` mappent `categories → 'categories'` et une clé i18n `Filters.tagTypes.categories` existe dans les 3 locales, mais la DB live n'expose **que** `besoins`, `ingredients`, `types-peau` (vérifié). La branche `categories` n'est jamais rendue (itemsByType ne contient pas la clé).
- **Impact** : aucun bug fonctionnel (le rendu se base sur `itemsByType`), mais entrées mortes qui induisent en erreur et faussent les audits de parité i18n.
- **Reco** : soit créer le tag_type `categories` si prévu, soit retirer le mapping + les clés i18n. Confiance haute (grep + DB live concordants).
- **Confiance** : haute

### [WS02-09] Espace parasite avant `.trim()` dans le parse de `q` — P3
- **Fichier** : `src/lib/catalogueFilters.ts:96`
- **Catégorie** : dette (cosmétique)
- **Constat** : `const q = (typeof sp.q === 'string' ? sp.q : '') .trim()` — espace entre `)` et `.trim()`. Fonctionnellement correct, juste un nit de style (et un `.trim()` redondant avec le `.trim()` déjà fait dans `readMultiParam`, mais `q` n'utilise pas `readMultiParam`, donc le trim est légitime ici).
- **Impact** : nul (lisibilité).
- **Reco** : retirer l'espace.
- **Confiance** : haute

### [WS02-10] Tri alphabétique/`localeCompare` non aligné sur la locale active — P3
- **Fichier** : `src/lib/catalogueFilters.ts:128-142` (`a.name.localeCompare(b.name)`) ; idem `page.tsx` côté tris de marques/gammes (`.sort()` brut l.158/167/134)
- **Catégorie** : i18n
- **Constat** : `localeCompare()` sans argument utilise la locale runtime du serveur (souvent racine/`en`), pas la locale FR/EN/ES de l'utilisateur. Les noms accentués/Ñ peuvent être ordonnés différemment de l'attente d'un utilisateur ES. Les `Array.prototype.sort()` bruts sur `allBrands`/`allRanges` (`page.tsx:158,167`) trient par code unité UTF-16, pas linguistiquement.
- **Impact** : ordre alphabétique légèrement « faux » pour les chaînes accentuées (mineur, surtout que les noms de produits/marques sont majoritairement ASCII). Pas de bug fonctionnel.
- **Reco** : passer la locale active à `localeCompare(b.name, locale, { sensitivity: 'base' })` pour le tri produits ; idem pour les tris de facettes si l'ordre visuel doit être linguistique.
- **Confiance** : moyenne

## Points positifs (court)
- **Synchronisation filtres↔URL solide** : `parseFilters`/`buildCatalogueUrl` round-trippent proprement (match par nom *ou* slug via `matchName`, normalisation NFD correcte vérifiée) ; entrées invalides filtrées (`.filter(v => !!v)`), `page` borné `Math.max(1, …)`, `sort` whitelisté. Pas d'injection possible via querystring.
- **Frontière SSR/Client nette** : tout le calcul (filtre, tri, pagination, faceting) est fait **côté serveur** ; le client ne reçoit que la page courante + les comptes, et navigue via `router.push(..., { scroll })` dans une `useTransition` (overlay `opacity-70` pendant la navigation). Pas de fetch client redondant.
- **a11y globalement soignée** : `nav` avec `aria-label`, `aria-current="page"` sur la page active, `aria-label` de suppression de filtre, checkboxes natives `<input>`+`<label>`, `indeterminate` géré via ref, focus-visible cohérent, sheet mobile sur `<dialog>` natif (focus trap/Esc/scroll-lock gratuits) avec snapshot+revert.
- **i18n complet et à parité** FR/ES/EN sur toutes les clés du périmètre (vérifié : `gridShowing`, `headerTitle`, `sortOptions`, `tagTypes`, `MobileFilters`).
- **Faceting « disjonctif correct »** : `computeFacetedCounts` exclut la dimension courante (`excludeBrand`/`excludeRange`/`excludeTagType`) → les compteurs reflètent bien « combien si je coche aussi celui-ci », pattern e-commerce correct.

## Signalements hors périmètre (1 ligne chacun, max 5)
- `besoins/[slug]/page.tsx:56` et l'`og:image` (l.81-87) partagent le **même** défaut d'image non ordonnée que WS02-02 (cause racine commune : table `product_images` sans colonne d'ordre).
- `next.config.ts:68,89-95` : `img-src https:` + `remotePatterns hostname: '**'` autorisent **n'importe quel hôte HTTPS** pour `<Image>` (les vignettes catalogue en bénéficient) — surface large, à resserrer sur le domaine Storage Supabase.
- `ProductCard.tsx` (consommateur direct du catalogue) : `StockBadge` mélange `text-brick-600` + `before:bg-clay-600` pour l'état « low » (couleur point ≠ couleur texte) — incohérence visuelle mineure.
- CSP **ne contient plus `unsafe-eval`** (`next.config.ts:65` utilise un hash sha256 du script anti-flash) → le finding historique « CSP unsafe-eval » semble **résolu** ; à confirmer par WS sécurité/headers.

## Zones non couvertes / à re-vérifier humainement
- Comportement réel du pager (WS02-01) à **vérifier en navigateur** sur les 3 dernières pages (warning React + double tuile) — non lançable ici en mode lecture seule.
- Coût serveur effectif du faceting (WS02-04) sous charge réelle : non profilé (estimation analytique seulement).
- Rendu du tri `localeCompare` (WS02-10) selon la locale de déploiement Vercel (dépend de l'environnement Node de prod).
