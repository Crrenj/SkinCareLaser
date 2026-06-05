# WS15 — Admin Stock + Tags + Annonce

**Périmètre** : `src/app/admin/stock/**` (page + StockEditModal + StockHelpers + useStockData + types) · `src/app/admin/tags/**` (page + ColorPicker + IconPicker + TagCategoryGrid + TagModal + TagStatsCards + TagTypeModal + useTagsData + icons + types) · `src/app/admin/annonce/**` (page + BannerDeleteModal + BannerFormModal + BannerTypeGuide + BannersList + BannersPreview + useBannersData + types) · `src/components/admin/HomeLayoutPanel.tsx`
**Fichiers lus** : 23 in-scope + ~12 hors-périmètre (routes API, schemas Zod, homeSections, useModalA11y, page home, RPC `reorder_banners`, ImageUploadField, messages i18n) · **Lignes parcourues (approx.)** : ~2 400
**Synthèse** : P0=0 · P1=0 · P2=6 · P3=7

## Findings

### [WS15-01] `swapPositions` réordonne via 2 PUT parallèles qui double-appliquent `reorder_banners` — dérive de positions possible — P2
- **Fichier** : `src/app/admin/annonce/_hooks/useBannersData.ts:61-92` (+ route `src/app/api/admin/banners/route.ts:124-138`, RPC `db/schema.sql:823-838`)
- **Catégorie** : logique-métier | data
- **Constat** : Pour échanger deux bannières adjacentes, `swapPositions` envoie **en parallèle** (`Promise.all`) deux PUT, chacun avec le `position` cible de l'autre. Or le handler PUT, quand `position` diffère de la position courante en base, appelle d'abord `reorder_banners` (qui **décale toutes** les bannières de l'intervalle) **puis** persiste aussi `position` directement via `.update({...position})`. Les deux requêtes lisent la position courante de façon concurrente (course) et déclenchent chacune un `reorder_banners` sur des intervalles qui se chevauchent ; le décalage appliqué par l'une à une 3ᵉ bannière n'est jamais corrigé. Avec 2 bannières, le résultat retombe juste par chance ; avec ≥3 bannières, échanger deux éléments du milieu peut laisser une 3ᵉ bannière décalée → positions dupliquées ou « trouées ». Aucune contrainte `UNIQUE` sur `banners.position` (seulement un index, baseline:209/247) ne protège contre la collision.
- **Impact** : ordre des bannières de la home incohérent après quelques réordonnancements (positions dupliquées → tri non déterministe). Pas de perte de donnée, mais comportement visuellement erratique pour l'admin.
- **Reco** : ne pas combiner `reorder_banners` ET `.update(position)` dans le même PUT ; pour un swap simple, faire un seul appel atomique (RPC dédiée `swap_banner_positions(a,b)` en transaction) ou sérialiser les deux PUT (`await` l'un puis l'autre) et retirer le `position` du payload de toggle/edit quand il n'a pas changé. Idéalement ajouter une `cleanup_banner_positions()` (déjà existante, db/schema.sql:841) après chaque mutation d'ordre.
- **Confiance** : moyenne (corruption certaine en théorie ≥3 bannières concurrentes ; masquée à 2 bannières — l'état DB actuel n'a que 3 bannières contiguës).

### [WS15-02] `BannerDeleteModal` entièrement codé en dur en espagnol (hors i18n) — P2
- **Fichier** : `src/app/admin/annonce/_components/BannerDeleteModal.tsx:47-66`
- **Catégorie** : i18n
- **Constat** : Le modal de suppression n'utilise **aucune** clé `useTranslations` : « Eliminar anuncio », « Vas a eliminar este anuncio. Las impresiones acumuladas se perderán. », « Mantener », « Sí, eliminar » sont en dur. L'admin est censé être entièrement localisé FR/ES/EN (cf. CLAUDE.md « Admin entièrement localisé »). En mode FR ou EN, ce modal s'affiche en espagnol. De plus le texte « Las impresiones acumuladas se perderán » (les impressions accumulées seront perdues) **ment** : le tracking de vues/impressions est dormant et jamais incrémenté (champs `view_count`/`click_count` non branchés), donc rien n'est « perdu ».
- **Impact** : incohérence linguistique visible (espagnol forcé dans un panneau FR/EN) + promesse fausse à l'utilisateur.
- **Reco** : migrer vers un namespace `Admin.annonce.delete.*` (ou réutiliser `useConfirmDialog` comme la page tags) ; supprimer la mention des impressions.
- **Confiance** : haute.

### [WS15-03] Libellés du sélecteur d'icônes en dur en français + aria-label ColorPicker en dur — P2
- **Fichier** : `src/app/admin/tags/_lib/icons.ts:63-88` · `src/app/admin/tags/_components/ColorPicker.tsx:21` · `src/app/admin/tags/_components/TagModal.tsx:107`
- **Catégorie** : i18n | a11y
- **Constat** : (a) `iconOptions[].label` (« Dossier », « Cœur », « Bécher », « Étoiles »…) sont en **français en dur** ; ces labels alimentent l'attribut `title` de chaque bouton dans `IconPicker.tsx:27` → tooltips français même en ES/EN. (b) `ColorPicker.tsx:21` : `aria-label={`Choisir la couleur ${color}`}` français en dur (lu par lecteur d'écran en ES/EN) ; en plus annonce le hex brut (`#3B82F6`) — peu utile. (c) `TagModal.tsx:107` : le hint « Identificador único para URL » est codé en dur en **espagnol** (le reste du modal passe par `Admin.modals.tag.*`), incohérent même avec sa propre langue de fichier.
- **Impact** : mélange de langues dans une UI tri-lingue ; a11y dégradée pour les non-francophones.
- **Reco** : passer ces 3 sources par `useTranslations` (ou n'utiliser que le rendu visuel de l'icône sans label textuel + un aria-label localisé générique).
- **Confiance** : haute.

### [WS15-04] `useStockData.fetchStockData` : double aller-retour réseau au changement de tri/filtre/recherche + race possible — P2
- **Fichier** : `src/app/admin/stock/_hooks/useStockData.ts:19-42`
- **Catégorie** : perf | bug
- **Constat** : `fetchStockData` envoie `status` à l'API et l'API filtre déjà côté serveur (`route.ts:75-77`), mais elle renvoie aussi `stats` calculés sur l'ensemble **non filtré**. Le hook re-fetch à **chaque** changement de `searchTerm` (frappe par frappe, pas de debounce), `filterStatus`, `sortColumn`, `sortOrder` — un GET complet de la table `products` (353 lignes, jointures `ranges`/`brands`) par caractère tapé. Sans annulation (`AbortController`), des réponses lentes peuvent arriver dans le désordre et écraser un état plus récent (race d'affichage). Le filtrage par statut est en plus fait **deux fois** (serveur dans `route.ts` ET implicitement client) alors que le tri/recherche pourraient rester 100 % serveur.
- **Impact** : charge réseau/DB inutile (1 requête/touche), latence perçue, scintillement possible des résultats sur connexion lente.
- **Reco** : debounce sur `searchTerm` (~250 ms) ; `AbortController` pour annuler la requête précédente ; ou bien tout filtrer/trier client-side après un fetch unique (la table est petite — 353 lignes).
- **Confiance** : moyenne.

### [WS15-05] `HomeLayoutPanel` : `useEffect` de chargement dépend de `t` → risque de re-fetch en boucle — P2
- **Fichier** : `src/components/admin/HomeLayoutPanel.tsx:21-29`
- **Catégorie** : perf | bug
- **Constat** : Le `useEffect` qui `fetch('/api/admin/home-layout')` a `[t]` en dépendance (la fonction `useTranslations('Admin.homeLayout')`). `t` n'est pas garanti stable d'un render à l'autre selon la version de next-intl ; si sa référence change (re-render du provider, changement de locale via le cookie admin), l'effet se relance et **rappelle l'API** + écrase l'état local (perdant les modifications non sauvegardées via `setLayout(resolveHomeLayout(...))`). `t` n'est utilisé que dans le `.catch` pour un toast — il n'a aucune raison de piloter le fetch.
- **Impact** : requête superflue et, surtout, **perte des réorganisations en cours** si le composant re-render (l'utilisateur déplace des sections, la locale/refresh recharge, son travail saute avant le Save).
- **Reco** : retirer `t` des deps (le fetch ne doit tourner qu'au mount → `[]`), capter `t` via `useRef` ou ignorer le lint sur cette ligne précise ; ou ne pas réinitialiser `layout` si `dirty`.
- **Confiance** : moyenne (dépend du comportement de stabilité de `t` ; le pattern est néanmoins fragile).

### [WS15-06] `StockEditModal` : prix affiché brut sans formatage monétaire — P2
- **Fichier** : `src/app/admin/stock/_components/StockEditModal.tsx:66`
- **Catégorie** : bug | logique-métier
- **Constat** : `{item.price} {item.currency.toUpperCase()}` affiche le nombre brut (ex. `1500 DOP`) sans séparateur de milliers ni décimales cohérentes, alors que le projet centralise `formatPrice()` (`src/lib/formatPrice.ts`) précisément pour ça. Pour des prix DOP (souvent > 1 000), l'absence de séparateur nuit à la lisibilité ; un `price` à virgule (`1499.9`) s'afficherait tel quel.
- **Impact** : incohérence d'affichage des prix dans l'admin vs le reste du site ; lisibilité.
- **Reco** : utiliser `formatPrice(item.price, ...)` (ou `Intl.NumberFormat`) comme ailleurs.
- **Confiance** : haute.

### [WS15-07] `StockPill` gère un statut `excess` jamais produit — code/i18n mort partiel — P3
- **Fichier** : `src/app/admin/stock/_components/StockHelpers.tsx:23-42` · `src/app/admin/stock/_lib/types.ts:7` · `src/messages/{fr,es,en}.json` (`Admin.stockState.excess`)
- **Catégorie** : dette
- **Constat** : `StockItem.status` inclut `'excess'` et `StockPill` a une branche `excess` (+ clé i18n « Excédent »), mais l'API (`route.ts:7-11 getStockStatus`) ne renvoie jamais que `'ok'|'low'|'out'`. La branche `excess`, son entrée dans `map`, et la clé de traduction sont donc inatteignables. Idem : `StockItem.range_name` (types.ts:9) est mappé par l'API mais **jamais affiché** dans la page (seul `brand_name` l'est).
- **Impact** : code/traductions morts, source de confusion (laisse croire à une logique « surstock » inexistante).
- **Reco** : soit implémenter le seuil d'excédent, soit retirer `excess` du type/pill/i18n et `range_name` du payload si inutile.
- **Confiance** : haute (vérifié par grep : `excess` absent de l'API stock ; `range_name` jamais rendu).

### [WS15-08] `BANNER_TYPE_LABELS` exporté mais inutilisé — code mort — P3
- **Fichier** : `src/app/admin/annonce/_lib/types.ts:67-77`
- **Catégorie** : dette
- **Constat** : `BANNER_TYPE_LABELS` (map des 9 types vers libellés FR) n'est importé nulle part (`grep -rn BANNER_TYPE_LABELS src/` → seule la définition). Le modal affiche le type via `capitalize` du nom brut (`BannerFormModal.tsx:109`), pas via ce map.
- **Impact** : code mort (faible).
- **Reco** : supprimer l'export, ou l'utiliser pour afficher des libellés propres.
- **Confiance** : haute (grep effectué sur tout `src/`).

### [WS15-09] Pas de UI pour `featured_on_home` dans l'admin tags alors que la home en dépend — P3
- **Fichier** : `src/app/admin/tags/page.tsx` (absence) · consommé par `src/app/[locale]/page.tsx:315` (`.eq('featured_on_home', true)`)
- **Catégorie** : logique-métier
- **Constat** : La home sélectionne les 3 cards « Besoins » via les tags marqués `featured_on_home=true`. Or l'écran d'administration des tags (et ses modaux `TagModal`/`TagTypeModal`) **n'expose aucun contrôle** pour cocher/décocher `featured_on_home` sur un tag. Le seul moyen de curer ces cards est un UPDATE SQL manuel (CLAUDE.md mentionne d'ailleurs « 3 tags `featured_on_home=true` » posés à la main). La colonne existe dans `database.types.ts:780` et est lue par le front, mais jamais écrite par l'UI.
- **Impact** : fonctionnalité de curation non pilotable par l'admin ; nécessite un accès DB. Gap fonctionnel (pas un bug de régression).
- **Reco** : ajouter un toggle `featured_on_home` dans `TagModal` + colonne au payload PATCH `/api/admin/tags/[id]` (le schema `tagPatch` ne l'accepte pas non plus). À prioriser selon la roadmap V1.
- **Confiance** : haute (grep : aucune écriture de `featured_on_home` côté admin).

### [WS15-10] `IconPicker` / boutons d'icônes & couleurs hors tokens de thème (purple-500/50) — P3
- **Fichier** : `src/app/admin/tags/_components/IconPicker.tsx:23-24` · `src/app/admin/tags/_lib/icons.ts:92-103` (`colorOptions`)
- **Catégorie** : dette | a11y
- **Constat** : (a) L'état sélectionné du `IconPicker` utilise `border-purple-500 bg-purple-50` — couleurs Tailwind par défaut **hors du système de thèmes** (`sand/ink/clay/olive/brick/ochre`). Elles ne se re-thématisent pas et jurent avec les 6 palettes (le reste de l'écran utilise `clay-700`). (b) `colorOptions` propose 10 couleurs vives génériques (`#3B82F6`…) sans rapport avec la palette FARMAU ; appliquées comme `tag_type.color`, elles s'affichent telles quelles sur la home/catalogue. Pas un bug fonctionnel mais une dérive visuelle.
- **Impact** : incohérence visuelle de l'admin (état sélectionné violet) et possibilité de couleurs de tags hors charte.
- **Reco** : remplacer `purple-*` par `clay-*`/`ink-*` (cf. ColorPicker qui utilise `border-ink-900`) ; aligner `colorOptions` sur la palette du projet.
- **Confiance** : haute (purple non défini comme token thémé — rendu par le défaut Tailwind, donc non-thématisable).

### [WS15-11] `parseInt` sans radix dans le stepper de stock — P3
- **Fichier** : `src/app/admin/stock/_components/StockEditModal.tsx:61`
- **Catégorie** : bug
- **Constat** : `parseInt(e.target.value) || 0` sans radix explicite. Pour un `<input type="number">` le risque est faible (la valeur est numérique), mais c'est une mauvaise pratique ; et `|| 0` transforme toute saisie vide/NaN en `0` silencieusement (l'utilisateur qui efface le champ pour retaper voit `0`). Par ailleurs `value={stock}` n'est pas borné en sortie : `min={0}` est un garde HTML mais `setStock` accepte n'importe quel entier ≥0 (l'API valide `>=0` côté Zod, donc OK).
- **Impact** : ergonomie (saut à 0 en cours d'édition) ; nit de robustesse.
- **Reco** : `parseInt(value, 10)` + gérer la chaîne vide sans forcer 0 (état string ou `Number.isNaN` → garder l'ancienne valeur).
- **Confiance** : haute.

### [WS15-12] `useBannersData.toggleActive` : message d'erreur en dur en français + concaténation — P3
- **Fichier** : `src/app/admin/annonce/_hooks/useBannersData.ts:51` (`'Erreur lors de la mise à jour: ' + data.error`)
- **Catégorie** : i18n
- **Constat** : Le toast d'erreur du toggle est en **français en dur** (le reste de la page passe par `tCommon`). De plus il concatène `data.error` brut (message serveur potentiellement technique) dans le toast utilisateur.
- **Impact** : incohérence i18n + fuite de détail serveur côté UI (mineur — l'API renvoie déjà des messages génériques).
- **Reco** : utiliser une clé `Admin.common.saveError` ; ne pas afficher `data.error` brut.
- **Confiance** : haute.

### [WS15-13] `BannersList` n'utilise pas l'index réel de position pour griser les flèches — P3
- **Fichier** : `src/app/admin/annonce/_components/BannersList.tsx:99-114`
- **Catégorie** : bug | a11y
- **Constat** : Les flèches up/down sont grisées via `index === 0` / `index === filtered.length - 1`, où `index` est la position dans le tableau `banners` **déjà trié par position** (`useBannersData` ne re-trie pas explicitement, il dépend de l'ordre de l'API qui fait `.order('position')` — OK). Cohérent tant que l'API renvoie l'ordre par position. Mais si `swapPositions` corrompt les positions (cf. WS15-01), l'ordre du tableau et les bornes des flèches peuvent diverger de l'ordre réel sur la home. Couplage fragile.
- **Impact** : symptôme secondaire de WS15-01 (flèches désactivées sur la mauvaise ligne si positions dupliquées).
- **Reco** : dépend de la correction de WS15-01 ; sinon trier explicitement par `position` avant rendu.
- **Confiance** : basse (conditionné à WS15-01).

## Points positifs (court)
- **a11y modaux solide** : tous les modaux (Stock/Tag/TagType/BannerForm/BannerDelete) utilisent `useModalA11y` (focus-trap, Escape, scroll-lock, restauration focus) + `role="dialog"`/`aria-modal`/`aria-labelledby` corrects ; toggles avec `aria-pressed`.
- **Round-trip slot/status/dates dormants** correctement préservé : `openModal` lit `banner.slot/status/start_date/end_date`, le payload les renvoie, le schema Zod (`bannerCreate`/`bannerUpdate`) les accepte → colonnes intactes sans les exposer dans l'UI (comportement voulu, vérifié).
- **`resolveHomeLayout`** robuste (dédoublonne, ignore clés inconnues, complète les sections manquantes) et **partagé** serveur/client → l'ordre admin et le rendu home ne peuvent pas diverger sur l'ensemble des sections. Dépendance section↔bannière clairement expliquée dans l'i18n.
- **`BannersPreview`** : approche iframe `/fr` mise à l'échelle + `IframeHeightReporter` (postMessage borné à `window.location.origin`, vérification `e.origin` à la réception) — propre et sûr ; `IframeHeightReporter` inerte hors iframe.
- **Tokens de thème** : tous les utilitaires de couleur du périmètre sont déclarés dans `globals.css` (aucun élément invisible) ; `BannerTypeGuide` est un bon ajout pédagogique.

## Signalements hors périmètre (1 ligne chacun, max 5)
- `next.config.ts:89-94` : `remotePatterns` autorise `hostname:'**'` → l'optimiseur d'images Next peut proxy n'importe quel hôte HTTPS (surface SSRF/abus).
- `src/app/api/admin/banners/route.ts:124-149` : le PUT combine `reorder_banners` + `.update(position)` (cause racine côté serveur de WS15-01) — à corriger conjointement.
- `db/schema.sql` / baseline : `banners.position` n'a pas de contrainte `UNIQUE` (seulement un index) → rien n'empêche les doublons de position.
- `src/lib/schemas.ts:74-111` : `image_url`/`link_url` acceptés en `z.string().nullish()` sans validation d'URL (le formulaire envoie `type=url` mais l'API ne revérifie pas).

## Zones non couvertes / à re-vérifier humainement
- Confirmation **runtime** de la corruption de positions de WS15-01 avec ≥3 bannières et réordonnancements rapides (raisonnement statique fait ; non reproduit en navigateur — l'état DB n'a que 3 bannières contiguës).
- Stabilité réelle de la référence `t` de next-intl 4.12 (WS15-05) : à confirmer si `useTranslations` mémoïse `t` (sinon le re-fetch/perte d'état est avéré).
- Comportement du double-fetch stock (WS15-04) sous latence réelle (race d'affichage) — non observé, déduit de l'absence d'`AbortController`/debounce.
