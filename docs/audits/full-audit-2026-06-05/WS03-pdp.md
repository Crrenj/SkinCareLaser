# WS03 — Fiche produit (PDP) + carte produit

**Périmètre** : `src/app/[locale]/product/[slug]/page.tsx`, `src/components/ProductClient.tsx`, `src/components/ProductDetailCard.tsx`, `src/components/pdp/*` (PdpGallery, PdpAccordions, PdpPharmacist, PdpQuantity, PdpStickyBar, PdpStockBadge, PdpTrustSignals, PdpWishlistButton, ProductJsonLd), `src/components/ProductCard.tsx`, `src/components/ProductCardHeart.tsx`
**Fichiers lus** : 12 (périmètre) + 6 (dépendances : useCart, useWishlist, AddToCartButton, Breadcrumb, constants, messages) · **Lignes parcourues (approx.)** : ~1 350
**Synthèse** : P0=0 · P1=2 · P2=6 · P3=6

> Recoupé en DB live (MCP read-only) : `products` actifs = 353, `currency` uniforme = `DOP`, `is_new`=0 / `old_price`=0 / `is_featured`=4, 0 produit inactif ; RLS `products` = `is_active=true OR is_user_admin(...)` ; vue `tags_with_types` existe.

## Findings

### [WS03-01] Les « signaux de confiance » PDP promettent une livraison payante/gratuite — contradiction avec le modèle click & collect — P1
- **Fichier** : `src/components/pdp/PdpTrustSignals.tsx:15-16` (+ clés i18n `Product.trust.*` dans `src/messages/{fr,en,es}.json`) ; aggravé par `src/components/pdp/PdpStockBadge.tsx:26` (clé `Product.stock.inStock`)
- **Catégorie** : logique-métier
- **Constat** : Chaque fiche produit affiche `deliveryTitle: "Livraison gratuite · 1500 DOP+"`, `deliveryBody: "Santo Domingo en 24h · reste du pays 2-3 jours"`, `returnsTitle: "Retours gratuits — 30 jours"`, et le badge stock dit `inStock: "En stock · expédié sous 24h"`. Or le projet est **explicitement click & collect uniquement, sans livraison ni expédition** (CLAUDE.md « Click & Collect uniquement », mémoire `click-and-collect-only`, `/livraison` = retrait en pharmacie). Aucune livraison, aucun envoi, aucune politique de retour 30 jours n'existe.
- **Impact** : Engagement commercial faux affiché sur les 353 fiches produit, dans les 3 langues. Promesse de service (livraison 24h, retours gratuits) que la pharmacie ne fournit pas → risque de litige client / réclamation, et incohérence directe avec `/livraison` (« click & collect »). C'est le défaut le plus visible du périmètre.
- **Reco** : Réécrire les 3 items de `PdpTrustSignals` (et `Product.stock.inStock`) pour refléter le retrait en pharmacie : « Retrait gratuit en pharmacie », « Réservation 24h », « Conseil pharmacien sur WhatsApp ». Aligner sur la copie de `/livraison` + `getShopSettings()`. (Le CTA « Nous écrire sur WhatsApp » de `askPharmacistTitle` est, lui, correct.)
- **Confiance** : haute

### [WS03-02] Le fetch « produits similaires » ne filtre pas `is_active = true` (s'appuie implicitement sur RLS) — P1
- **Fichier** : `src/app/[locale]/product/[slug]/page.tsx:203-219`
- **Catégorie** : logique-métier / data
- **Constat** : Les deux requêtes de produits similaires (étape A « même gamme » `range_id`, étape B « 50 candidats ») n'appliquent **pas** `.eq('is_active', true)`. Le fetch principal (`:188-192`) non plus. La page utilise `createSupabaseServerClient()` (client cookies agissant pour l'utilisateur). La seule barrière est la policy RLS « View active products » (`is_active=true OR is_user_admin(...)`). Pour un **admin connecté**, RLS renvoie aussi les produits inactifs → un admin verrait des produits désactivés dans « produits similaires » et pourrait ouvrir une fiche inactive directement par URL. Ce code dépend donc silencieusement de RLS pour une règle métier (« ne montrer que l'actif ») qui devrait être explicite dans la requête.
- **Impact** : Aujourd'hui 0 produit inactif → **aucun impact en prod**. Mais c'est une bombe à retardement : dès qu'un produit est désactivé, il peut réapparaître côté admin (et la robustesse repose entièrement sur une policy hors de ce fichier). Le `catalogue` (WS02) filtre `is_active=true` côté requête — incohérence d'approche.
- **Reco** : Ajouter `.eq('is_active', true)` aux 3 SELECT produits (`PRODUCT_SELECT` fetch + sameRange + candidates). Défense en profondeur, indépendante de RLS, et cohérent avec le catalogue.
- **Confiance** : haute

### [WS03-03] `redirectIfUuid` exécuté deux fois (metadata + page) → double requête DB par rendu — P2
- **Fichier** : `src/app/[locale]/product/[slug]/page.tsx:53` et `:185` (helper `:30-44`)
- **Catégorie** : perf
- **Constat** : `redirectIfUuid` fait un SELECT `products(slug)` quand le handle est un UUID. Il est appelé dans `generateMetadata` **et** dans `ProductPage` — chacun ouvrant son propre `createSupabaseServerClient()`. Pour une URL UUID légitime, c'est 2 requêtes redondantes ; pour un slug normal le `UUID_RE.test` court-circuite donc le coût est nul, mais le test regex + l'appel restent dupliqués. Plus largement, `generateMetadata` et la page refont **chacune** un fetch produit complet (lignes 55-59 vs 188-192) → 2 round-trips Supabase complets par rendu de page, sans cache partagé (pas de `React.cache`).
- **Impact** : Doublement des requêtes Supabase sur chaque rendu PDP (et triplement quand UUID). Mesurable sous charge ; avec `revalidate=60` l'impact est amorti par l'ISR mais reste réel au premier rendu / revalidation.
- **Reco** : Factoriser le fetch produit dans une fonction mémoïsée via `import { cache } from 'react'` partagée entre `generateMetadata` et la page (Next dédupliquera). Appeler `redirectIfUuid` une seule fois (la page suffit ; un UUID en metadata n'a pas besoin de pré-redirect car la page redirige avant tout rendu).
- **Confiance** : haute

### [WS03-04] `ProductDetailCard.tsx` = code mort (aucun import dans `src/`) — P2
- **Fichier** : `src/components/ProductDetailCard.tsx:1-140`
- **Catégorie** : dette
- **Constat** : `grep -rn "ProductDetailCard" src/` ne renvoie que la définition (ligne 34), **aucun import**. C'est une ancienne fiche produit (style `bg-white`/`shadow-lg`, prix `toFixed(2)`, quantité non bornée, `alt="Image de ..."` en dur, `bg-white` littéral non thémé) remplacée par `ProductClient` + composants `pdp/*`. Il porte aussi des défauts internes (quantité sans borne max ligne 121, image `object-cover` qui peut rogner un packshot, `<h1>` dans une carte secondaire) qui ne valent pas d'être corrigés puisque le composant est mort.
- **Impact** : ~140 LOC mortes, surface d'erreur/confusion pour les contributeurs, et tire les clés i18n legacy (cf. WS03-12).
- **Reco** : Supprimer le fichier (et `git rm`). Confiance haute sur le caractère mort (grep exhaustif sur `src/`).
- **Confiance** : haute

### [WS03-05] Aucune borne `MAX_CART_QUANTITY` côté PDP : le stepper laisse atteindre 99, mais l'ajout panier n'est pas plafonné par le stock réel ni par MAX_CART_QUANTITY — P2
- **Fichier** : `src/components/pdp/PdpQuantity.tsx:12` (défaut `max = 99`) ; `src/components/ProductClient.tsx:151` (passe `max={product.stock ?? undefined}`) ; `:63-69` (`handleAddToCart`)
- **Catégorie** : bug / logique-métier
- **Constat** : `PdpQuantity` borne à `max = 99` par défaut, mais `ProductClient` lui passe `max={product.stock ?? undefined}`. Quand `product.stock` est `undefined` (la PDP ne récupère le stock que via la colonne `stock`, OK ici, mais le type autorise `null`/absent et `MappedProduct.stock` est optionnel), la borne **retombe à 99** sans aucun rapport avec `MAX_CART_QUANTITY` (constante existante = 99, jamais importée ici) **ni avec le stock**. De plus, le code ne vérifie pas `quantity > stock` avant `addToCart` : on peut commander plus que le stock disponible si `stock > 0`. La constante centralisée `MAX_CART_QUANTITY` (`src/lib/constants.ts:15`) n'est référencée nulle part dans le périmètre (magic number `99` dupliqué).
- **Impact** : Réservation possible d'une quantité supérieure au stock (l'utilisateur croit réserver 10 d'un article à stock 3). La validation finale dépend entièrement de la RPC `create_reservation` côté DB (hors périmètre) ; l'UX laisse passer un état invalide. Magic number `99` non factorisé.
- **Reco** : Importer `MAX_CART_QUANTITY` et calculer `max = Math.min(stock ?? MAX_CART_QUANTITY, MAX_CART_QUANTITY)`. Idéalement clamp `quantity` à `stock` dans `handleAddToCart`.
- **Confiance** : moyenne (l'exploit dépend du comportement de la RPC réservation, non audité ici)

### [WS03-06] `PdpStockBadge` et `ProductCard` ne s'accordent pas sur la sémantique « stock bas » ; le badge PDP ignore `LOW_STOCK_THRESHOLD` — P2
- **Fichier** : `src/components/pdp/PdpStockBadge.tsx:12-28` vs `src/components/ProductCard.tsx:38,51`
- **Catégorie** : logique-métier / incohérence
- **Constat** : `PdpStockBadge` n'a que 2 états : `outOfStock` (`stock === 0`) sinon « En stock », **sans notion de stock bas**. `ProductCard` (carte catalogue) calcule un état `low` via une constante locale `LOW_STOCK_THRESHOLD = 5` (`:38`) qui **diffère de la constante partagée** `LOW_STOCK_THRESHOLD = 10` dans `src/lib/constants.ts:12` (et de l'admin). Donc : (a) la fiche produit ne signale jamais « plus que X en stock » alors que la carte le fait ; (b) deux seuils contradictoires (5 vs 10) coexistent.
- **Impact** : Incohérence UX entre catalogue (seuil 5, badge « low ») et PDP (aucun « low »). Le seuil 5 hardcodé dans `ProductCard` diverge de la source de vérité 10 → un produit à stock 7 est « low » sur la carte mais « bas » nulle part en PDP, et « bajo » côté admin (seuil 10). Confusion produit.
- **Reco** : Importer `LOW_STOCK_THRESHOLD` depuis `@/lib/constants` dans `ProductCard` (supprimer le `const` local ligne 38) et ajouter un état « low » à `PdpStockBadge` paramétré par la même constante.
- **Confiance** : haute

### [WS03-07] `PdpStockBadge` traite `undefined` comme « en stock » — masque l'inconnu — P2
- **Fichier** : `src/components/pdp/PdpStockBadge.tsx:12-13` ; `src/components/ProductClient.tsx:71,145`
- **Catégorie** : bug / data
- **Constat** : `outOfStock = stock === 0`. Si `stock` est `undefined`/`null`, le badge affiche « En stock » par défaut. `ProductClient` mappe `product.stock` (peut être `null` en DB d'après `RawProduct.stock: number | null`) et calcule `outOfStock = product.stock === 0` (`:71`) — un produit avec `stock = null` est donc considéré **disponible et commandable** (bouton actif), alors que l'information de stock est inconnue.
- **Impact** : Un produit à stock `null` (jamais le cas aujourd'hui, 0 en DB, mais le schéma l'autorise) afficherait « En stock » et autoriserait la réservation sans garantie. Cohérent avec `ProductJsonLd` (`stock === null → InStock`, choix documenté ligne 38-39) mais l'hypothèse « catalogue = produits actifs uniquement » n'implique pas « stock connu ».
- **Reco** : Décider explicitement : soit garder `null → InStock` (documenter dans `PdpStockBadge`), soit `NOT NULL DEFAULT 0` côté DB. À minima aligner la sémantique entre `PdpStockBadge`, `ProductClient.outOfStock` et `ProductJsonLd`.
- **Confiance** : moyenne (pas d'impact live, dette de robustesse)

### [WS03-08] Les flags `is_new`/`is_featured`/`old_price` ne sont jamais fetchés ni dérivés sur la PDP ni sur les cartes « produits similaires » — P3
- **Fichier** : `src/app/[locale]/product/[slug]/page.tsx:133-150` (`PRODUCT_SELECT`) ; `src/components/ProductClient.tsx:191-203`
- **Catégorie** : seo / feature incomplète
- **Constat** : `PRODUCT_SELECT` ne sélectionne pas `is_new`, `is_featured`, `old_price`, `volume`. Donc : les cartes « produits similaires » rendues par `ProductCard` (`:191-203`) ne reçoivent jamais `isNew`/`isFeatured`/`oldPrice`/`volume` → **aucun badge** (new/promo/best) ni prix barré ne s'affiche sur ces cartes, alors que `ProductCard` sait les dériver (`:53-59`). Côté PDP, le bloc prix (`ProductClient:134-144`) ne montre jamais de prix barré même si `old_price` existait. En DB : 4 produits `is_featured`, 0 `is_new`/`old_price` → impact actuel quasi nul, mais la dérivation de flags demandée par le brief est **absente du flux PDP**.
- **Impact** : Incohérence visuelle catalogue↔similaires (un bestseller affiché « best » au catalogue n'a aucun badge dans les similaires de la PDP). Promotions (`old_price`) invisibles sur la fiche si activées plus tard.
- **Reco** : Étendre `PRODUCT_SELECT` avec `old_price, is_new, is_featured, volume` et propager vers `ProductCard` dans `ProductClient` ; afficher le prix barré sur la PDP quand `old_price > price`.
- **Confiance** : haute

### [WS03-09] `currency.toUpperCase()` partout : transformation inutile + risque d'incohérence JSON-LD/affichage — P3
- **Fichier** : `src/components/ProductClient.tsx:138,217` ; `src/components/ProductCard.tsx:118,123-124` ; `src/components/pdp/PdpStickyBar.tsx:56` (affichage) vs `src/components/pdp/ProductJsonLd.tsx:62` (`priceCurrency: currency` brut, non upper)
- **Catégorie** : dette / data
- **Constat** : Toutes les surfaces d'affichage font `currency.toUpperCase()` ; le JSON-LD utilise `currency` **brut**. En DB la devise est uniformément `DOP` (vérifié) donc inoffensif aujourd'hui, mais : (a) `toUpperCase()` dispersé = micro-traitement répété d'une donnée déjà normalisée ; (b) si une devise minuscule était un jour insérée, l'affichage la corrigerait et le JSON-LD non → divergence entre snippet Google et page (Google attend ISO 4217 majuscule). La devise n'est pas non plus formatée via `Intl.NumberFormat`/`formatPrice` (helper existant `src/lib/formatPrice.ts`), juste concaténée (`price.toFixed(0) + currency`).
- **Impact** : Nul en l'état (1 seule devise). Dette : formatage monétaire non centralisé, normalisation incohérente.
- **Reco** : Garantir `DOP` majuscule en DB (CHECK) et/ou normaliser une fois dans `mapProduct`. Envisager `formatPrice()` pour la cohérence d'arrondi (PDP affiche `toFixed(0)`, JSON-LD `toFixed(2)` — voir WS03-10).
- **Confiance** : moyenne

### [WS03-10] Prix affiché tronqué à l'entier (`toFixed(0)`) alors que `price` est numeric décimal — perte d'exactitude visible — P3
- **Fichier** : `src/components/ProductClient.tsx:136` ; `src/components/pdp/PdpStickyBar.tsx:54` ; `src/components/ProductCard.tsx:118,121`
- **Catégorie** : bug / data
- **Constat** : Le prix est affiché via `price.toFixed(0)` (0 décimale) sur la PDP, la sticky bar et la carte. Le JSON-LD utilise `price.toFixed(2)` (`ProductJsonLd.tsx:62`). Les prix actuels sont des entiers placeholder (100 DOP) donc invisible, mais dès qu'un prix `199.99` existe, la page affichera `200` (arrondi !) tandis que Google verra `199.99`. `toFixed(0)` **arrondit**, il ne tronque pas → un prix 100.6 s'affiche 101.
- **Impact** : Affichage d'un prix arrondi différent du prix réel/du JSON-LD (et potentiellement du montant réservé). Pour des prix non entiers (probable en cosmétique RD), erreur d'affichage trompeuse.
- **Reco** : Choisir une politique unique (DOP n'a pas de centimes courants → `toFixed(0)` peut être voulu, mais alors aligner le JSON-LD sur la même base, ou stocker des prix entiers). Centraliser via `formatPrice()`.
- **Confiance** : moyenne (dépend de la convention prix DOP réelle, à trancher humainement)

### [WS03-11] `PdpGallery` : `cursor-zoom-in` + hint « zoom » mais aucun zoom implémenté ; risque de clé d'image dupliquée — P3
- **Fichier** : `src/components/pdp/PdpGallery.tsx:31,52,61-63`
- **Catégorie** : a11y / bug mineur
- **Constat** : L'image principale porte `cursor-zoom-in` et un overlay `{t('zoomHint')}`, mais aucun handler de zoom/lightbox n'existe (`grep onClick` = 1 seul, sur la thumbnail). L'utilisateur voit un curseur loupe et un texte « zoom » sans action au clic → promesse d'interaction non tenue. Par ailleurs `key={`${img.url}-${idx}`}` (`:31`) est robuste, mais si deux `product_images` partagent la même `url` (doublon DB), seul l'`idx` les distingue — OK ici. Note a11y : les thumbnails utilisent `aria-current={isActive}` (valeur booléenne) — `aria-current` attend une string token (`"true"`/`"page"`…), un booléen `true` est sérialisé en `"true"` et toléré, mais `false` produit `aria-current="false"` (présent mais inactif), acceptable.
- **Impact** : Affordance trompeuse (curseur + hint zoom sans zoom). Mineur, purement cosmétique/UX.
- **Reco** : Soit retirer `cursor-zoom-in` + `zoomHint`, soit implémenter un vrai zoom/lightbox au clic.
- **Confiance** : haute

### [WS03-12] Clés i18n `Product.*` orphelines (héritage `ProductDetailCard`) — P3
- **Fichier** : `src/messages/{fr,en,es}.json` (namespace `Product`) ; non utilisées par le code du périmètre
- **Catégorie** : dette / i18n
- **Constat** : `grep` sur `src/` montre que `Product.descriptionHeading`, `characteristicsHeading`, `quantityHeading`, `totalPriceLabel`, `similarProductsHeading`, `rangeLabel`, `noImage`, et `Product.reviews` ne sont **pas** consommées par les composants PDP actuels (`ProductClient` utilise `similar.heading`, `rangePrefix`, etc.). `noImage` n'est utilisé qu'hors périmètre (`CartLineItem`). `Product.reviews` n'est référencé nulle part dans `pdp/*`. Ce sont des résidus du `ProductDetailCard` mort + d'un bloc reviews jamais branché.
- **Impact** : Bruit i18n (×3 langues), maintenance de clés inutiles, surface de désynchronisation de parité.
- **Reco** : Après suppression de `ProductDetailCard` (WS03-04), purger ces clés des 3 fichiers messages (vérifier `noImage` reste pour CartLineItem).
- **Confiance** : moyenne (confiance haute sur le non-usage PDP ; basse sur l'exhaustivité hors PDP — à confirmer par WS sur le cart/i18n)

### [WS03-13] `PdpTrustSignals.contactHref` par défaut `/contact` non localisé via `Link` mais via `<a>` brut — P3
- **Fichier** : `src/components/pdp/PdpTrustSignals.tsx:11,21-23`
- **Catégorie** : i18n / bug mineur
- **Constat** : L'item « demander conseil » rend un `<a href={contactHref}>` (HTML brut) avec défaut `/contact` — **sans préfixe locale**. Tous les autres liens internes du périmètre utilisent `<Link>` de `@/i18n/navigation` (préfixe automatique `/fr|/es|/en`). Un `<a href="/contact">` casse le routing localisé (envoie vers `/contact` qui sera réécrit par le middleware vers la locale par défaut `fr`, perdant la locale courante de l'utilisateur ES/EN).
- **Impact** : Un utilisateur sur `/es/product/...` cliquant « Nous écrire » atterrit sur la version FR de `/contact` (perte de langue). Mineur mais réel pour ES/EN.
- **Reco** : Remplacer le `<a>` par `<Link href={contactHref}>` (i18n). Idem vérifier les usages : seul `ProductClient` instancie `PdpTrustSignals` sans prop → défaut `/contact` toujours utilisé.
- **Confiance** : haute

## Points positifs (court)
- **Stretched-link bien fait** : `ProductCard` (`:69-74`) place un `<Link absolute z-10>` sous les contrôles (`z-20`), pas de `<button>` dans `<a>` ; heart et quick-add font `preventDefault`+`stopPropagation` (`ProductCardHeart:26-27`, `AddToCartButton:35-36`). Pattern propre, right-click « ouvrir dans un onglet » préservé.
- **IntersectionObserver sans fuite** : `PdpStickyBar` (`:33-42`) garde la ref, observe, et `obs.disconnect()` au cleanup — aucune fuite, dépendance `[buyRowRef]` correcte.
- **Accordéons natifs `<details>`** : `PdpAccordions` rend du contenu indexable sans JS, sections conditionnelles propres, chevron en `aria-hidden`. Bonne approche SEO/a11y.
- **404 robuste** : fetch principal en `.single()` + `notFound()` sur erreur/absence (`page.tsx:194-197`), redirection 308 UUID→slug (`permanentRedirect`) propre, `maybeSingle()` côté metadata pour ne pas throw.
- **JSON-LD** : `ProductJsonLd` est un Server Component pur, `JSON.stringify` sur données DB normalisées (pas d'XSS), offers/availability/seller corrects, canonical absolu.
- **Wishlist anon** : heart redirige vers `/login?redirectedFrom=/favoris` quand `needAuth` (`ProductCardHeart:29-31`, `PdpWishlistButton:25-27`), `aria-pressed` présent.

## Signalements hors périmètre (1 ligne chacun, max 5)
- `useCart.addToCart` (`src/hooks/useCart.ts:55-120`) retourne silencieusement si `data?.cart` n'est pas encore hydraté → un clic « Ajouter » trop tôt est un no-op sans feedback (connu, mais à revoir avec WS panier).
- `ProductClient.handleAddToCart` (`:63-69`) avale l'erreur dans un `logger.error` sans aucun toast/feedback utilisateur en cas d'échec réseau (le bouton principal n'a pas l'état succès/erreur de `AddToCartButton`).
- `Breadcrumb` (`src/components/Breadcrumb.tsx:20`) a `aria-label="Breadcrumb"` en dur (non i18n) — à vérifier par le WS i18n.
- `AddToCartButton` variant `default/outline/ghost` utilise `text-white`/`bg-clay-700` littéral (`:124`) — possibles soucis de thème sombre (WS thèmes).
- `ProductJsonLd` ne déclare ni `sku`/`gtin` ni `aggregateRating` — limite SEO connue (acceptable sans système d'avis).

## Zones non couvertes / à re-vérifier humainement
- **Politique de prix DOP** (entier vs décimal) : `toFixed(0)` à l'affichage vs `toFixed(2)` en JSON-LD — trancher selon la convention monétaire réelle de la pharmacie (WS03-10).
- **Comportement réel de la RPC `create_reservation`** face à une quantité > stock : si elle clamp/rejette, WS03-05 est mitigé côté serveur (à confirmer par le WS réservation/RPC).
- **Exhaustivité du non-usage des clés `Product.*` orphelines** hors PDP (WS03-12) : confirmé non utilisé dans `pdp/*` ; à recouper avec le WS i18n global avant purge.
- **Vrai zoom image** : décision produit (lightbox attendue ou non) pour WS03-11.
