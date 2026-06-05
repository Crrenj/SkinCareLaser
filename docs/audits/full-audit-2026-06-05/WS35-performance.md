# WS35 — Performance (transverse)

**Périmètre** : pages SSR `src/app/[locale]/**` (home, catalogue, marques, marques/[slug], besoins/[slug], product/[slug], blog, blog/[slug], a-propos, aide, faq, legal/*, livraison, manifeste, pharmacie, contact, cart, favoris, account/*, reservation/*) · `src/app/admin/_dashboard/data.ts` · `src/app/sitemap.ts` · routes API (`/api/cart`, `/api/search`, `/api/wishlist`, `/api/admin/products`, `/api/admin/reservations`, `/api/admin/sidebar-stats`, `/api/theme`) · helpers fetch (`src/lib/getShopSettings.ts`, `src/lib/getThemeConfig.ts`, `src/lib/supabaseServer.ts`) · composants image (`ProductCard`, `home/*`, `pdp/PdpGallery`) · `next.config.ts`
**Fichiers lus** : ~30 · **Lignes parcourues (approx.)** : ~3 200
**Méthode** : lecture + **`npm run build` réel** (exit 0) → analyse de la table de routes (`●` SSG / `ƒ` Dynamic) et des logs (`DynamicServerError`).
**Synthèse** : P0=0 · P1=4 · P2=6 · P3=3

---

## Findings

### [WS35-01] `getShopSettings` avale le `DynamicServerError` → pages publiques figées sur des **données FALLBACK** (Footer contact/WhatsApp factices) — P1
- **Fichier** : `src/lib/getShopSettings.ts:45-63` (try/catch) ; déclencheur `src/lib/supabaseServer.ts:10` (`cookies()`) ; consommé par `src/components/Footer.tsx:58` (présent sur ~9 pages publiques).
- **Catégorie** : bug / perf / data
- **Constat** : `getShopSettings()` lit `shop_settings` via `createSupabaseServerClient()`, qui appelle `cookies()`. Sur une page SSG, `cookies()` lève `DynamicServerError` — **c'est le signal par lequel Next bascule la page en dynamique**. Mais le `catch (error)` (ligne 59) **intercepte et avale** cette erreur et retourne `FALLBACK` (`shop_name:'FARMAU'`, `whatsapp_number:null`, `contact_phone:null`, `contact_email:null`, `pickup_*:null`, `theme:'terra'`). Le signal n'atteint jamais le framework → la page reste `●` SSG **avec les valeurs FALLBACK bakées dans le HTML statique**. Preuve build : `[getShopSettings] unexpected { message: "Dynamic server usage: Route /[locale]/cart couldn't be rendered statically because it used cookies" }` apparaît 6× dans les logs, **et** `/cart` est tout de même marqué `●` dans la table de routes. Les 8 pages qui importent `Footer` (`faq`, `a-propos`, `manifeste`, `livraison`, `pharmacie`, `contact`, `aide`, `cart` — vérifié par `grep -c "from '@/components/Footer'"`) subissent le même sort.
- **Impact** : le **Footer affiche en permanence les fausses coordonnées** sur toutes les pages SSG : lien WhatsApp → fallback `/contact` au lieu du vrai `wa.me/...`, téléphone/email absents, nom boutique générique. La revalidation ISR rejoue exactement le même chemin `cookies()→throw→catch→FALLBACK` : **elle ne récupère jamais** les vraies données. Idem pour `cart`, `contact`, `pharmacie`, `aide` qui appellent `getShopSettings()` directement pour le bouton WhatsApp. C'est une régression silencieuse de contenu (les coordonnées sont éditées dans `/admin/settings` mais n'apparaissent pas).
- **Reco** : refaire `getShopSettings` sur le modèle **déjà présent** de `getThemeConfig` (`src/lib/getThemeConfig.ts:26-57`) : client anon **sans cookies** (`createClient(url, anonKey, { auth:{persistSession:false} })`) + `unstable_cache` (tag `shop-settings`, `revalidate:300`, invalidé par `revalidateTag` au save `/admin/settings`). Bénéfice double : (a) **données correctes** (plus de FALLBACK silencieux), (b) les pages restent **réellement** statiques/ISR (pas de `cookies()`), une seule requête partagée. Supprimer alors le `catch` qui masque l'erreur (ne garder qu'un fallback sur erreur DB réelle, pas sur `DynamicServerError`).
- **Confiance** : haute (build + grep + comparaison directe avec `getThemeConfig`).

### [WS35-02] `/marques` (index) — N+1 massif : ~3-4 requêtes séquencées **par marque** (13 marques) — P1
- **Fichier** : `src/app/[locale]/marques/page.tsx:46-125` (`fetchBrandCards`)
- **Catégorie** : perf
- **Constat** : pour chaque marque, `Promise.all(brands.map(...))` exécute en série interne : (1) `ranges` de la marque, (2) `products.in(range_id)` pour récupérer les IDs, puis (3) un `Promise.all` de [count actifs `.in(productIds)`] + [1 image `.in(productIds)`]. Soit **~4 requêtes Supabase × 13 marques ≈ 50 round-trips** pour produire la grille. Les `.in(productIds)` portent sur des listes potentiellement larges (jusqu'à toutes les références d'une marque). La page est marquée `ƒ`/`●` selon le cookie-chain mais avec `revalidate=300` l'impact est amorti côté ISR ; reste lourd au premier rendu et à chaque revalidation.
- **Impact** : latence de génération élevée (~50 allers-retours réseau série-parallèle), charge DB inutile. Sur un catalogue qui grandit, dégradation linéaire.
- **Reco** : remplacer par **1-2 requêtes** : soit une vue/`rpc` `brand_cards` (count + image représentative agrégés en SQL), soit fetch `ranges` (1 req) + `products(id, range_id, is_active, product_images(url))` filtré `is_active` (1 req) puis agréger les counts et 1ʳᵉ image **en JS** par `brand_id`. Comparer avec `marques/[slug]/page.tsx:35-58` qui fait déjà bien (2 requêtes).
- **Confiance** : haute.

### [WS35-03] `product/[slug]` — fetch « similaires » télécharge **50 produits complets** pour n'en garder que 2 — P1
- **Fichier** : `src/app/[locale]/product/[slug]/page.tsx:214-234`
- **Catégorie** : perf
- **Constat** : pour les recommandations « tags communs », la page fait `from('products').select(PRODUCT_SELECT).neq('id', …).limit(50)` — `PRODUCT_SELECT` (lignes 133-150) inclut images + `range→brand` + `product_tags→tags_with_types`. Ces **50 produits joints** sont rapatriés puis filtrés en JS (`stepB`) pour ne conserver que **2** éléments (`.slice(0, 2)`). C'est un `limit(50)` arbitraire (ni pertinent ni exhaustif) sur la table entière, payload lourd à chaque rendu de fiche.
- **Impact** : sur **chaque** page produit (`ƒ` dynamique, donc à chaque visite), une requête joint-lourde de 50 lignes pour 2 résultats. Bande passante DB + sérialisation gaspillées ; recommandations en partie aléatoires (dépend des 50 premiers).
- **Reco** : faire la sélection des similaires **en SQL** — filtrer par `product_tags.tag_id IN (tags de la fiche)` côté requête (jointure sur `product_tags`) avec `limit(2)`, ou un `rpc similar_products(p_id)`. À défaut, restreindre le `select` aux colonnes minimales (`id, slug, name, price, currency, product_images(url,alt)`) et borner à `limit(12)`.
- **Confiance** : haute.

### [WS35-04] `catalogue` — fetch de **500 produits joints** à chaque rendu pour afficher 24 + facettes — P1
- **Fichier** : `src/app/[locale]/catalogue/page.tsx:91-116`
- **Catégorie** : perf
- **Constat** : la page SELECT **jusqu'à 500 produits** actifs avec joins (`product_images`, `range→brand`, `product_tags→tags_with_types`) puis filtre/pagine **en JS** (`filterProducts`, `computeFacetedCounts`, `slice` → 24 items via `PRODUCTS_PER_PAGE`). Le filtrage/faceting complet sur 500 lignes tourne **à chaque requête**. Comme la page importe le `Footer` cookie-based (cf. WS35-01) elle est effectivement re-rendue souvent ; même en ISR, chaque revalidation paie le coût. `tags_with_types` est aussi requêtée en entier (ligne 118).
- **Impact** : requête + payload lourds (353 produits réels aujourd'hui, plafond 500) et calcul O(n) de facettes à chaque génération, alors que seules 24 cartes sont rendues. Latence TTFB et charge DB élevées sur la page la plus visitée après la home.
- **Reco** : (a) si le faceting exhaustif est nécessaire pour l'UX, le calculer **une fois** et le cacher (`unstable_cache`, invalidé sur mutation produit) plutôt qu'à chaque requête ; (b) idéalement, paginer côté DB (`.range(offset, offset+24)`) + facettes via agrégats SQL/`rpc` ; (c) au minimum, alléger le `select` (les tags ne servent qu'aux facettes — les charger séparément agrégés, pas par produit).
- **Confiance** : haute (le coût existe indépendamment de WS35-01 ; corriger WS35-01 le rend même *plus* visible car la page redeviendra ISR « propre » mais la requête reste lourde à chaque revalidation).

### [WS35-05] `generateMetadata` + render dupliquent les mêmes requêtes (pas de `cache()` cross-pass) — P2
- **Fichier** : `product/[slug]/page.tsx:52-59 & 185-192` (+ `redirectIfUuid` 53 & 185) ; `besoins/[slug]/page.tsx:73-74 & 113-115` ; `marques/[slug]/page.tsx:66-67 & 106-108`
- **Catégorie** : perf
- **Constat** : `generateMetadata` et le composant page créent **chacun** un `createSupabaseServerClient()` et refont la même lecture (produit par slug / tag par slug / brand par slug). `product/[slug]` exécute en plus `redirectIfUuid` (une requête `products` supplémentaire) **deux fois**. React `cache()` ne dédoublonne pas ici : les deux passes utilisent des instances client distinctes et `getShopSettings`/ces helpers ne sont pas `cache()`-wrappés au bon niveau.
- **Impact** : ~2× les round-trips de résolution par page de détail (4 requêtes au lieu de 2 pour `product`). Multiplié par le trafic des fiches produits.
- **Reco** : extraire la lecture « produit/tag/brand par slug » dans un helper wrappé `react/cache` prenant `slug` en argument (le client peut être créé dans le helper), de sorte que metadata + render partagent **une** requête par render de route. Idem pour `redirectIfUuid`.
- **Confiance** : haute.

### [WS35-06] `admin/_dashboard/data.ts` — `fetchCatalogue` lance **9 requêtes products** dont 5 `count head` redondantes avec le scan complet — P2
- **Fichier** : `src/app/admin/_dashboard/data.ts:251-262`
- **Catégorie** : perf
- **Constat** : `fetchCatalogue` fait déjà un `select('id, is_active, stock, price, range_id, is_featured, is_new, old_price')` sur **tous** les produits (ligne 253) — il a donc toutes les lignes actives en mémoire. Pourtant il lance **5 requêtes `count head` supplémentaires** en parallèle (`volRes`, `inciRes`, `advRes`, `pdfRes`, `benRes`, lignes 257-261) pour compter les non-null de `volume/inci/pharmacist_advice/technical_pdf_url/benefits`. Ces colonnes pourraient être ajoutées au SELECT de la ligne 253 et comptées en JS (comme `withImage` l'est déjà via `imageSet`). Le dashboard agrège ~25 requêtes au total (`getDashboardData`), plusieurs faisant des scans complets de `products`/`reservations`/`profiles`/`carts`.
- **Impact** : 5 round-trips DB évitables par chargement du dashboard ; le dashboard `/admin` est la landing post-login → payé à chaque connexion admin. Pas de cache (`supabaseAdmin`, pas d'`unstable_cache`).
- **Reco** : ajouter `volume, inci, pharmacist_advice, technical_pdf_url, benefits` au `select` de la ligne 253 et dériver les 5 counts dans la boucle `for (const p of active)`. Envisager un `unstable_cache` court (30-60 s) sur `getDashboardData` (admin, données non temps-réel) pour amortir les rechargements/onglets multiples.
- **Confiance** : haute.

### [WS35-07] `GET /api/admin/reservations` — pas de pagination + 2ᵉ scan complet pour les compteurs — P2
- **Fichier** : `src/app/api/admin/reservations/route.ts:35-77`
- **Catégorie** : perf
- **Constat** : le GET sélectionne **toutes** les réservations avec leurs `reservation_items` imbriqués (aucun `.limit()` / `.range()`), puis fait une **2ᵉ** requête `select('status')` sur **toute** la table (lignes 63-66) juste pour compter par statut en JS. Aucune borne.
- **Impact** : croît linéairement avec l'historique des réservations ; à terme payload massif + 2 scans complets à chaque ouverture de `/admin/reservations`.
- **Reco** : paginer (`.range()` + filtre par onglet déjà présent) ; remplacer le comptage par des `count: 'exact', head: true` par statut (5 petites requêtes parallèles) ou un `rpc` d'agrégat `GROUP BY status`.
- **Confiance** : haute.

### [WS35-08] `ProductCard` `<Image>` sans `sizes` + LCP non priorisée sur les grilles — P2
- **Fichier** : `src/components/ProductCard.tsx:82-88`
- **Catégorie** : perf (LCP/poids image)
- **Constat** : `<Image width={400} height={500}>` sans attribut `sizes`. Sur les grilles (catalogue 24 cartes, besoins/[slug], marques/[slug]) les cartes mesurent ~280-360px en desktop et ~50vw en mobile, mais sans `sizes` Next sert un candidat dimensionné pour 400px CSS dans tous les cas (srcset non optimisé pour le viewport). Aucune carte n'est `priority`, donc la 1ʳᵉ image au-dessus de la ligne de flottaison (LCP probable sur catalogue/landing besoins) est lazy-loaded.
- **Impact** : images légèrement surdimensionnées sur mobile (data + décodage), LCP non optimisée sur les pages-grille (la fiche produit, elle, gère `priority` correctement via `PdpGallery:58`).
- **Reco** : ajouter `sizes="(max-width:768px) 50vw, (max-width:1280px) 33vw, 25vw"` à l'`<Image>` de `ProductCard`. Optionnel : propager un prop `priority` activé pour les ~2-4 premières cartes des grilles SSR.
- **Confiance** : moyenne (le gain dépend du device mix RD ; impact réel mais modéré).

### [WS35-09] `account/reservations` — `getTranslations` + `Intl.*` recréés **par carte** — P2
- **Fichier** : `src/app/[locale]/account/reservations/page.tsx:106-141`
- **Catégorie** : perf
- **Constat** : `ReservationCard` (async) et `EmptyState` appellent `getTranslations('Account.reservations')` à **chaque** rendu de carte (lignes 107, 127, 128), et instancient `new Intl.NumberFormat('es-DO')` + `new Intl.DateTimeFormat('es-DO', …)` **par carte** (lignes 135-140). Sur N réservations → N créations de formatters + N résolutions de namespace de traduction.
- **Impact** : surcoût CPU par carte (faible par item mais O(n) ; `Intl.*` est notoirement coûteux à instancier). Page force-dynamic donc payé à chaque visite.
- **Reco** : résoudre `t`/`tStatus` et créer les formatters **une fois** dans le composant page, les passer en props aux cartes ; ou hisser les formatters en constantes module.
- **Confiance** : haute.

### [WS35-10] `/api/search` mode `bestsellers` mis en `no-store` de fait (route `ƒ`) alors qu'il est cacheable — P3
- **Fichier** : `src/app/api/search/route.ts:54-79`
- **Catégorie** : perf
- **Constat** : le mode `?bestsellers=1` (fallback « aucun résultat » du dropdown de recherche) renvoie une liste globale identique pour tous les visiteurs, mais la route est dynamique sans en-tête de cache → recalculée à chaque appel. Le mode recherche (`q`) n'est pas cacheable (variable), mais le mode bestsellers l'est.
- **Impact** : hits DB répétés pour un contenu quasi-statique (déclenché à chaque recherche infructueuse). Impact faible (petite requête `v_bestsellers`).
- **Reco** : pour la branche bestsellers uniquement, renvoyer `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` (le contenu tolère la fraîcheur 60 s).
- **Confiance** : moyenne.

### [WS35-11] `sitemap.xml` dynamique (`ƒ`) sans `revalidate` — recalculé à chaque hit crawler — P3
- **Fichier** : `src/app/sitemap.ts:14-127`
- **Catégorie** : perf / seo
- **Constat** : le sitemap fait 4 requêtes (products, brands, needs, blog) à **chaque** requête de `/sitemap.xml` (marqué `ƒ` dans le build — il utilise `createSupabaseServerClient` → `cookies()`). Aucun `export const revalidate`.
- **Impact** : 4 scans DB à chaque passage de Googlebot/Bing/scrapers. Faible volume mais évitable ; le sitemap n'a pas besoin de cookies.
- **Reco** : utiliser un client anon sans cookies (idem WS35-01) **et** ajouter `export const revalidate = 3600` → le sitemap devient régénéré toutes les heures, pas à chaque requête.
- **Confiance** : haute.

### [WS35-12] `fetchFeaturedNeeds` (home) — 1 requête de comptage **par tag** (1+N, N=3) — P3
- **Fichier** : `src/app/[locale]/page.tsx:309-337`
- **Catégorie** : perf
- **Constat** : après avoir lu les 3 tags `featured_on_home`, la home fait un `Promise.all` de **1 `count` par tag** sur `product_tags` (lignes 322-330). N est plafonné à 3 (commentaire « négligeable ») — c'est honnête, mais c'est le pattern 1+N signalé au brief.
- **Impact** : 3 requêtes de comptage évitables sur la home (page la plus visitée). Négligeable aujourd'hui, mais multiplié par le trafic home.
- **Reco** : un seul `select('tag_id')` sur `product_tags` filtré `tag_id IN (les 3)` puis comptage en JS, ou un agrégat `GROUP BY tag_id`. Mineur.
- **Confiance** : haute.

---

## Points positifs (court)
- `getThemeConfig` (`src/lib/getThemeConfig.ts`) est le **modèle de référence** : client anon sans cookies + `unstable_cache` taggé + `revalidate` — exactement ce qui manque à `getShopSettings`/`sitemap`. `/api/theme` documente correctement le choix `no-store` (pas de cache edge vs `revalidateTag`).
- Les gros clients sont **code-splittés** via `next/dynamic` avec skeletons (`CatalogueClient`, `ProductClient`, `CartClient`, `ReservationClient`) — bon pour le JS initial.
- `getDashboardData` agrège tout en **un seul `Promise.all`** (cascade parallèle propre), et `sidebar-stats` batch ses 4 counts en parallèle avec `Cache-Control` 15 s. `CatalogueClient` reçoit déjà la page paginée (ne re-filtre pas côté client) et mémoïse correctement (`useMemo` sur les Sets/pills).
- `PdpGallery` gère `priority` sur l'image principale ; `HomeBestsellers` utilise `fill`+`sizes` correctement.
- `next.config.ts` : formats `avif/webp`, `deviceSizes`/`imageSizes` configurés, `optimizePackageImports` sur `lucide-react`/`react-icons`.

## Signalements hors périmètre (1 ligne chacun, max 5)
- `legal/cgv/page.tsx` (et probablement tous les `legal/*`) **n'importent pas** `Footer` (grep `=0`) → pages légales sans pied de page, à vérifier côté UX/WS design.
- `useCart`/`useIsAdmin`/`useWishlist` (hooks SWR) hors périmètre mais à auditer pour la sur-revalidation au focus (WS client-state).
- Les routes `/api/admin/*` font un `requireAdmin()` (→ `auth.getUser()` réseau) à chaque appel sans cache — acceptable mais à noter pour WS sécurité/perf admin.

## Zones non couvertes / à re-vérifier humainement
- **Comportement runtime exact des pages `●` qui avalent le `DynamicServerError`** : le build les marque `●` mais aucun artefact `.html/.rsc` n'est committé sous `.next/server/app/{fr,es,en}/` pour celles qui touchent `cookies()` (seules `account`/`legal` y figurent). Vérifier en prod (Vercel) si elles servent du cache ISR figé-FALLBACK ou se re-rendent par requête — dans les deux cas WS35-01 (données FALLBACK) tient ; seul le coût CPU diffère.
- Mesure LCP/INP réelle (Lighthouse/WebPageTest sur device RD) pour calibrer WS35-08 — non exécutable en lecture seule.
- Volumétrie réelle attendue des réservations (WS35-07) et de `product_tags` (WS35-12) pour prioriser : sous-critique aujourd'hui (catalogue de 353 produits, peu de réservations).
