# WS29 — Hooks & state client

**Périmètre** : `src/hooks/useAuth.ts`, `src/hooks/useCart.ts`, `src/hooks/useIsAdmin.ts`, `src/hooks/useMediaQuery.ts`, `src/hooks/useModalA11y.ts`, `src/hooks/useWishlist.ts`
**Fichiers lus** : 6 hooks + 8 consommateurs/dépendances pour recoupement (`AuthProvider`, `AddToCartButton`, `CartDrawer`, `ProductCardHeart`, `StockEditModal`, `BlogClient`, `src/types/cart.ts`, `src/app/api/cart/route.ts`, `src/__tests__/setup.ts`)
**Lignes parcourues (approx.)** : ~620 (hooks) + ~900 (recoupement)
**Synthèse** : P0=0 · P1=1 · P2=4 · P3=7

---

## Findings

### [WS29-01] `useAuth` ne gère pas le switch d'identité A→B (merge panier + purge wishlist sautés) — P1
- **Fichier** : `src/hooks/useAuth.ts:49-53`
- **Catégorie** : bug / data
- **Constat** : la branche `SIGNED_IN` ne déclenche `handleUserLogin()` (merge panier anon→user + purge SWR `/api/wishlist`) **que** si `previousUserId === null || undefined`. Pour une transition d'un utilisateur connecté A vers un autre utilisateur B **sans `SIGNED_OUT` intermédiaire** (`incomingUserId(B) !== previousUserId(A)`, mais `previousUserId(A)` n'est ni `null` ni `undefined`), le `handleUserLogin()` est **sauté**, alors que `previousUserIdRef.current = incomingUserId` est mis à jour quand même (ligne 53, hors du `if` interne). Résultat : le cache SWR `/api/wishlist` n'est pas purgé et `refreshCart()` n'est pas rejoué → l'utilisateur B voit les favoris (et potentiellement le panier mémorisé) de A sur un navigateur partagé.
- **Impact** : sur navigateur partagé, fuite des favoris d'un compte vers un autre tant que la tab n'est pas rechargée. `useIsAdmin.ts:78` gère explicitement ce cas (`incomingUserId !== previousUserId` re-check), et CLAUDE.md affirme que le fix `useRef` couvre `userA→userB` pour les **deux** hooks — c'est faux pour `useAuth`.
- **Reco** : aligner sur `useIsAdmin` : si `SIGNED_IN && incomingUserId && incomingUserId !== previousUserId`, jouer `handleUserLogin()` quel que soit `previousUserId` (le merge anon est idempotent ; la purge wishlist est nécessaire dans tous les cas), puis mettre à jour le ref. Le merge anon→user reste pertinent même pour A→B (panier invité ouvert dans un onglet tiers).
- **Confiance** : moyenne (logique certaine ; déclenchement réel dépend de Supabase qui route souvent via `SIGNED_OUT` d'abord, mais le sign-in direct sans logout est possible).

### [WS29-02] `useModalA11y` re-exécute le focus-trap à chaque re-render parent (dep `onClose` instable) — P2
- **Fichier** : `src/hooks/useModalA11y.ts:76` (deps `[open, onClose]`) + consommateurs `src/app/admin/product/page.tsx:164`, `src/app/admin/marques/page.tsx:218,229`, `src/app/admin/tags/page.tsx:226,237`, `src/app/admin/annonce/page.tsx:180`, `src/app/admin/messages/page.tsx:175`, `src/components/NavBar.tsx:454,457`
- **Catégorie** : a11y / bug
- **Constat** : tous ces consommateurs passent `onClose={() => setX(false)}` — une **nouvelle référence de fonction à chaque render** (seuls `CartDrawer.tsx:39`, `BlogClient.tsx:57` et le drawer réservation utilisent `useCallback`). Comme `onClose` est dans les deps de l'effet, **tout re-render du parent pendant que la modale est ouverte ré-exécute l'effet** : le cleanup restaure `previousActive?.focus()` + restaure `overflow`, puis l'effet re-capture `previousActive = document.activeElement` (ligne 31) et **re-focus le premier élément focusable** (ligne 39).
- **Impact** : (1) vol de focus — si le parent re-render (refresh SWR, état frère, toast `sonner`…) pendant la saisie dans la modale, le focus saute au premier champ. (2) Corruption de la restauration : si le focus est dans le dialog au moment du re-run, `previousActive` devient un nœud du dialog → à la fermeture, le focus n'est plus rendu au déclencheur d'origine (régression WCAG 2.4.3). (3) `document.body.style.overflow` est lu/réécrit en boucle (bénin).
- **Reco** : stabiliser via un `onCloseRef` interne (`useRef` mis à jour à chaque render dans l'effet) et ne dépendre que de `[open]` ; OU imposer `useCallback` à tous les consommateurs. La première option est plus robuste (n'exige rien des appelants).
- **Confiance** : haute (mécanisme), moyenne (fréquence — dépend des re-renders parent).

### [WS29-03] `BlogClient` ignore le `dialogRef` retourné par `useModalA11y` → focus-trap & restauration inopérants — P2
- **Fichier** : `src/components/admin/blog/BlogClient.tsx:63` (appel `useModalA11y(modalOpen, closeModal)` sans récupérer le retour) ; la modale `role="dialog"` est à `BlogClient.tsx:221` **sans `ref`**
- **Catégorie** : a11y
- **Constat** : `useModalA11y` retourne un `dialogRef` qui doit être posé sur le conteneur `role="dialog"` pour que le focus initial (`useModalA11y.ts:35-39`), le Tab-trap (`53-67`) et la restauration de focus opèrent. Ici le retour est **jeté** et aucun `ref` n'est attaché. Seuls le scroll-lock du body et la fermeture par Escape fonctionnent ; le piège de focus et le focus initial sont **morts** pour la modale d'édition de blog.
- **Impact** : navigation clavier non confinée à la modale blog (Tab sort vers la page derrière), pas de focus initial, pas de restitution — modale partiellement inaccessible. Contredit l'affirmation CLAUDE.md « `role=dialog` + focus trap sur 13 modales admin ».
- **Reco** : `const dialogRef = useModalA11y(modalOpen, closeModal)` et poser `ref={dialogRef}` sur l'élément `role="dialog"` (ligne ~221).
- **Confiance** : haute (vérifié : un seul `role="dialog"`, aucun `ref` attaché dans le fichier).

### [WS29-04] `addToCart` est un no-op silencieux avant hydratation SWR → faux succès UI — P2
- **Fichier** : `src/hooks/useCart.ts:56` (`if (!data?.cart) return`) ↔ `src/components/AddToCartButton.tsx:44-52`
- **Catégorie** : bug / logique-métier
- **Constat** : si SWR n'a pas encore hydraté `/api/cart`, `addToCart` retourne immédiatement **sans rien faire et sans lever d'erreur**. Le bouton `await addToCart(...)` puis passe à `setShowSuccess(true)` (état « Ajouté ✓ ») — l'utilisateur croit avoir ajouté le produit alors que rien n'a été envoyé au serveur.
- **Impact** : sur un clic rapide au premier paint (avant le GET `/api/cart`), produit non ajouté mais feedback de succès. Fenêtre courte mais réelle. Les tests e2e contournent en attendant le GET (`gotoCatalogueReady`), ce qui masque le bug en CI mais pas en prod.
- **Reco** : faire de `addToCart` une opération qui ne dépend pas de `data?.cart` (le `cart_id` est résolu côté serveur via cookie/`getUser`, l'optimistic peut être omis si `data` absent et un `await refreshCart()` suffit), OU `throw`/retourner un statut quand `!data?.cart` pour que le bouton n'affiche pas le succès. À défaut, désactiver le bouton tant que `isLoading`.
- **Confiance** : haute.

### [WS29-05] `useCart` mute en place les objets items du cache SWR — P2
- **Fichier** : `src/hooks/useCart.ts:74` (`optimisticData.cart.items[existingItemIndex].quantity += quantity`) et `:185` (`optimisticData.cart.items[itemIndex].quantity = quantity`)
- **Catégorie** : bug / archi
- **Constat** : `optimisticData.cart.items` est un **shallow copy** (`[...data.cart.items]`, lignes 63/181) : les objets `item` à l'intérieur sont les **mêmes références** que dans `data` (le cache SWR courant). Incrémenter/écraser `.quantity` mute donc l'objet item **dans le cache `data` lui-même** avant même l'appel `mutate(optimisticData, false)`. Anti-pattern d'état immutable : (a) une 2ᵉ invocation rapide d'`addToCart` part d'un `data` déjà muté ; (b) tout composant lisant `data` voit une mutation hors-cycle React (risque de re-render manqué / valeur incohérente le temps de la revalidation). `removeFromCart` (`.filter`) et `clearCart` (`items: []`) sont corrects ; seuls `addToCart`/`updateQuantity` sont concernés.
- **Impact** : incohérences transitoires de quantité sur clics rapprochés ; fragilise le « rollback » (le `data` de référence est déjà altéré). Masqué la plupart du temps par `refreshCart()` qui réécrit depuis le serveur.
- **Reco** : copier en profondeur les items modifiés : `items: data.cart.items.map((it, i) => i === idx ? { ...it, quantity: newQ } : it)`.
- **Confiance** : haute.

### [WS29-06] Double `check()` concurrent possible au mount de `useIsAdmin` — P3
- **Fichier** : `src/hooks/useIsAdmin.ts:65` (`check(true)`) + `:78` (listener `SIGNED_IN`)
- **Catégorie** : perf / smell
- **Constat** : `check(true)` est lancé immédiatement et met à jour `currentUserIdRef.current` **après** l'`await getSession()` (ligne 47). Si Supabase émet `SIGNED_IN` avant la résolution de ce premier `getSession`, le listener voit encore `previousUserId = null` → déclenche un **second `check()`** concurrent. Le flag `cancelled` n'annule qu'au démontage, il ne déduplique pas deux checks en vol → 2× `getSession` + 2× RPC `is_user_admin`.
- **Impact** : double appel réseau/RPC au chargement dans certaines courses ; résultat idempotent (dernier `setIsAdmin` gagne), donc pas de bug fonctionnel.
- **Reco** : poser `currentUserIdRef.current = session.user.id` de façon synchrone dans le listener avant d'appeler `check()`, ou garder un flag `inFlight`.
- **Confiance** : moyenne (course non garantie selon la version Supabase).

### [WS29-07] `signIn` / `signUp` / `signOut` exportés par `useAuth` mais non consommés — P3
- **Fichier** : `src/hooks/useAuth.ts:74-122`
- **Catégorie** : dette / code mort
- **Constat** : le seul consommateur de `useAuth` est `src/components/AuthProvider.tsx:12`, qui appelle `useAuth()` et **jette la valeur de retour**. Les pages login/signup/forgot appellent `supabase.auth.*` directement. Les trois helpers retournés (et leur JSDoc) sont donc effectivement morts.
- **Impact** : surface morte, risque de divergence (ces helpers ne reflètent pas le flux auto-login réel du signup). Le mock de test `src/__tests__/setup.ts:67` mock `useCart`, pas ces helpers.
- **Reco** : soit retirer le retour de `useAuth` (le réduire à un effet pur), soit câbler les pages auth dessus pour centraliser. Confiance basse sur « mort total » uniquement si un usage hors `src/` existe (improbable).
- **Confiance** : moyenne (grep `useAuth\b` sur `src/` = seul `AuthProvider`, retour ignoré).

### [WS29-08] `useModalA11y` Escape : `stopPropagation` ne bloque pas les listeners frères (modales empilées) — P3
- **Fichier** : `src/hooks/useModalA11y.ts:48-50`
- **Catégorie** : a11y / bug
- **Constat** : chaque instance ajoute un listener `keydown` sur `document`. `e.stopPropagation()` empêche la **remontée** vers les ancêtres mais **pas** l'exécution des autres listeners attachés au **même** `document` (il faudrait `stopImmediatePropagation`). Avec deux modales ouvertes simultanément, un Escape déclenche `onClose` des **deux**.
- **Impact** : fermeture en cascade de modales empilées. Cas rare dans l'app actuelle (pas de pattern modale-dans-modale repéré), donc impact faible aujourd'hui.
- **Reco** : utiliser `stopImmediatePropagation` ou un registre/stack de modales pour ne fermer que la plus haute.
- **Confiance** : moyenne.

### [WS29-09] `useModalA11y` peut focus un élément masqué (sélecteur ne filtre pas `display:none`/`aria-hidden`) — P3
- **Fichier** : `src/hooks/useModalA11y.ts:36-39` et `:54-56`
- **Catégorie** : a11y
- **Constat** : `querySelector(All)` retient les éléments non-`[disabled]` mais inclut ceux en `display:none`, `visibility:hidden`, `hidden` ou `aria-hidden`. Le focus initial peut ainsi atterrir sur un bouton invisible, et le Tab-trap calculer un `first`/`last` masqué.
- **Impact** : focus invisible pour l'utilisateur clavier dans des modales à sections conditionnelles cachées par CSS (pas par démontage).
- **Reco** : filtrer via `offsetParent !== null` (ou `getClientRects().length`) et exclure `[aria-hidden="true"]`.
- **Confiance** : moyenne (dépend du markup de chaque modale).

### [WS29-10] `useWishlist.toggle` : race sur clics rapprochés (closure sur `data`/`productIds`) — P3
- **Fichier** : `src/hooks/useWishlist.ts:36-75`
- **Catégorie** : bug
- **Constat** : `toggle` est mémoïsé sur `[productIds, data, mutate]`. Deux invocations rapprochées (avant que SWR ait re-rendu avec la 1ʳᵉ mutation) capturent le **même** `productIds`/`data` → la 2ᵉ recalcule son optimistic depuis l'état pré-1ʳᵉ-clic et le rollback éventuel restaure ce `data` périmé. Atténué par `revalidate:false` + `mutate()` final de resync, mais un double-clic peut produire un flip-flop visuel transitoire.
- **Impact** : faible (resync serveur final corrige), purement visuel/transitoire.
- **Reco** : utiliser la forme fonctionnelle de `mutate` (`mutate(curr => …, {revalidate:false})`) pour calculer l'optimistic et le rollback depuis l'état courant du cache, pas depuis une closure.
- **Confiance** : moyenne.

### [WS29-11] `useWishlist` : `await res.json()` avant le test `res.ok` (parse inutile / mauvais routage d'erreur) — P3
- **Fichier** : `src/hooks/useWishlist.ts:60-64`
- **Catégorie** : dette
- **Constat** : après le 401, le code fait `await res.json()` **avant** de vérifier `!res.ok`. Sur succès le corps JSON est lu puis ignoré (inutile) ; sur une 5xx renvoyant un corps non-JSON, `res.json()` jette et la branche `!res.ok` (rollback `{ok:false}`) n'est jamais atteinte — c'est le `catch` qui gère (même résultat de rollback, donc pas de bug fonctionnel, mais logique trompeuse).
- **Impact** : nul fonctionnellement (les deux chemins rollback), code peu clair, parse superflu.
- **Reco** : tester `res.ok` d'abord, ne parser le corps que si nécessaire.
- **Confiance** : haute.

### [WS29-12] `clearCart` : pas d'endpoint dédié, N suppressions parallèles (atomicité partielle) — P3
- **Fichier** : `src/hooks/useCart.ts:237-243`
- **Catégorie** : perf / archi
- **Constat** : le vidage émet un `DELETE /api/cart?productId=…` **par item** en `Promise.all`. Chaque requête re-traverse `guardMutation` + `resolveCartContext` + RPC `remove_from_cart`. Si l'une rejette, `Promise.all` rejette tandis que les autres restent en vol → état partiellement vidé jusqu'au `refreshCart()`.
- **Impact** : surcoût réseau proportionnel au panier ; pas de bug dur (l'état serveur reste cohérent et `refreshCart` réaligne).
- **Reco** : ajouter un `DELETE /api/cart?all=1` (ou réutiliser une RPC `clear_cart`) pour une opération atomique en un appel. À défaut, acceptable au stade actuel.
- **Confiance** : haute (constat factuel) / la priorité reste basse.

---

## Points positifs (court)
- `useMediaQuery` (`src/hooks/useMediaQuery.ts`) : exemplaire — SSR-safe (retourne `defaultValue` au SSR + 1er render, pas de mismatch d'hydratation), gère le fallback Safari `addListener/removeListener`, cleanup correct, pas de stale closure.
- `useIsAdmin` : la garde anti-flash via `currentUserIdRef` (ne replonge en `loading` que sur vraie transition d'identité) + flag `cancelled` + `unsubscribe` est propre et gère le cas A→B (contrairement à `useAuth`).
- `useCart` : le pattern optimistic + rollback-par-revalidation (`refreshCart()` dans `catch`) est sain ; les commentaires PATCH=absolu / POST=incrément (`:195`) sont justes et précieux.
- Cleanup des subscriptions/listeners systématiquement présent (`useAuth:65`, `useIsAdmin:83-86`, `useModalA11y:71-75`, `useMediaQuery:23/26`) — aucune fuite de listener détectée.
- `useWishlist` : le 401→`{productIds:[]}` dans le fetcher (anon = liste vide sans erreur) + `needAuth` est une bonne séparation UI/données.

## Signalements hors périmètre (1 ligne chacun, max 5)
- `useCart`/`AddToCartButton` n'appliquent jamais `MAX_CART_QUANTITY` (`src/lib/constants.ts`) — le plafond de quantité repose uniquement sur le `stock` côté API (`/api/cart` POST/PATCH). (WS sur composants panier / lib)
- `AuthProvider` (monté app-wide) consomme `useCart()` juste pour `refreshCart`, ajoutant un abonné SWR `/api/cart` global (dédupliqué, mais couplage discutable). (WS layout/providers)
- J'ai laissé un fichier vide non suivi `.audit-mq.txt` à la racine (artefact d'un grep avorté par une saturation du tmp du harness) ; suppression bloquée par la deny-list `rm` — à retirer à la main.

## Zones non couvertes / à re-vérifier humainement
- Liste exhaustive des consommateurs de `useMediaQuery` non récupérée (grep récursif `src/` cassé en cours d'audit par une saturation `ENOSPC` du répertoire temporaire du harness, hors de mon contrôle) ; l'analyse du hook tient sur son propre code (contrat SSR auto-suffisant, aucun consommateur ne peut le violer), mais la validation de chaque appelant (valeur `defaultValue` cohérente avec l'hypothèse SSR) reste à confirmer.
- WS29-02 (vol de focus) : la **fréquence réelle** dépend des re-renders parent pendant qu'une modale est ouverte — à valider en navigateur sur `ProductFormModal`/`BannerFormModal` (formulaires longs) lors d'un refresh SWR concurrent.
- WS29-06 (double `check`) : course dépendante de la version `@supabase/supabase-js` ; à confirmer par instrumentation réseau au mount de `/admin`.
