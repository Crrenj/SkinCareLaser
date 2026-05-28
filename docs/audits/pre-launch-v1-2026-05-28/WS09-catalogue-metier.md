# WS09 — Catalogue & Règles métier (PRE-V1, lecture seule)

Auditeur : senior (logique métier + cohérence data). Date : 2026-05-28.
Périmètre : filtres URL catalogue, pagination, stock, panier (merge + quantités), `v_bestsellers`, `/besoins`, `/marques`, prix, recherche, wishlist.
Mode : **lecture seule** (lis/grep/git log). Pas de MCP Supabase — les points DB-live sont marqués « à confirmer ».

---

## Verdict

**B− / À CORRIGER AVANT V1.** Le catalogue (filtres URL, pagination, facettes, `/besoins`, `/marques`) est **sain et robuste** : les params malformés ne cassent ni la query ni le rendu, le piège historique `tt.name` vs `tt.slug` est bien résolu, et le piège `sold_30d` (colonne sur la vue, pas sur la table) est évité. La recherche et la wishlist sont propres.

En revanche **la gestion des quantités panier est cassée** : le stepper +/- du panier envoie une quantité **absolue** vers un endpoint qui **incrémente** (RPC `add_to_cart` fait `existing + p_quantity`). Résultat : cliquer « + » sur une ligne à 3 fait passer la DB à 7, cliquer « − » l'augmente aussi. C'est le finding P0. En corollaire, le **garde-fou de stock est contournable** (le check ne porte que sur le delta entrant, jamais sur le cumul), et le test e2e qui « passe » ne valide que la valeur optimiste avant revalidation (d'où la flakiness documentée).

Côté **cohérence prix** : catalogue/PDP/search affichent les prix en `.toFixed(0)` (décimales tronquées, pas de séparateur de milliers, pas de locale), alors que panier/réservation/admin passent par `formatPrice` (es-DO, 2 décimales). Invisible à 100 DOP placeholder, mais incohérent dès les vrais prix. Le PDP n'affiche **aucun promo / old_price** alors que la carte catalogue affiche le badge promo.

---

## Findings

### WS09-01 · P0 · Le stepper de quantité panier additionne au lieu de remplacer — confirmé

**Preuve :**
- `src/components/cart/CartLineItem.tsx:40-47` — `handleDec` appelle `onUpdateQuantity(item.product_id, item.quantity - 1)` et `handleInc` `… item.quantity + 1` : la valeur passée est la **quantité cible absolue**.
- `src/hooks/useCart.ts:166-214` — `updateQuantity` POST `{ productId, quantity }` vers `/api/cart` (aucun verbe « set »).
- `src/app/api/cart/route.ts:214-221` — POST appelle toujours la RPC `add_to_cart`.
- `supabase/migrations/20260519092026_fix_add_to_cart_increment.sql:26-29` — `ON CONFLICT … DO UPDATE SET quantity = public.cart_items.quantity + EXCLUDED.quantity` → **incrémente**.

**Impact :** la modification de quantité dans le panier (drawer + page `/cart`) est fonctionnellement cassée. Depuis une ligne à quantité 3 :
- « + » → client envoie 4 → DB = 3 + 4 = **7**
- « − » → client envoie 2 → DB = 3 + 2 = **5** (le « moins » augmente !)
L'UI optimiste affiche brièvement la bonne valeur (4 / 2), puis `refreshCart()` révèle la vraie (7 / 5). Le total panier, le total réservation et le snapshot `create_reservation` héritent de la quantité erronée. Le test `tests/cart.spec.ts:64-78` (attend badge=2 après un « + » depuis 1, alors que la DB part à 3) ne « passe » qu'en attrapant la valeur optimiste avant revalidation → exactement la flakiness « cart » documentée dans le HANDOFF (commit `38a6a34`).

**Reco :** dissocier « ajouter » d'« ajuster ». Option A : nouvelle RPC `set_cart_quantity(p_cart_id, p_product_id, p_quantity[, anon/user])` (UPSERT `SET quantity = EXCLUDED.quantity`) appelée par `updateQuantity`, en gardant `add_to_cart` (incrément) pour le bouton « Ajouter ». Option B : route PATCH dédiée. Ne pas réutiliser `add_to_cart` pour le stepper. Ajouter un test e2e déterministe (attendre `refreshCart` avant l'assertion, ou stub réseau).

**Effort :** M (1 migration RPC + 1 branche route/hook + test).

---

### WS09-02 · P1 · Garde-fou de stock contournable (check sur le delta, pas sur le cumul) — confirmé

**Preuve :** `src/app/api/cart/route.ts:195` — `if ((product.stock ?? 0) < quantity)` ne compare que la **quantité entrante** au stock, jamais `quantité_en_panier_existante + quantité`. La RPC qui suit (`add_to_cart`) incrémente sans aucun check de stock (`20260519092026_fix_add_to_cart_increment.sql` — pas de comparaison au stock).

**Impact :** sur un produit à stock = 5, ajouter 1 unité 99 fois passe toujours le check (`5 >= 1`) et amène la ligne panier à 99 (cap UI `MAX_CART_QUANTITY`). Le panier (puis la réservation) peut dépasser le stock affiché. Couplé à WS09-01, le stepper aggrave l'écart. Pour un modèle click-&-collect à stock manuel, l'enjeu est surtout la cohérence promesse/disponibilité (un client réserve 99 d'un produit à stock 5).

**Reco :** dans POST `/api/cart`, lire la quantité déjà en panier pour ce `(cart_id, product_id)` et valider `existing + quantity <= stock` (renvoyer 400 `Stock insuffisant` sinon). Idéalement, déplacer le check dans la RPC pour le rendre atomique (évite la race entre lecture stock et upsert). À combiner avec WS09-01.

**Effort :** S–M.

---

### WS09-03 · P1 · Cohérence d'affichage des prix : `.toFixed()` brut sur catalogue/PDP/search vs `formatPrice` ailleurs — confirmé

**Preuve :**
- Surfaces brutes (pas de locale, pas de séparateur de milliers) :
  - `src/components/ProductCard.tsx:118,121` — `product.oldPrice!.toFixed(0)` / `product.price.toFixed(0)`
  - `src/components/ProductClient.tsx:136` — `product.price.toFixed(0)` (PDP)
  - `src/components/NavSearch.tsx`, `src/components/pdp/PdpStickyBar.tsx`, `src/components/ProductDetailCard.tsx` — `toFixed`
- Surfaces formatées (es-DO, 2 décimales) : `formatPrice` dans `cart/*`, `reservation/*`, `confirmation/*`, `admin/dashboard/*`, `lib/whatsapp.ts` (cf. grep).

**Impact :** invisible aujourd'hui (353 produits à 100 DOP placeholder, entier). Dès les vrais prix (ex. `1 234,50 DOP`) le catalogue/PDP afficheront « 1235 DOP » (décimales perdues, pas de séparateur) tandis que le panier affichera « 1,234.50 DOP ». Incohérence prix visible sur le parcours d'achat → frein de confiance en V1 commerciale.

**Reco :** router catalogue/PDP/search/sticky/detail-card via `formatPrice(value, { locale })` (le suffixe devise reste un `<span>` typographique). Décider 0 vs 2 décimales et l'appliquer partout.

**Effort :** S (remplacements ciblés). **Note :** `ProductJsonLd.tsx:63` utilise `price.toFixed(2)` — **correct** pour schema.org, ne pas toucher.

---

### WS09-04 · P1 · Le PDP n'affiche jamais promo / old_price (la carte catalogue, si) — confirmé

**Preuve :**
- `src/app/[locale]/product/[slug]/page.tsx` — aucune sélection de `old_price` (grep `old_price|oldPrice` = 0 hit sur la page produit ET sur `ProductClient.tsx`).
- `src/components/ProductClient.tsx:134-144` — bloc prix sans variante barrée ni `old_price`.
- À l'inverse, `src/components/ProductCard.tsx:53-59,116-120` dérive un badge `promo` et affiche `oldPrice` barré.

**Impact :** un produit en promo affiche le badge « -X% » + ancien prix barré dans le catalogue, puis sur sa fiche produit **aucune** mention de promo — l'ancien prix disparaît, le rabais n'est plus visible au moment de la décision d'achat. Incohérence catalogue↔PDP et perte de l'argument commercial.

**Reco :** sélectionner `old_price` sur la page PDP, le passer à `ProductClient`, afficher l'ancien prix barré + le % de remise (réutiliser la logique `isPromo`/`promoPct` de `ProductCard`). Idem `PdpStickyBar`.

**Effort :** S.

---

### WS09-05 · P2 · `v_bestsellers` ne trie plus par ventes — `sold_30d` figé à 0 — confirmé

**Preuve :** `supabase/migrations/20260527110000_drop_orders_order_items.sql:6-16` — depuis le drop de `orders`, la vue retourne `0::bigint AS sold_30d` et `ORDER BY p.is_featured DESC NULLS LAST, p.created_at DESC`. Le tri « meilleures ventes » est un no-op constant.

**Impact :** cohérence documentaire/fonctionnelle. Les commentaires (`src/app/[locale]/page.tsx:197,236`, `src/app/api/search/route.ts:12`) annoncent un tri « sold_30d desc » qui n'existe plus — c'est en réalité `is_featured` + `created_at`. Aucun bug d'exécution, mais « Bestsellers » = « featured + récents », pas « meilleures ventes ». Le tri catalogue `bestsellers` (`lib/catalogueFilters.ts:130-135`) est lui aussi `is_featured` + alpha — cohérent entre eux, mais l'étiquette « ventes » est trompeuse.

**Reco :** soit retirer `sold_30d` et renommer (commentaires + colonne) en « featured/récents », soit recâbler un vrai compteur de ventes (réservations collectées sur 30j) si pertinent post-V1. À minima, corriger les commentaires.

**Effort :** S (commentaires) / M (vrai compteur).

---

### WS09-06 · P2 · Stock jamais décrémenté ni réservé (deux clients peuvent réserver « le dernier » exemplaire) — confirmé

**Preuve :** grep exhaustif : aucun `UPDATE products SET stock` hors admin (`StockEditModal`). `create_reservation` (`20260519183407_rpc_create_reservation.sql`) snapshot les items et vide le panier **sans** toucher `products.stock`, et sans aucun check de stock. Pas de décrément à la confirmation/collecte non plus.

**Impact :** le stock affiché est purement décoratif et édité à la main. Deux utilisateurs peuvent chacun réserver la dernière unité ; le badge stock ne reflète jamais les réservations en cours. Acceptable pour un modèle click-&-collect à stock manuel (pas d'engagement d'inventaire en ligne), mais à assumer explicitement — sinon promesse de disponibilité non tenue côté comptoir.

**Reco :** décision produit. Si on veut une cohérence : décrémenter à la confirmation admin (pas à la réservation, pour ne pas geler le stock sur des paniers abandonnés) OU afficher « stock indicatif ». Documenter le choix. (Hors V1 si le modèle reste manuel.)

**Effort :** M (si implémenté) / nul (si assumé + documenté).

---

### WS09-07 · P2 · Stock non transmis aux ProductCard de `/besoins` et `/marques` → toujours « en stock » + quick-add — confirmé

**Preuve :**
- `src/app/[locale]/besoins/[slug]/page.tsx:50-58,146-157` et `src/app/[locale]/marques/[slug]/page.tsx:51,135-149` — le SELECT ne récupère pas `stock`/`is_new`/`is_featured`/`old_price`, et le mapping vers `<ProductCard>` ne passe ni `stock` ni `inStock`.
- `src/components/ProductCard.tsx:49` — `const inStock = product.inStock ?? true` → sans donnée, la carte est **toujours** « en stock », affiche le quick-add et aucun badge promo/new.

**Impact :** sur les landings besoin/marque, un produit en rupture (`stock = 0`) apparaît en stock avec bouton « + Ajouter » actif. Le clic POSTe et est rejeté côté serveur (`stock < quantity` → 400) sans feedback clair. Incohérence d'affichage catalogue↔landings + tentative d'ajout d'un produit indisponible. (La home `HomeBestsellers` peut être dans le même cas — à vérifier.)

**Reco :** ajouter `stock` (et `old_price`/`is_new`/`is_featured` pour la parité visuelle) aux SELECT de `/besoins/[slug]` et `/marques/[slug]`, et les passer à `ProductCard`. Vérifier aussi les autres call-sites de `ProductCard` qui omettent `stock`.

**Effort :** S.

---

### WS09-08 · P2 · Recherche `ilike` : wildcards `%` / `_` non échappés — confirmé (pas une faille)

**Preuve :** `src/app/api/search/route.ts:97` — `.ilike('name', \`%${q}%\`)`. La valeur est paramétrée (pas de SQLi), mais les métacaractères LIKE (`%`, `_`) du terme ne sont pas neutralisés.

**Impact :** purement fonctionnel. Un `q = "%"` matche tout, `"a_b"` traite `_` comme joker. Pas de risque sécurité (PostgREST paramètre la valeur), juste des résultats surprenants. Limité par `q.length >= 2` et `limit <= 20`.

**Reco :** échapper `%`, `_`, `\` dans `q` avant interpolation (ex. `q.replace(/[\\%_]/g, '\\$&')`). Cosmétique.

**Effort :** XS.

---

### WS09-09 · P2 · `LOW_STOCK_THRESHOLD` divergent : 5 (carte catalogue) vs 10 (constante partagée/admin) — confirmé

**Preuve :** `src/components/ProductCard.tsx:38` — `const LOW_STOCK_THRESHOLD = 5` (constante **locale**, masque la globale). `src/lib/constants.ts:12` — `export const LOW_STOCK_THRESHOLD = 10` (utilisée par l'admin/PDP).

**Impact :** un produit à stock = 7 est « stock bas » dans l'admin (<10) mais « en stock » sur la carte catalogue (>5). Incohérence de seuil entre surfaces.

**Reco :** importer la constante partagée dans `ProductCard.tsx` et supprimer la locale (ou décider sciemment d'un seuil vitrine différent et le documenter).

**Effort :** XS.

---

### WS09-10 · P2 · Bestsellers home/fallback : second SELECT et fallback sans filtre `is_active` — confirmé

**Preuve :** `src/app/[locale]/page.tsx:211-219` (fallback) et `226-234` (résolution par IDs) — les deux SELECT `products` n'ont pas `.eq('is_active', true)`.

**Impact :** faible. La voie nominale part des IDs de `v_bestsellers` (déjà filtrée `is_active IS DISTINCT FROM false`), donc le second SELECT par `.in('id', ids)` ne ramène que des actifs. Mais le **fallback** (vue absente/vide) sélectionne « les 4 premiers produits » sans filtre actif → un produit inactif pourrait s'afficher sur la home en mode dégradé.

**Reco :** ajouter `.eq('is_active', true)` au SELECT fallback (et par sécurité au SELECT par IDs).

**Effort :** XS.

---

## Tableau récap

| ID | Sév. | Sujet | Statut |
|---|---|---|---|
| WS09-01 | **P0** | Stepper quantité panier additionne au lieu de remplacer (`-` augmente !) | confirmé |
| WS09-02 | P1 | Garde-fou stock contournable (check sur delta, pas cumul) | confirmé |
| WS09-03 | P1 | Prix catalogue/PDP/search en `.toFixed()` brut vs `formatPrice` ailleurs | confirmé |
| WS09-04 | P1 | PDP n'affiche jamais promo / old_price (carte catalogue, si) | confirmé |
| WS09-05 | P2 | `v_bestsellers.sold_30d` figé à 0 → tri « ventes » trompeur | confirmé |
| WS09-06 | P2 | Stock jamais décrémenté/réservé (réservation = pas d'engagement inventaire) | confirmé |
| WS09-07 | P2 | Stock non transmis aux ProductCard `/besoins` & `/marques` → toujours « en stock » | confirmé |
| WS09-08 | P2 | Recherche `ilike` wildcards `%`/`_` non échappés (fonctionnel, pas SQLi) | confirmé |
| WS09-09 | P2 | `LOW_STOCK_THRESHOLD` divergent : 5 (carte) vs 10 (admin/constante) | confirmé |
| WS09-10 | P2 | Bestsellers home : fallback sans filtre `is_active` | confirmé |

---

## Points sains (re-vérifiés)

- **Filtres URL robustes** (`lib/catalogueFilters.ts`) : `readMultiParam` gère string|string[]|undefined + split virgule + trim + filter(Boolean) ; `matchName` matche **name OU slug** (NFD/diacritiques) ; `?tag=type:slug` skippe proprement les entrées malformées (`if (!type || !value || !itemsByType[type]) continue`) ; les valeurs non reconnues sont droppées via `.filter(v => !!v)`. **Un param malformé ne casse ni la query ni le rendu.**
- **`?need=` résout** : `fetchNeedTag` filtre sur `tag_type = 'besoins'` qui est `tt.slug` (lowercase) dans la vue `tags_with_types` (baseline:131-142). Le piège historique `tt.name` vs `tt.slug` (404 sur `/besoins/*`) est bien corrigé.
- **Pagination bornée** : `parseFilters` clamp `page >= 1` ; la page catalogue clamp `page = Math.min(filters.page, totalPages)` → `?page=9999` retombe sur la dernière page (pas de crash, pas de page vide). `buildPageRange` produit l'ellipsis attendue ; `totalPages` via `Math.max(1, ceil(...))`.
- **Piège `sold_30d` évité** : aucun SELECT direct de `sold_30d` sur la table `products` (grep = 0). Seuls la vue et des commentaires la mentionnent → pas de 400.
- **`/marques` data-driven** : jointures ranges→products via `range_id`, count `is_active`, og:image dynamique via embed `!inner` ; gère 0 range / 0 produit.
- **Recherche** : valeur paramétrée (pas de SQLi), `q.length >= 2`, `limit` clampé `[1..20]`, fallback bestsellers en no-result.
- **Wishlist** : auth-gate (`getUser()`), scope `user_id` + RLS « own », toggle optimistic avec rollback sur 401/erreur, `needAuth` → redirect login.
- **Merge anon→user** (angle métier) : `merge_anon_cart_to_user` (`20260523095131`) fusionne les quantités via `ON CONFLICT … SET quantity = existing + EXCLUDED` (doublons additionnés — cohérent), reclaim simple si pas de cart user. Cookie `cart_id` supprimé après merge. **Limite métier** : la fusion ne re-valide pas le stock (un anon à 50 + un user à 50 → 100) — corollaire de WS09-02, mêmes recommandations.

---

## À confirmer en DB live (MCP read-only)

1. **WS09-01** : confirmer qu'aucune RPC « set quantity » n'existe en prod hors migrations versionnées (`SELECT proname FROM pg_proc WHERE proname ILIKE '%cart%'`). Les migrations ne montrent que `add_to_cart` (incrément).
2. **WS09-05** : confirmer la définition live de `v_bestsellers` (`SELECT pg_get_viewdef('public.v_bestsellers'::regclass, true)`) — vérifier `sold_30d = 0` et l'ORDER BY.
3. **WS09-06** : confirmer qu'aucun trigger sur `reservations`/`reservation_items` ne décrémente `products.stock` (`SELECT tgname FROM pg_trigger WHERE tgrelid IN ('reservations'::regclass,'reservation_items'::regclass)`).
4. **WS09-02** : confirmer qu'`add_to_cart` live n'a pas de check stock ajouté hors migration (`SELECT pg_get_functiondef(...)`).
5. État data : confirmer que les 353 produits sont bien `stock = 50`, `price = 100`, `old_price IS NULL` (donc aucun promo réel aujourd'hui → WS09-04 latent).
