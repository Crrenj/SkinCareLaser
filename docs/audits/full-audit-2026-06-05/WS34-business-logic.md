# WS34 — Logique métier (transverse, bout-en-bout)

**Périmètre** : RPC panier/réservation (`supabase/migrations/*` : `add_to_cart`, `remove_from_cart`, `get_or_create_cart`, `create_reservation`, `merge_anon_cart_to_user`, `expire_stale_reservations`), `src/app/api/cart/{route,reserve/route,merge/route}.ts`, `src/hooks/useCart.ts`, `src/hooks/useAuth.ts`, `src/lib/{reservation,whatsapp,constants,formatPrice,shipping}.ts`, et les consommateurs UI du flux (CartLineItem, CartSummary, PdpQuantity, ProductClient, ReservationClient, ShippingStep, ConfirmationClient, admin/reservations route).
**Fichiers lus** : 22 · **Lignes parcourues (approx.)** : ~1 750
**Synthèse** : P0=0 · P1=1 · P2=3 · P3=6

> Recoupé en DB live (MCP, SELECT only) : définitions/grants/`search_path` des 6 RPC = conformes aux migrations ; 353 produits, tous `price=100.00 DOP`, `currency` unique.
> **Décisions intentionnelles confirmées et NON rapportées comme bugs** : (a) le stock n'est **jamais** décrémenté à la réservation — documenté explicitement dans `20260519182512_reservations_schema.sql:6` (« Stock non bloqué (admin arbitre les conflits manuellement) ») et aucun `UPDATE products SET stock` n'existe hors `/api/admin/stock` ; donc `expire_stale_reservations` n'a logiquement rien à ré-incrémenter. (b) Pas de paiement en ligne. La conséquence « sur-réservation possible » est donc un choix assumé, pas un finding — sauf là où elle se combine à un **vrai** bug de validation (voir WS34-01).

## Findings

### [WS34-01] Le contrôle de stock du POST /api/cart valide le delta, pas le cumul → panier au-delà du stock — P1
- **Fichier** : `src/app/api/cart/route.ts:199` (POST) ; RPC `supabase/migrations/20260519092026_fix_add_to_cart_increment.sql:24-29` (`add_to_cart` INCRÉMENTE)
- **Catégorie** : logique-métier / bug
- **Constat** : POST appelle `add_to_cart`, dont le `ON CONFLICT … DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity` **additionne** la quantité existante. Or la garde de stock du route est `if ((product.stock ?? 0) < quantity)` où `quantity` est le **delta** envoyé, jamais la quantité déjà présente dans le panier. La quantité cumulée résultante n'est donc jamais validée. Exemple concret (stock=50) : 1er POST `quantity=50` → `50 < 50` faux → passe → cart=50 ; 2e POST `quantity=50` → `50 < 50` faux → passe → RPC additionne → **cart=100 pour un stock de 50**. Même un POST `quantity=1` répété 60× sur un stock de 50 n'est jamais bloqué. (Le PATCH ligne 280 est correct car il valide la quantité **absolue** ; seul le POST/incrément est faux.)
- **Impact** : un client peut faire entrer dans son panier — puis figer dans une réservation via `create_reservation` (qui snapshote `ci.quantity` tel quel, sans re-vérifier le stock) — une quantité supérieure au stock réel. Le message WhatsApp et le `total_price` de la réservation porteront alors une quantité que la pharmacie ne peut pas honorer. Combiné au choix « stock non bloqué », c'est le seul garde-fou côté ajout, et il est inopérant.
- **Reco** : lire la quantité courante de la ligne avant d'incrémenter et valider `(existant + quantity) <= stock` (un `SELECT quantity FROM cart_items WHERE cart_id=… AND product_id=…`), ou — plus robuste — déplacer le contrôle dans `add_to_cart` (clamp/erreur sur `cart_items.quantity + EXCLUDED.quantity > stock`). À aligner avec WS34-02 (borne max).
- **Confiance** : haute

### [WS34-02] `MAX_CART_QUANTITY` n'est appliqué NULLE PART (ni serveur, ni UI) ; aucune borne haute de quantité — P2
- **Fichier** : `src/lib/constants.ts:15` (constante définie) ; `src/app/api/cart/route.ts:176,256` (POST/PATCH : seul `quantity <= 0` rejeté) ; `supabase/migrations/00000000000000_baseline.sql:162` (`cart_items.quantity … CHECK (quantity > 0)` — pas de borne haute)
- **Catégorie** : logique-métier / dette
- **Constat** : `grep -rn "MAX_CART_QUANTITY" src/` ne renvoie **que sa définition** : la constante est morte. Le serveur ne borne la quantité que par `> 0` (route) et `> 0` (CHECK DB). Les steppers UI utilisent des littéraux, pas la constante : `PdpQuantity` borne à `max=99` (`src/components/pdp/PdpQuantity.tsx:12`) ou `product.stock` quand fourni (`ProductClient.tsx:151`) ; `CartLineItem` borne à `p.stock || 99` (`src/components/cart/CartLineItem.tsx:46`). Un POST direct `quantity=100000` est accepté (sous réserve du contrôle de stock qui, lui, est cassé — cf. WS34-01). La réponse à la question du brief « MAX_CART_QUANTITY appliqué côté serveur ? » est donc : **non, nulle part**.
- **Impact** : pas de plafond cohérent de quantité. Source unique de vérité (`constants.ts`) contournée par 3 littéraux divergents (`99` vs `stock`), donc dérive garantie si l'un change.
- **Reco** : importer `MAX_CART_QUANTITY` dans les 3 steppers et l'appliquer aussi côté route POST/PATCH (`quantity > MAX_CART_QUANTITY` → 400), idéalement avec un `CHECK (quantity <= 99)` en DB. Sinon supprimer la constante morte pour ne pas laisser croire qu'une borne existe.
- **Confiance** : haute

### [WS34-03] Le total WhatsApp ajoute des frais de livraison absents du `total_price` réservé ; le tunnel propose encore la livraison payante (contradiction click&collect) — P2
- **Fichier** : `src/lib/whatsapp.ts:52-54,74-75` ; `src/components/reservation/ShippingStep.tsx:42-67` ; RPC `supabase/migrations/20260519183407_rpc_create_reservation.sql:84-91` (le `total_price` réservé = `SUM(ci.quantity * pr.price)`, **sans livraison**)
- **Catégorie** : logique-métier / data
- **Constat** : `buildReservationMessage` calcule `total = subtotal + shippingCost` et affiche « *Total a coordinar* » avec un envío de 300 (Santo Domingo) ou 600 DOP (Interior). Mais (1) la réservation persistée n'enregistre que le sous-total (pas de frais), et (2) le modèle est **click & collect uniquement** (mémoire projet) — pourtant `ShippingStep` expose toujours deux options de **livraison payante** sélectionnables en plus du retrait. Un client qui choisit « Interior » verra dans WhatsApp « Total a coordinar = sous-total + 600 DOP » pour un service que la pharmacie n'opère pas, et ce total ne correspondra à aucune ligne en base. Le brief liste `lib/shipping.ts`/tarifs orphelins comme connus, **mais documente que le tunnel “hardcode une zone”** — ce n'est pas le cas ici : il offre activement la livraison. C'est l'écart entre la décision documentée et le code réel qui est le finding (et non une demande de re-câblage tarifaire).
- **Impact** : prix communiqué au client (via WhatsApp) ≠ donnée réservée ; promesse d'un mode de livraison non honoré. Risque de litige/confusion à la coordination.
- **Reco** : aligner le tunnel sur click&collect — retirer (ou cacher derrière un flag off) les `ZoneCard` `santo_domingo`/`interior` de `ShippingStep`, forcer `pickup`, et dans `whatsapp.ts` ne plus ajouter `shippingCost` au total (ou n'afficher que « Retiro en farmacia · Gratis »). Ne touche pas aux colonnes `shipping_*` (orphelines assumées).
- **Confiance** : haute

### [WS34-04] Le message WhatsApp de confirmation dépend d'un brouillon sessionStorage non persistant — P2
- **Fichier** : `src/app/[locale]/(checkout)/reservation/confirmation/[id]/ConfirmationClient.tsx:63-74,84-131` ; alimenté par `ReservationClient.tsx:141-152` (`sessionStorage 'farmau:reservation:last'`)
- **Catégorie** : logique-métier / bug
- **Constat** : l'adresse, le mode de livraison, la note client, l'email et le `subtotal` du payload WhatsApp proviennent du `sessionStorage` posé par le tunnel, **jamais stockés en DB**. La page confirmation ne lit en base que `total_price`, `contact_name/phone`, et les items snapshot. Si l'utilisateur ouvre le lien de confirmation sur un autre appareil, rouvre l'onglet après expiration de session, vide son stockage, ou rafraîchit dans certains cas, `draft` est `null` → le message retombe sur `{ kind: 'pickup' }` + contact partiel et **perd** adresse/note ; le `subtotal` retombe sur `total_price` (cohérent) mais toute la mise en forme de livraison disparaît. La salutation H1 (`firstName`) dégénère aussi.
- **Impact** : message de coordination incohérent/incomplet selon le contexte ; expérience non déterministe pour une étape « cœur » (le contact WhatsApp est la finalité du flux). Aucune perte de données critique en base (le snapshot DB tient), mais le canal de coordination est fragile.
- **Reco** : persister les champs de coordination (mode/adresse/note) sur la réservation (colonnes ou JSONB), ou reconstruire le message WhatsApp **entièrement côté serveur** à partir des données DB + `getShopSettings()`. À défaut, documenter que la confirmation n'est exploitable que dans l'onglet d'origine.
- **Confiance** : haute

### [WS34-05] Course concurrente sur `create_reservation` : l'index unique lève `23505` mappé en 500 générique (au lieu de 409 already_active) — P3
- **Fichier** : `supabase/migrations/20260519183407_rpc_create_reservation.sql:41-48,99-110` (check `EXISTS` non atomique avec l'INSERT) ; mapping `src/app/api/cart/reserve/route.ts:86-151`
- **Catégorie** : logique-métier / bug (cas limite)
- **Constat** : la RPC vérifie d'abord « pas déjà une réservation active » puis INSERT. Deux appels simultanés (double-clic / double-soumission) peuvent tous deux passer le `EXISTS`, puis le second viole `uniq_active_reservation_per_user` → PostgreSQL lève `ERRCODE=23505`. Le `switch (rpcError.code)` du route ne gère que `P0001` (le check explicite) ; `23505` tombe dans `default` → réponse générique 500 « rpc_error », alors que la condition métier est exactement « réservation déjà active » (409).
- **Impact** : sur double-soumission, l'utilisateur voit une erreur serveur opaque au lieu du message « vous avez déjà une réservation active ». L'intégrité reste protégée (l'index unique fait son travail) — c'est purement le mapping d'erreur qui est faux.
- **Reco** : capturer `unique_violation` dans la RPC (`EXCEPTION WHEN unique_violation THEN RAISE … USING ERRCODE='P0001'`) ou ajouter `case '23505':` → 409 `already_active` dans le route.
- **Confiance** : haute

### [WS34-06] Formatage DOP incohérent : PDP `toFixed(0)` (0 décimale) vs panier/WhatsApp `formatPrice` (2 décimales) — P3
- **Fichier** : `src/lib/formatPrice.ts:20` (`fractionDigits = 2` par défaut) ; `src/components/ProductClient.tsx:136` (`product.price.toFixed(0)`) vs `CartLineItem.tsx:21`, `CartSummary.tsx:31`, `whatsapp.ts:55`, `ConfirmationRecap.tsx:58` (tous `formatPrice` → 2 décimales)
- **Catégorie** : i18n / logique-métier (cosmétique)
- **Constat** : le même prix DOP s'affiche « 100 DOP » sur la fiche produit et « 100.00 DOP » dans le panier, le récapitulatif et le message WhatsApp. Le brief évoque « formatage DOP 0 décimale » comme attendu, mais `formatPrice` impose 2 décimales par défaut et n'est jamais appelé avec `{ fractionDigits: 0 }` dans le funnel. Aucune règle « DOP = 0 décimale » n'est codifiée dans `constants.ts`.
- **Impact** : incohérence visuelle de prix tout au long du tunnel d'achat. Pas d'erreur de calcul (les montants sont identiques), seulement de présentation.
- **Reco** : trancher la convention (0 ou 2 décimales pour DOP) et l'appliquer uniformément, soit en changeant le défaut de `formatPrice`, soit en passant `{ fractionDigits: 0 }` partout (et en remplaçant le `toFixed(0)` du PDP par `formatPrice`).
- **Confiance** : haute

### [WS34-07] `create_reservation` agrège la devise via `MAX(pr.currency)` — sémantiquement faux si multi-devises — P3
- **Fichier** : `supabase/migrations/20260519183407_rpc_create_reservation.sql:84-88`
- **Catégorie** : data / logique-métier (latent)
- **Constat** : `SELECT … MAX(pr.currency) … INTO v_currency` choisit arbitrairement la devise « la plus grande » alphabétiquement parmi les items, et `total_price = SUM(quantity*price)` additionne des prix sans vérifier l'unicité de devise. Inoffensif aujourd'hui (toutes les lignes `products.currency='DOP'`, vérifié en live), mais devient incorrect si une 2e devise apparaît.
- **Impact** : nul tant que mono-devise ; risque de total mélangeant des devises sans avertissement si le catalogue évolue.
- **Reco** : soit assumer mono-devise et coder en dur `'DOP'` (cohérent avec `DEFAULT_CURRENCY`), soit grouper/valider que tous les items partagent la même devise et lever une exception sinon.
- **Confiance** : moyenne

### [WS34-08] `clearCart` émet N requêtes DELETE parallèles (N allers-retours + N RPC) — P3
- **Fichier** : `src/hooks/useCart.ts:236-243`
- **Catégorie** : perf
- **Constat** : `clearCart` mappe les items vers autant de `fetch(DELETE /api/cart?productId=…)`, chacun déclenchant `resolveCartContext()` (1 `getUser`) + `get_or_create_cart` n'est pas appelé ici, mais `remove_from_cart` l'est, soit N RPC + N résolutions de session pour vider un panier de N lignes.
- **Impact** : surcoût réseau/DB proportionnel à la taille du panier sur une opération unique « vider ». Faible en pratique (paniers courts), mesurable sur gros paniers.
- **Reco** : exposer un DELETE « clear » (sans `productId` → vide tout le cart de l'appelant en un `DELETE FROM cart_items WHERE cart_id=…`), ou une RPC `clear_cart`.
- **Confiance** : haute

### [WS34-09] `create_reservation` et `expire_stale_reservations` n'ont pas `pg_temp` dans `search_path` (les autres RPC l'ont) — P3
- **Fichier** : `supabase/migrations/20260519183407_rpc_create_reservation.sql:127` (`SET search_path = public`) ; `supabase/migrations/20260519184500_pg_cron_expire_reservations.sql:30` (idem). Confirmé en live : `config = ["search_path=public"]` vs `["search_path=public, pg_temp"]` pour `add_to_cart`/`get_or_create_cart`/`remove_from_cart`/`merge_anon_cart_to_user`.
- **Catégorie** : sécurité (durcissement / dette)
- **Constat** : la migration `20260522092810` a ajouté `pg_temp` aux 9 fonctions qu'elle visait, mais `create_reservation` et `expire_stale_reservations` (déjà créées avec `SET search_path = public` seul) n'ont pas été réalignées. Sans `pg_temp` explicite, son placement par défaut est en tête de `search_path` — surface d'attaque théorique par shadowing d'objets temporaires sur des fonctions `SECURITY DEFINER`.
- **Impact** : risque résiduel faible (les corps ne créent pas d'objets temp et qualifient `public.`), mais incohérence de durcissement avec le reste du parc RPC. À recouper avec WS24 (DB security).
- **Reco** : `ALTER FUNCTION public.create_reservation(uuid) SET search_path = public, pg_temp;` (idem `expire_stale_reservations()`).
- **Confiance** : moyenne

## Points positifs (court)
- **Snapshot réservation propre** : `create_reservation` fige `product_name` + `unit_price` (`reservation_items`) et `contact_phone/email/name` au moment T ; les modifications ultérieures du produit/profil n'altèrent pas une réservation existante. Le flux manuel admin (`api/admin/reservations` POST) applique le même pattern.
- **Sécurité RPC bien pensée** : `create_reservation` n'accepte **pas** de `p_user_id` (utilise `auth.uid()` interne → impossible de réserver pour autrui) ; grants durcis (`add_to_cart`/`remove_from_cart`/`get_or_create_cart` = `service_role` only, vérifié en live) ; `is_user_admin` laissée exécutable par `anon` à dessein.
- **Unicité « 1 réservation active »** garantie au niveau DB par un `UNIQUE … WHERE status IN ('pending','confirmed')` (atomique, résiste aux races — cf. seul le mapping d'erreur 23505 est à corriger, WS34-05).
- **PATCH vs POST** bien séparés et **documentés** dans le code (`route.ts:245-247`, `useCart.ts:195`) : absolu vs incrément — la chaîne UI→hook→API est cohérente sur ce point (le défaut est ailleurs, dans la validation de stock du POST).
- **Merge anon→user** robuste (`merge_anon_cart_to_user` SECURITY DEFINER gère reclaim + fusion `ON CONFLICT`), déclenché une seule fois sur vraie transition d'identité (`useAuth.ts:49-53`).

## Signalements hors périmètre (1 ligne chacun, max 5)
- `src/lib/whatsapp.ts:39` lit `NEXT_PUBLIC_WHATSAPP_NUMBER` (env client) alors que `getShopSettings()` expose déjà un `contact_phone`/`pickup_phone` — source de numéro WhatsApp dédoublée (cohérence config, hors WS34).
- `reservationCreate.unit_price` (`src/lib/schemas.ts:156`) n'a pas de borne haute (`nonnegative` seul) → réservation manuelle admin peut figer un prix arbitraire (faible risque, admin-only — WS validation/admin).
- Le `total_price` du panier affiché à l'utilisateur exclut la livraison partout (`CartSummary`), ce qui est correct pour click&collect — mais incohérent avec le total WhatsApp (cf. WS34-03) ; à trancher au niveau produit.

## Zones non couvertes / à re-vérifier humainement
- **Comportement réel du `pg_cron`** : je n'ai pas pu exécuter le job ni inspecter `cron.job`/`cron.job_run_details` en lecture pour confirmer que `expire-stale-reservations` tourne effectivement toutes les 5 min en prod (vérif MCP possible mais hors strict périmètre fichiers).
- **Reproduction navigateur de WS34-01** (double POST au-delà du stock) et **WS34-04** (perte de sessionStorage cross-device) : confirmés par lecture du code, à valider en e2e.
- Le `total_price NUMERIC(10,2)` plafonne à ~99 999 999.99 ; avec le bug WS34-01 (quantité non bornée) + de futurs prix réels, un dépassement de précision est théoriquement possible — non atteignable à 100 DOP placeholder, à re-checker après saisie des vrais prix.
