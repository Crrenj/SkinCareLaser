# WS14 — Admin Produits + Marques

**Périmètre** : `src/app/admin/product/page.tsx` + `_components/{ProductFormModal,ProductsTable,TagSelector}.tsx` + `_hooks/useProductsData.ts` + `_lib/types.ts` ; `src/app/admin/marques/page.tsx` + `_components/{BrandFormModal,BrandStatsCards,BrandsTable,RangeFormModal}.tsx` + `_hooks/useBrandsData.ts` + `_lib/types.ts`. (Cross-lecture hors périmètre pour validation : `src/app/api/admin/{products,products/[id],products/with-tags,brands,brands/[id],ranges,ranges/[id]}/route.ts`, `src/lib/schemas.ts`, `src/lib/slug.ts`, `src/hooks/useModalA11y.ts`.)
**Fichiers lus** : 14 (périmètre) + 9 (cross-réf) · **Lignes parcourues (approx.)** : ~1 350
**Synthèse** : P0=0 · P1=2 · P2=6 · P3=7

> Note : la plupart des défauts « payload/validation » ci-dessous ont leur **cause** dans les routes API (hors périmètre strict), mais ils sont **déclenchés directement** par les payloads que ces composants envoient (`JSON.stringify(formData)` brut). Je les rapporte car le périmètre WS14 est explicitement chargé de juger « l'alignement des payloads avec Zod côté API » et « le trou mass-assignment ». Les findings dont la cause est purement dans la route sont marqués comme tels.

## Findings

### [WS14-01] Génération de slug vide pour les noms non-latins → collision sur contrainte UNIQUE — P1
- **Fichier** : `src/lib/slug.ts:6-13` (appelé depuis `ProductFormModal.tsx:112`, `BrandFormModal.tsx:84`, `RangeFormModal.tsx:103`)
- **Catégorie** : bug / data
- **Constat** : `generateSlug` fait `.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')`. Pour un nom 100 % non-ASCII (ex. « 资生堂 », « مرحبا », un nom uniquement emoji/symboles, ou même un nom dont tous les caractères tombent hors `[a-z0-9]` après normalisation), le résultat est la **chaîne vide**. Les 3 modaux pré-remplissent alors le champ slug avec `''`. Le champ `<input required>` empêche un submit *totalement* vide, mais : (a) si l'utilisateur tape un nom latin **puis** le remplace par un nom non-latin, le slug auto repasse à `''` et l'input `required` HTML bloque — OK ; (b) en revanche, dès que l'utilisateur **complète manuellement** un slug identique à un existant, ou si **deux** produits/ marques différents génèrent le **même** slug (ex. « Crème N°1 » et « Crème N°2 » → tous deux `creme-n`), l'INSERT viole `products_slug_key` / `brands_*_key` (UNIQUE, confirmé en base : `products_slug_key UNIQUE (slug)`).
- **Impact** : pour `brands`/`ranges`, la route mappe `23505 → 409` avec message clair. Mais pour **`products`**, la route POST/PATCH **n'intercepte PAS `23505`** (cf. WS14-03) → l'admin reçoit un 500 générique « Erreur lors de la création du produit » sans comprendre que c'est une collision de slug. Marché RD = noms de marques internationales (asiatiques possibles) → risque réel mais pas quotidien.
- **Reco** : (1) faire en sorte que `generateSlug` produise un fallback non-vide quand le résultat est `''` (ex. translittération basique, ou suffixe horodaté/`product`); (2) côté route produits, intercepter `error.code === '23505'` et renvoyer un 409 explicite comme le font déjà brands/ranges.
- **Confiance** : moyenne (le cas « tout non-latin » est rare ; la collision « deux noms qui se réduisent au même slug », ex. « N°1 »/« N°2 », est tout à fait plausible).

### [WS14-02] Mass-assignment sur création produit : `body` brut inséré après un Zod `.passthrough()` — P1
- **Fichier** : `src/app/admin/product/page.tsx:68` (envoie `JSON.stringify(formData)`) → cause dans `src/app/api/admin/products/route.ts:80-83,130-136`
- **Catégorie** : sécurité / data
- **Constat** : la page poste `formData` tel quel. Côté route, `productCreate` est un schéma Zod **`.passthrough()`** (`schemas.ts:164-171`) : il valide `name`/`slug`/`brand_id`/… mais **laisse passer toute autre clé**. Pire, la route n'utilise même pas `parsed.data` : elle re-destructure le **`body` brut** (`const { brand_id, range_id, selectedTags, imageFile, ...productData } = body`) et insère `...productData` directement (`insert({ ...productData, currency: …, range_id: … })`). Le `products` (vérifié en base) expose `is_active`, `is_featured`, `is_new`, `old_price`, `currency`, `created_at`, `updated_at`, `pharmacist_advice`, etc. Un payload `{ name, slug, price, is_featured:true, old_price:1, currency:'USD', created_at:'1970-…' }` serait inséré **sans contrôle**. La surface n'est exploitable que par un admin authentifié (`requireAdmin`), donc pas d'escalade de privilège ; mais c'est une faille d'intégrité de données : un admin (ou un client API admin compromis/buggé) peut écrire des colonnes jamais prévues par l'UI (featuring sur la home, devise hors `DOP`, dates antidatées).
- **Impact** : intégrité des données produit (home featuring, devise, flags promo) modifiable hors UI ; pas de bornage des champs. Combiné avec WS14-03 (PATCH sans Zod du tout), c'est le trou mass-assignment évoqué dans le brief.
- **Reco** : remplacer `.passthrough()` par un schéma **strict** (`z.object({...}).strict()` ou whitelist explicite des colonnes éditables : `name, slug, description, price, stock, currency`) et **insérer `parsed.data`**, pas `body`. Idem PATCH (WS14-03).
- **Confiance** : haute (lu ligne par ligne dans la route + colonnes confirmées en base).

### [WS14-03] PATCH produit : aucune validation Zod, `body` brut updaté — P1 (cause API, déclenché par WS14)
- **Fichier** : `src/app/admin/product/page.tsx:64-69` (PATCH `JSON.stringify(formData)`) → cause dans `src/app/api/admin/products/[id]/route.ts:17-19,64-72`
- **Catégorie** : sécurité / data
- **Constat** : la route PATCH ne fait **aucun** `parseBody`. Elle lit `const body = await req.json()`, destructure, et `update({ ...updateData, updated_at })`. Donc : (a) aucun bornage de type (`price:"NaN"`/négatif n'est arrêté que par le CHECK `price>=0` de la DB → 500 générique, pas de 400 propre) ; (b) mass-assignment complet (mêmes colonnes que WS14-02) ; (c) `name` peut être absent (le PATCH partiel n'est jamais utilisé par l'UI, mais rien ne l'empêche). Le commentaire du brief « PATCH produits n'a aucune validation Zod » est **confirmé exact**.
- **Impact** : identique WS14-02 + erreurs DB remontées en 500 opaques. C'est une incohérence nette : brands/ranges/tags PATCH valident tous via Zod, products non.
- **Reco** : introduire un `productUpdate` Zod strict (champs optionnels, types bornés) et l'appliquer avant l'`update`.
- **Confiance** : haute.

### [WS14-04] `parseFloat`/`parseInt` non gardés → `NaN` envoyé pour prix/stock — P2
- **Fichier** : `ProductFormModal.tsx:171` (`parseFloat(e.target.value)`) et `:185` (`parseInt(e.target.value, 10)`)
- **Catégorie** : bug
- **Constat** : `onChange` écrit `price: parseFloat(e.target.value)` et `stock: parseInt(e.target.value, 10)` directement dans le state. Si le champ devient vide ou invalide, ces fonctions renvoient `NaN`. `NaN` dans le state → `JSON.stringify({price:NaN})` sérialise `price` en **`null`**. Côté création, `null` sur une colonne `price NOT NULL` → 500 ; côté édition, idem. Le `<input type="number" required min="0">` aide (le navigateur bloque le submit si vide *au moment du submit*), mais le state intermédiaire `NaN` est déjà incohérent et l'affichage `value={form.price}` montre alors une valeur vide/`NaN`. Le garde-fou repose entièrement sur la validation HTML native (contournable, et absente côté API à cause de WS14-02/03).
- **Impact** : cas limite menant à un 500 opaque plutôt qu'à un message clair ; UX dégradée quand on efface le champ prix.
- **Reco** : `const v = parseFloat(e.target.value); onFormChange({ ...form, price: Number.isNaN(v) ? 0 : v })` (idem stock) ; et borner côté Zod (WS14-02/03).
- **Confiance** : haute.

### [WS14-05] `TagSelector` : titre codé en dur en français, hors i18n — P2
- **Fichier** : `src/app/admin/product/_components/TagSelector.tsx:18` (« Tags du produit »)
- **Catégorie** : i18n
- **Constat** : le composant n'importe **pas** `useTranslations` (confirmé : 0 occurrence de `next-intl` dans le fichier) et affiche le littéral « Tags du produit ». Tout le reste de l'admin est localisé FR/ES/EN ; ce titre reste en français même en session ES/EN. Ce n'est **pas** une des exceptions intentionnelles (les widgets dashboard `src/components/admin/dashboard/*` le sont, pas ce composant de formulaire).
- **Impact** : régression de parité i18n visible dans le modal produit pour les admins ES/EN.
- **Reco** : ajouter une clé `Admin.modals.product.tagsTitle` (FR/ES/EN) et l'utiliser via `useTranslations('Admin.modals.product')`.
- **Confiance** : haute.

### [WS14-06] `TagSelector` : classe `text-white` littérale + `text-md` inexistante (Tailwind v4) — P2
- **Fichier** : `TagSelector.tsx:16` (`text-md`), `:44` (`text-white`)
- **Catégorie** : a11y / dette (thème)
- **Constat** : (a) `text-md` **n'existe pas** en Tailwind (les tailles sont `text-sm`/`text-base`/`text-lg`…) → la règle ne génère rien, le `<h4>` retombe sur la taille héritée (effet silencieux, pas de crash). (b) `text-white` est une couleur **littérale** : sur un tag sélectionné, le texte est forcé blanc sur `backgroundColor: type.color`. Le reste de l'admin a migré ses littéraux `bg-white`/`text-white` vers les tokens `sand`/`ink` pour le dark mode (cf. CLAUDE.md « 72 utilitaires `bg-white`/`gray-*` → tokens »). En mode sombre admin, `text-white` reste blanc — souvent OK sur une pastille colorée, mais c'est une dérive du système de thème et le contraste dépend de `type.color` (non garanti WCAG si `type.color` est clair).
- **Impact** : `text-md` = nit silencieux ; `text-white` = incohérence thème + contraste non garanti sur tags à couleur claire.
- **Reco** : `text-md` → `text-sm`/`text-base` ; `text-white` → token (ou calcul de contraste sur `type.color`). Cohérent avec les autres pastilles colorées (ProductsTable utilise `color: var(--color-ink-800)` fixe + pastille colorée, pas de texte sur fond coloré).
- **Confiance** : haute.

### [WS14-07] `BrandsTable` empty-state : `dangerouslySetInnerHTML` sur une chaîne i18n — P2
- **Fichier** : `src/app/admin/marques/_components/BrandsTable.tsx:59`
- **Catégorie** : sécurité (XSS) / dette
- **Constat** : l'état vide rend `dangerouslySetInnerHTML={{ __html: t.raw('emptyState') as string }}`. La source est un message de traduction statique (`Admin.marques.emptyState`), donc **pas** d'entrée utilisateur → pas d'XSS exploitable **aujourd'hui**. Mais c'est un anti-pattern : (a) `t.raw()` court-circuite l'échappement next-intl ; (b) si un jour `emptyState` est rendu interpolable ou alimenté autrement, ça devient un vecteur ; (c) next-intl fournit `t.rich()` avec des handlers de tags pour exactement ce besoin (insérer un `<br/>`/`<b>`), sans HTML brut.
- **Impact** : faible aujourd'hui (chaîne constante), mais dette de sécurité + dérive du pattern. ProductsTable, lui, gère son empty-state en JSX propre (`t('emptyState')`).
- **Reco** : remplacer par `t.rich('emptyState', { br: () => <br/>, … })` ou un rendu JSX. Au minimum, documenter pourquoi le HTML brut est nécessaire.
- **Confiance** : haute (sur le pattern ; basse sur l'exploitabilité réelle actuelle).

### [WS14-08] Listes statiques (brands/tags/tag-types) chargées une seule fois au mount → désynchro après CRUD marque — P2
- **Fichier** : `src/app/admin/product/_hooks/useProductsData.ts:56-77`
- **Catégorie** : bug / logique-métier
- **Constat** : `brands`, `tags`, `tagTypes` sont chargés dans un `useEffect(…, [])` (mount unique), avec le commentaire « rarement modifiés ». Mais l'admin peut créer une marque/gamme dans `/admin/marques` puis revenir sur `/admin/product` **sans reload SPA** (navigation interne Next) — or un `<Link>` interne ne remonte pas forcément le composant si Next garde l'arbre. Plus concrètement : si un admin garde l'onglet produits ouvert et qu'une **nouvelle gamme** vient d'être créée ailleurs, le `<select>` gamme du modal produit ne la proposera pas tant que la page n'est pas rechargée. Idem pour un **nouveau tag**. Il n'y a aucun moyen de rafraîchir ces listes sans full reload.
- **Impact** : friction réelle dans le workflow « je crée une marque/gamme, puis j'ajoute un produit dedans » : la gamme fraîche est invisible côté formulaire produit → l'admin croit que ça a échoué.
- **Reco** : soit exposer un `refreshStatic()` et l'appeler, soit migrer ces fetchs vers **SWR** (mise en cache + revalidation au focus, cohérent avec le reste de l'app qui utilise SWR partout — ici le hook utilise `useState`/`useEffect` manuels alors que `useCart`/`useWishlist`/etc. sont en SWR).
- **Confiance** : moyenne (dépend du comportement exact de remontage Next ; le cas « onglet resté ouvert » est certain).

### [WS14-09] `refreshProducts` repasse `loading=true` → la table entière clignote (skeleton) à chaque save/delete/typing — P2
- **Fichier** : `useProductsData.ts:27-53` (+ `ProductsTable.tsx:35-42`)
- **Catégorie** : perf / a11y (UX)
- **Constat** : `refreshProducts` fait `setLoading(true)` au début. Ce hook est utilisé pour : (a) le refetch après création/édition/suppression (`page.tsx:71,93`), (b) le **changement de page**, (c) la **recherche** (chaque frappe → `search` change → `refreshProducts` recréé → `useEffect` relance). À chaque frappe dans la recherche, `loading=true` remplace toute la table par le spinner « Chargement… » (`ProductsTable` retourne early sur `loading`). Il n'y a **pas** de debounce sur la recherche (`page.tsx:134`), donc chaque caractère déclenche un fetch + un flash de spinner. Pas d'optimistic update : après un delete, la ligne ne disparaît qu'après l'aller-retour réseau + un re-render plein écran.
- **Impact** : recherche saccadée (spinner clignotant à chaque touche, un fetch par caractère), et toute mutation fait « sauter » la table. Sur 353 produits c'est gérable mais l'UX est nettement en-dessous du reste de l'app (qui fait des optimistic updates via SWR).
- **Reco** : (1) debounce la recherche (~300 ms) ; (2) distinguer `loading` initial vs refetch (garder l'ancienne liste affichée pendant le refetch — `keepPreviousData` de SWR, ou un flag `isRefetching` qui n'efface pas la table) ; (3) idéalement migrer vers SWR comme le reste.
- **Confiance** : haute.

### [WS14-10] `useProductsData` : `search` injecté brut dans l'URL sans `encodeURIComponent` — P2
- **Fichier** : `useProductsData.ts:31` (`…&search=${search}`)
- **Catégorie** : bug
- **Constat** : `search` (saisie libre) est interpolé directement dans la query string. Un terme contenant `&`, `#`, `+`, `%` ou des espaces casse le parsing côté serveur (`+` devient espace, `&foo=bar` injecte un faux paramètre, `%` seul → décodage invalide). La route fait ensuite `query.or(\`name.ilike.%${search}%,…\`)` côté API — l'interpolation PostgREST est une autre histoire (hors périmètre, à voir par l'audit API/RLS), mais **côté client** l'absence d'`encodeURIComponent` est un bug net.
- **Impact** : recherche cassée/erronée dès qu'on tape un caractère spécial (ex. « q+a », « 50% », « a&b »).
- **Reco** : `…&search=${encodeURIComponent(search)}`.
- **Confiance** : haute.

### [WS14-11] PATCH produit applique `range_id` en **deux** UPDATE séparés (non atomique, requête redondante) — P3
- **Fichier** : `src/app/api/admin/products/[id]/route.ts:64-80` (déclenché par le payload de `page.tsx`/`ProductFormModal`)
- **Catégorie** : perf / dette (cause API)
- **Constat** : le PATCH retire `range_id` de `updateData` (via le destructuring `const { brand_id, range_id, … } = body`) puis fait un **premier** `update({ ...updateData, updated_at })`, et **seulement si `range_id` truthy** un **second** `update({ range_id })`. Conséquences : (a) 2 round-trips DB là où 1 suffirait ; (b) si `range_id` vaut `''`/`null` (produit qu'on veut détacher de sa gamme), le second update **ne s'exécute jamais** → impossible de **vider** la gamme d'un produit via ce PATCH (le `''` est falsy). Le POST, lui, gère bien `range_id` en une fois. Asymétrie POST/PATCH.
- **Impact** : 2 écritures non atomiques (la 2ᵉ peut échouer en laissant le produit partiellement modifié) + impossibilité de retirer une gamme. Le cas « retirer la gamme » est peu fréquent (le select propose toujours une valeur), mais l'asymétrie est un piège.
- **Reco** : inclure `range_id` dans l'unique `update(...)` (en envoyant `range_id: range_id || null`), supprimer le second update.
- **Confiance** : haute.

### [WS14-12] `ProductsTable` pagination : rend **tous** les boutons de page (pas d'ellipsis) — P3
- **Fichier** : `ProductsTable.tsx:202-216`
- **Catégorie** : a11y / dette
- **Constat** : `Array.from({ length: totalPages }, …).map(...)` rend **un bouton par page**. Le catalogue public a déjà été corrigé pour utiliser `buildPageRange` (ellipsis `‹ 1 [2] 3 … 19 ›`, cf. commit `5f69077` mentionné dans CLAUDE.md), mais l'admin produits ne l'utilise pas. Avec `limit=10` et 353 produits → **36 boutons** en ligne. C'est exactement le défaut corrigé côté public mais resté côté admin.
- **Impact** : barre de pagination admin surchargée (36 tuiles), scroll/wrap inélégant, incohérence avec le catalogue.
- **Reco** : réutiliser le helper `buildPageRange` (déjà existant) comme le catalogue.
- **Confiance** : haute.

### [WS14-13] `marques/page.tsx` : `useBrandsData` retourne `ranges` mais la page ne s'en sert pas (le hook fait un fetch inutile) — P3
- **Fichier** : `src/app/admin/marques/_hooks/useBrandsData.ts:14-57` (+ `marques/page.tsx:28` qui déstructure seulement `{ brands, loading, refresh }`)
- **Catégorie** : perf / dette
- **Constat** : le hook fetch **en parallèle** `/api/admin/brands` (qui renvoie déjà `*, ranges(*)` — chaque marque embarque ses gammes) **et** `/api/admin/ranges` (liste plate). Or `marques/page.tsx` ne consomme que `brands` (les modaux de gamme prennent `brands` pour le select, et la table lit `brand.ranges`). La valeur `ranges` retournée par le hook **n'est lue nulle part** dans la page (la page déstructure `{ brands, loading, refresh }`). Le commentaire du hook prétend que `ranges` plat est « nécessaire » pour le select du modal de gamme — c'est **faux** : `RangeFormModal` reçoit `brands`, pas `ranges`. Donc le second fetch `/api/admin/ranges` (et tout son traitement) est **inutile** à chaque mount et à chaque `refresh()`.
- **Impact** : un appel réseau + un re-render d'état superflus à chaque chargement/refresh de la page marques. Code mort partiel (le state `ranges` du hook).
- **Reco** : supprimer le fetch `/api/admin/ranges` et le state `ranges` du hook (ou, si conservé pour une future page, le documenter). Vérifié : `ranges` du hook n'est pas consommé par `marques/page.tsx`.
- **Confiance** : moyenne (confiance haute sur « non consommé par la page » ; le hook n'est utilisé que par cette page — à confirmer qu'aucun autre import n'existe).

### [WS14-14] Hooks : messages d'erreur de config codés en dur en français (hors i18n) — P3
- **Fichier** : `useProductsData.ts:40-44` et `useBrandsData.ts:33-37` (« Configuration manquante: La clé de service Supabase n'est pas configurée. »)
- **Catégorie** : i18n / dette
- **Constat** : deux `toast.error('Configuration manquante: …')` en français brut. Branche d'erreur rare (service-role non configuré), mais c'est de l'UI texte non localisée dans des composants par ailleurs tri-langue. De même `logger.error('Erreur chargement produits:', …)` etc. sont en français (acceptable pour des logs, mais incohérent).
- **Impact** : faible (cas d'erreur de config rarissime en prod).
- **Reco** : extraire vers `Admin.common` (ex. `serviceKeyMissing`) ou au moins accepter le débours comme assumé.
- **Confiance** : haute.

### [WS14-15] `ProductsTable` : valeurs de couleur hexadécimales codées en dur pour l'état « low stock » — P3
- **Fichier** : `ProductsTable.tsx:154` (`text-[#B5852B]`), `:251` (`#7A5A1C`, `#B5852B`), `:80-83` (`rgba(181,133,43,…)`, `rgba(139,58,46,…)`)
- **Catégorie** : dette (thème)
- **Constat** : l'état « low » et les surbrillances de lignes utilisent des hex/rgba littéraux au lieu des tokens `ochre`/`olive`/`brick` définis dans `globals.css`. CLAUDE.md insiste sur le fait que les statuts (olive/brick/ochre) sont **non thémés** mais existent comme tokens — l'usage de `#B5852B` brut court-circuite cette palette et figera la couleur quel que soit le thème/mode. Le `StockPill` mélange d'ailleurs `bg-olive-600/15` (token) et `bg-[rgba(181,133,43,0.15)]` (littéral) → incohérence interne.
- **Impact** : faible (couleurs statiques par design), mais dérive du système de tokens et incohérence visuelle potentielle en dark mode.
- **Reco** : remplacer par les tokens `ochre`/`olive`/`brick` (cf. la palette « low » des KPI de `/admin/stock` qui utilise déjà `ochre`).
- **Confiance** : moyenne.

### [WS14-16] `ProductsTable` : `opacity-60 group-hover:opacity-100` sans `group` parent → actions toujours à 60 % — P3
- **Fichier** : `ProductsTable.tsx:168`
- **Catégorie** : dette (UX) / bug visuel
- **Constat** : la cellule d'actions a `opacity-60 group-hover:opacity-100`, mais aucun ancêtre n'a la classe `group` (la `<tr>` ligne 76 ne la porte pas). `group-hover:` ne se déclenche donc **jamais** → les icônes Éditer/Supprimer restent figées à `opacity-60`. L'intention (révéler au survol de la ligne) est cassée.
- **Impact** : cosmétique — les boutons d'action sont légèrement ternes en permanence au lieu de s'éclaircir au survol. Aucune perte de fonctionnalité (les boutons restent cliquables).
- **Reco** : ajouter `group` sur la `<tr>`, ou retirer le `group-hover:opacity-100` mort et fixer une opacité unique.
- **Confiance** : haute.

## Points positifs (court)
- **A11y des modaux solide** : `useModalA11y` (focus trap + Escape + scroll lock + restauration focus) est correctement branché sur les 3 modaux, avec `role="dialog"`, `aria-modal`, `aria-labelledby`, `tabIndex=-1`, `stopPropagation` sur le panneau et `onClose` sur le backdrop. Les `aria-label`/`aria-expanded`/`aria-pressed`/`aria-current` sont présents dans les tables et le TagSelector.
- **`onClose` stable pour `useModalA11y`** : les 3 modaux reçoivent `onClose={() => setShowModal(false)}`. Bien que recréé à chaque render, le `useEffect` du hook dépend de `[open, onClose]` mais ne ré-exécute son corps utile que sur `open` (le cleanup/re-setup à chaque render est inoffensif ici : pas de double scroll-lock car symétrique). Pas de fuite constatée. (Une mémoïsation `useCallback` côté page serait plus propre, mais ce n'est pas un bug — cf. zone à re-vérifier.)
- **Garde-fous de suppression côté API bien pensés** : brands/ranges refusent la suppression s'il reste des gammes/produits liés, avec messages clairs et codes HTTP corrects ; brands/ranges/tags mappent `23505 → 409`.
- **Génération de slug désactivée en édition** : les 3 modaux ne régénèrent le slug que pour une **création** (`editingX ? form.slug : generateSlug(...)`), évitant de casser une URL existante — bon réflexe SEO.
- **Découpage propre** : page/_components/_hooks/_lib bien séparés, types colocalisés, validation Zod présente sur brands/ranges (le trou est circonscrit aux produits).

## Signalements hors périmètre (1 ligne chacun, max 5)
- `parseBody(productCreate, body)` puis usage de `body` (pas `parsed.data`) dans `api/admin/products/route.ts` — la validation Zod est purement décorative ici (whitelist contournée par `.passthrough()`).
- `query.or(\`name.ilike.%${search}%,…\`)` dans `api/admin/products/route.ts:38` + `with-tags:35` : interpolation d'entrée utilisateur dans un filtre PostgREST `.or()` — à auditer pour injection de filtre (virgules/parenthèses dans `search`).
- POST `with-tags` et GET produits dupliquent exactement le même mapping `range/brand/image_url` (deux routes, code copié) — factorisable.
- La route PATCH produit fait jusqu'à 5 requêtes DB séquentielles non transactionnelles (update, update range_id, delete+insert images, delete+insert tags) — risque d'état partiel si l'une échoue (pas de transaction).
- `BrandStatsCards` recalcule `avgRanges` mais `kpiRanges` (total) et `kpiBrands` pourraient diverger de l'état DB si le hook ne s'est pas rafraîchi (cohérent avec WS14-08).

## Zones non couvertes / à re-vérifier humainement
- **Comportement de remontage Next sur navigation `/admin/marques` ↔ `/admin/product`** : je n'ai pas pu exécuter l'app (sandbox + tmpfs plein). WS14-08 (listes statiques périmées) dépend de si le hook produits se remonte à chaque navigation interne — à confirmer en navigateur.
- **`Admin.modals.brand.slugHint`** : clé i18n qui **semble** inutilisée (`BrandFormModal` utilise `sectionHint`/`sectionIdentity`, pas `slugHint`). Je n'ai pas pu lancer un `grep` global concluant (tmpfs plein pendant les dernières commandes) → **confiance basse**, à confirmer (`grep -rn "slugHint" src/`). Si confirmé inutilisé : nit dette.
- **`tCommon.rich('pageOf', {page,total})`** (`ProductsTable.tsx:196`) utilise `.rich()` pour une chaîne sans balises rich-text (seulement `{page}`/`{total}`). Fonctionne en next-intl (retourne une string) mais `.rich()` est l'API pour les tags ; `t()` serait correct. Non bloquant, à confirmer qu'aucun warning runtime n'est émis.
- **Injection de filtre PostgREST via `search`** (signalée hors périmètre) : exploitabilité réelle à trancher par l'audit API/RLS.

---
_Note d'exécution : deux artefacts vides ont été créés involontairement à la racine suite à des échecs d'écriture (tmpfs plein) — `.audit-grep.txt` (0 octet) et `.audit-tmp/` (dossier vide). Le sandbox m'a interdit `rm`/`find -delete`. À supprimer manuellement : `rm .audit-grep.txt && rmdir .audit-tmp`._
