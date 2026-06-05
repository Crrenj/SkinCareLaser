# WS04 — Panier UI

**Périmètre** : `src/app/[locale]/cart/page.tsx`, `src/components/CartClient.tsx`, `src/components/CartDrawer.tsx`, `src/components/CartIcon.tsx`, `src/components/AddToCartButton.tsx`, `src/components/cart/{CartDrawerSummary,CartEmpty,CartLineItem,CartSummary}.tsx`, `src/types/cart.ts`
**Fichiers lus** : 10 in-scope + 8 de contexte (`useCart.ts`, `api/cart/route.ts`, `useModalA11y.ts`, `constants.ts`, `formatPrice.ts`, `NavBar.tsx`, `ProductCard.tsx`, `reservation/page.tsx`) · **Lignes parcourues (approx.)** : ~1 500
**Synthèse** : P0=0 · P1=1 · P2=6 · P3=5

## Findings

### [WS04-01] « Ajouté ✓ » affiché même quand `addToCart` est un no-op (panier non hydraté) — P1
- **Fichier** : `src/components/AddToCartButton.tsx:44-52` (cause partagée : `src/hooks/useCart.ts:55-56`)
- **Catégorie** : bug | logique-métier
- **Constat** : `handleAddToCart` fait `await addToCart(...)` puis `setShowSuccess(true)` dès que la promesse résout sans throw. Or `useCart.addToCart` commence par `if (!data?.cart) return` : tant que le SWR `GET /api/cart` n'a pas hydraté le panier (premier paint, réseau lent, after-cold-start), l'appel **ne fait rien et résout `undefined`**. Le bouton affiche alors « Ajouté ✓ » et incrémente visuellement zéro article. Aucun POST n'est émis. Le même piège vaut pour les 4 variantes (`icon`, `card-cta-quick`, `card-cta`, générique) car toutes partagent `handleAddToCart`.
- **Impact** : faux positif de succès → l'utilisateur croit avoir ajouté un produit alors que le panier reste vide. Survient surtout au tout premier clic après chargement de page (cas réel sur catalogue lent). Le badge panier ne bouge pas, contradiction visible. Régression UX directe sur le flux cœur « ajouter au panier ». (Déjà connu indirectement : les tests Playwright contournent via un helper qui attend le GET `/api/cart`.)
- **Reco** : faire remonter le no-op. Dans `useCart.addToCart`, soit lancer une erreur quand `!data?.cart` (et la traiter dans le bouton), soit retourner un booléen de succès ; côté `AddToCartButton`, ne `setShowSuccess(true)` que si l'opération a réellement abouti. Alternative : désactiver le bouton tant que `useCart().isLoading` (ou `!cart`).
- **Confiance** : haute

### [WS04-02] `CartIcon.tsx` est du code mort (composant jamais monté) — P2
- **Fichier** : `src/components/CartIcon.tsx` (tout le fichier)
- **Catégorie** : dette | code mort
- **Constat** : `grep -rn "CartIcon"` sur tout le repo (src + tests) ne renvoie que les 2 lignes de déclaration interne au fichier. La NavBar rend son **propre** bouton panier inline (`src/components/NavBar.tsx:407-446`, `data-testid="cart-icon"` posé là, icône `ShoppingBag`), pas ce composant (`ShoppingCart`). `git log` confirme un vestige de la création initiale du dashboard (`72a2029`), touché seulement par des refactors transverses (focus-visible) depuis.
- **Impact** : ~45 lignes mortes, `useCart()` instancié pour rien, divergence d'icône/de comportement (le composant mort n'est pas un toggle, badge plafonné « 99+ » vs NavBar « 99+ » aussi). Source de confusion (le `data-testid="cart-icon"` réel est ailleurs).
- **Reco** : supprimer `src/components/CartIcon.tsx`.
- **Confiance** : haute

### [WS04-03] `MAX_CART_QUANTITY` jamais appliqué ; le plafond du stepper est le `99` hardcodé — P2
- **Fichier** : `src/components/cart/CartLineItem.tsx:44` (et `src/lib/constants.ts:15`)
- **Catégorie** : bug | logique-métier
- **Constat** : `handleInc` borne à `item.quantity < (p.stock || 99)`. (a) La constante dédiée `MAX_CART_QUANTITY` (`constants.ts:15`) n'est importée/utilisée **nulle part** (`grep -rn "MAX_CART_QUANTITY" src/` = 1 seule ligne, sa déclaration) → magie `99` dispersée au lieu de la source unique. (b) `p.stock || 99` : si `p.stock === 0` (produit en rupture déjà présent au panier), le `||` retombe sur **99** → on peut monter la quantité d'un article à stock 0 jusqu'à 99 côté client (le serveur PATCH rejettera ensuite avec « Stock insuffisant », mais le rollback SWR fait clignoter la quantité). Devrait être `p.stock ?? 99` (et idéalement `Math.min(stock, MAX_CART_QUANTITY)`).
- **Impact** : incohérence client/serveur sur les ruptures, flash de quantité au rollback, et la constante censée centraliser le plafond est inerte (dette + risque de dérive).
- **Reco** : `const cap = Math.min(p.stock ?? MAX_CART_QUANTITY, MAX_CART_QUANTITY)` et borner dessus ; importer `MAX_CART_QUANTITY`.
- **Confiance** : haute

### [WS04-04] Le bouton « + » du stepper reste visuellement actif au plafond de stock — P2
- **Fichier** : `src/components/cart/CartLineItem.tsx:253-257` (`onInc` jamais `disabled` au cap)
- **Catégorie** : a11y | bug
- **Constat** : le bouton « − » est `disabled={busy || value <= 1}` (correct), mais « + » est seulement `disabled={busy}`. Le plafond (`value < stock`) n'est appliqué qu'**à l'intérieur** de `handleInc` (clic = no-op silencieux). Le bouton ne reçoit ni `disabled`, ni style désactivé, ni `aria-disabled`.
- **Impact** : un client au stock max (ex. stock=2, quantité=2) clique « + » sans aucun retour visuel ni sonore (rien ne se passe, pas de message). Confusion + trou a11y (état non communiqué). Incohérent avec le « − ».
- **Reco** : passer une prop `atMax` au `QtyStepper` et `disabled={busy || atMax}` sur « + », calculée depuis le même cap que [WS04-03].
- **Confiance** : haute

### [WS04-05] Drawer panier toujours dans le DOM sans `inert`/`aria-hidden` quand fermé — P2
- **Fichier** : `src/components/CartDrawer.tsx:53-130`
- **Catégorie** : a11y
- **Constat** : l'`<aside role="dialog">` est monté en permanence et masqué seulement par `translate-x-full` (hors écran). Quand `isOpen=false`, ses contrôles internes (steppers, boutons trash, CTA Réserver, X) restent **focusables au clavier** (Tab) et **annoncés par les lecteurs d'écran**. Aucun `aria-hidden`/`inert`/`hidden` n'est appliqué à l'état fermé. `useModalA11y` ne piège le focus que lorsqu'ouvert, donc le Tab « fuit » dans un panneau invisible. `role="dialog" aria-modal="true"` est même présent en permanence (annonce trompeuse d'un dialogue ouvert).
- **Impact** : navigation clavier/AT cassée (focus invisible parti dans le drawer caché), contenu interactif fantôme. Standard a11y pour les drawers off-canvas.
- **Reco** : ajouter `inert` (ou `aria-hidden="true"` + `tabIndex` retirés / `hidden` après transition) sur l'`<aside>` quand `!isOpen`, et ne poser `aria-modal` que lorsqu'ouvert.
- **Confiance** : haute

### [WS04-06] Chaînes espagnoles en dur dans `CartDrawerSummary` (surface publique tri-langue) — P2
- **Fichier** : `src/components/cart/CartDrawerSummary.tsx:32`
- **Catégorie** : i18n
- **Constat** : `{itemCount} {itemCount === 1 ? 'producto' : 'productos'}` — pluriel **espagnol codé en dur** dans un composant public servi en FR (défaut), EN et ES. Une clé ICU dédiée existe pourtant et reste inutilisée : `Cart.drawerProductsCount` (`{count, plural, ...}`, présente dans `fr/es/en.json`).
- **Impact** : le résumé du drawer affiche « 2 productos » même en français/anglais → texte non traduit visible sur le tunnel panier. Viole la convention « aucune string FR/ES dure » (et là c'est ES).
- **Reco** : remplacer par `t('drawerProductsCount', { count: itemCount })`.
- **Confiance** : haute

### [WS04-07] `aria-label` codé en dur (FR) dans `CartIcon` — P3
- **Fichier** : `src/components/CartIcon.tsx:21`
- **Catégorie** : i18n
- **Constat** : `aria-label="Ouvrir le panier"` en français en dur. (Composant par ailleurs mort — cf. [WS04-02].)
- **Impact** : nul en prod (jamais monté) ; à signaler car si le composant était réutilisé il casserait l'i18n + l'a11y EN/ES.
- **Reco** : supprimer le fichier ([WS04-02]) ; sinon passer par `useTranslations`.
- **Confiance** : haute

### [WS04-08] Clés i18n `Cart.*` définies mais inutilisées (dont `Cart.errors.*` orphelines) — P3
- **Fichier** : `src/components/CartClient.tsx:19-20`, `src/components/CartDrawer.tsx:24` (état d'erreur jamais alimenté) + `src/messages/{fr,es,en}.json` namespace `Cart`
- **Catégorie** : dette | i18n
- **Constat** : croisement des `t('…')` réellement appelés dans le périmètre vs clés définies → inutilisées dans la surface panier : `Cart.summary`, `Cart.productsHeading`, `Cart.total`, `Cart.removeTitle`, `Cart.reserveSubtext`, `Cart.drawerProductsCount` (cf. [WS04-06]), `Cart.empty.mobileLede`, et tout `Cart.errors.{alreadyActive,cartEmpty,generic,network}`. Ces dernières témoignent d'un **état d'erreur de réservation mort** : `CartClient` (`reserveError`/`setReserveError`) et `CartDrawer` (`reserveError`) déclarent un state d'erreur passé à `CartSummary`/`CartDrawerSummary`, mais `handleReserve` se contente de `router.push('/reservation')` — aucune erreur n'y est jamais écrite (le guard est server-side sur `/reservation`). Le bloc `{error && <div role="alert">…}` est donc inatteignable, et `setReserveError` n'est appelé que pour le remettre à `null`.
- **Impact** : ~9 clés/locale mortes + branche d'UI + state inertes (faux signal pour un mainteneur : laisse croire à une gestion d'erreur de réservation inline qui n'existe pas). Pas de bug fonctionnel.
- **Reco** : soit retirer l'état d'erreur mort (`reserveError`, prop `error`, bloc alert, clés `Cart.errors.*`), soit réellement surfacer les erreurs de réservation côté panier. Purger les clés inutilisées.
- **Confiance** : haute (usages vérifiés par `grep` sur `src/`)

### [WS04-09] Mutation en place de la quantité partagée avec le cache SWR — P3
- **Fichier** : `src/hooks/useCart.ts:74` (`addToCart`) et `:185` (`updateQuantity`)
- **Catégorie** : bug (latent) | archi
- **Constat** : l'objet optimiste fait `items: [...data.cart.items]` (copie **superficielle** : nouveaux tableau mais **mêmes références d'items**). Puis `optimisticData.cart.items[i].quantity += quantity` / `= quantity` mute l'objet item **partagé avec le cache SWR courant** (`data`). Le top-level `optimisticData` étant remplacé immédiatement via `mutate(..., false)`, le re-render fonctionne ; mais la « valeur précédente » détenue par SWR est elle aussi mutée → un vrai rollback « revenir à l'état d'avant » par cette référence ne reviendrait pas. Le code masque le risque en faisant `refreshCart()` (re-fetch) au lieu d'un revert local, donc impact pratique faible.
- **Impact** : anti-pattern d'immutabilité React ; fragile si un futur changement remplace `refreshCart()` par un revert local (le revert serait inopérant). `removeFromCart`/`clearCart` (filter/[]) sont eux corrects.
- **Reco** : copier en profondeur les items modifiés : `items: data.cart.items.map(it => it.product_id === productId ? { ...it, quantity: … } : it)`.
- **Confiance** : haute (cause), moyenne (gravité actuelle, atténuée par le re-fetch)

### [WS04-10] Fallback `?? 'Mi pedido'` mort et en espagnol dans le drawer — P3
- **Fichier** : `src/components/CartDrawer.tsx:76`
- **Catégorie** : dette | i18n
- **Constat** : `{t('drawerEyebrow') ?? 'Mi pedido'}`. La clé `drawerEyebrow` existe dans les 3 locales (`next-intl` ne renvoie jamais `null/undefined` pour une clé présente — au pire un message d'erreur), donc le `?? 'Mi pedido'` est inatteignable, et le littéral de secours est en espagnol dans une app de défaut FR.
- **Impact** : code mort trompeur + ES en dur (inerte). Aucun effet runtime.
- **Reco** : retirer le `?? 'Mi pedido'`.
- **Confiance** : haute

### [WS04-11] `slug` du lien produit = UUID au lieu du slug réel (CartLineItem) — P3
- **Fichier** : `src/components/cart/CartLineItem.tsx:38,142`
- **Catégorie** : seo | dette
- **Constat** : `const slug = p.id // fallback id` puis `href={`/product/${slug}`}`. Le `CartItem.product` (cf. `src/types/cart.ts:8-23` et le SELECT de `api/cart/route.ts:77-87`) n'expose pas le slug, donc le lien pointe sur `/product/<uuid>`. La PDP fait un 308 vers le slug canonique (commentaire `ProductCard.tsx:12-14`), donc ça marche, mais via redirection.
- **Impact** : redirection 308 systématique depuis le panier (légère latence, lien non canonique), pas de casse fonctionnelle. Sur la page panier seulement (le titre est un lien là ; le drawer ne lie pas le produit).
- **Reco** : ajouter `slug` au SELECT de `api/cart/route.ts` + au type `CartItem.product`, et l'utiliser ici.
- **Confiance** : haute (comportement), moyenne (priorité — c'est mineur)

### [WS04-12] Double affichage du sous-total sur le résumé page (redondance visuelle) — P3
- **Fichier** : `src/components/cart/CartSummary.tsx:49-72`
- **Catégorie** : dette | logique-métier
- **Constat** : en variante `page`, le même montant (`subtotal`) est rendu deux fois : ligne « Sous-total » (`:49-52`) puis bloc « SOUS-TOTAL » en gros (`:62-72` via `subtotalCaps`). Comme il n'y a ni livraison ni taxe additionnée (click & collect, pas de paiement — intentionnel), les deux valeurs sont **toujours identiques**. Le « total » conceptuel = sous-total, donc l'utilisateur voit deux fois le même chiffre.
- **Impact** : redondance/poids visuel, pas un bug. (Choix design assumé possible — à confirmer humainement.)
- **Reco** : envisager de fusionner en un seul « Total » proéminent, ou différencier sémantiquement. Cosmétique.
- **Confiance** : moyenne

## Points positifs (court)
- Le piège **`position:fixed` sous `backdrop-filter`** est correctement géré : `CartDrawer`/`Scrim` sont rendus **hors** du `<header>` (frères, `NavBar.tsx:447-462`, commentaire explicite). Le bouton panier est bien un **toggle** (`setCartOpen((o) => !o)`).
- POST (incrément) vs PATCH (quantité absolue) **respecté** : `useCart.updateQuantity` utilise PATCH (`useCart.ts:196`), `addToCart` utilise POST ; commentaires clairs côté hook et route.
- a11y du drawer **quand ouvert** solide : `useModalA11y` (focus trap + Escape + scroll-lock + restauration focus), `role="dialog" aria-modal`, `aria-label` traduit, steppers/trash avec `aria-label` i18n, `role="alert"` sur les blocs d'erreur.
- Mises à jour optimistes + rollback par re-fetch (`refreshCart`) présentes sur toutes les mutations ; totaux recalculés localement.
- Garde auth/téléphone de la réservation correctement **déléguée au Server Component** `/reservation` (redirige `!session` → login, `!phone` → profil) ; le commentaire de `CartClient` est exact.
- i18n **complète et à parité** FR/EN/ES sur toutes les clés Cart *réellement utilisées* ; prix via `formatPrice`/`Intl.NumberFormat` localisé (devise DOP, 2 décimales cohérentes).

## Signalements hors périmètre (1 ligne chacun, max 5)
- `src/components/ProductCard.tsx:38` redéfinit `const LOW_STOCK_THRESHOLD = 5` localement alors que `src/lib/constants.ts:12` vaut `10` → divergence du seuil « stock bas ».
- `src/components/ProductDetailCard.tsx` semble **inutilisé** (`grep` : aucun import hors du fichier) et son stepper de quantité local est ignoré (le `AddToCartButton variant="default"` ajoute toujours 1) — à confirmer/supprimer.
- `src/app/[locale]/(checkout)/reservation/page.tsx:41` utilise `getSession()` (cookie-only) plutôt que `getUser()` (JWT validé serveur) pour le guard d'accès au tunnel réservation.
- `src/app/api/cart/route.ts` POST/PATCH ne bornent pas la quantité à un maximum (`MAX_CART_QUANTITY`) côté serveur — seul le stock plafonne ; pas de Zod sur ces routes (contrairement au reste).

## Zones non couvertes / à re-vérifier humainement
- Rendu réel des claviers/lecteurs d'écran sur le drawer fermé ([WS04-05]) — confirmer le fix `inert` sur navigateur cible.
- Choix design du double sous-total ([WS04-12]) : volontaire ou à fusionner ?
- Comportement exact d'hydratation de `useCart` au premier paint ([WS04-01]) sur réseau lent / cold start Turbopack en prod — reproduire le faux « Ajouté ✓ ».
