# WS05 — Tunnel réservation + confirmation

**Périmètre** : `src/app/[locale]/(checkout)/**` (layout, reservation/page.tsx, ReservationClient.tsx, confirmation/[id]/page.tsx + ConfirmationClient.tsx) · `src/components/reservation/*` (AddressStep, ShippingStep, ReviewStep, StepIndicator, ReservationDisclaimer, ReservationSummary) · `src/components/confirmation/*` (ConfirmationHeader, ConfirmationRecap, ReservationTimeline, StickyMobileCta, WhatsappHero) · `src/lib/reservation.ts` · `src/lib/shipping.ts`. Fichiers connexes lus (hors périmètre, pour juger) : `src/lib/whatsapp.ts`, `src/app/api/cart/reserve/route.ts`, `src/lib/formatPrice.ts`, RPC `create_reservation` + RLS `reservations`/`reservation_items` (MCP SELECT).
**Fichiers lus** : 17 (périmètre) + 4 connexes · **Lignes parcourues (approx.)** : ~1 700
**Synthèse** : P0=0 · P1=3 · P2=6 · P3=5

## Findings

### [WS05-01] Le coût de livraison est facturé à l'écran mais n'est jamais réservé ni coordonné côté serveur — incohérence majeure click&collect — P1
- **Fichier** : `src/app/api/cart/reserve/route.ts:78-81` (RPC `create_reservation`, `total_price = SUM(ci.quantity * pr.price)` — **subtotal seul**) vs `src/components/reservation/ReservationSummary.tsx:34,130-142` (« Total a coordinar » = subtotal **+** `shippingCost`), `src/components/reservation/ReviewStep.tsx:47,178-187`, `src/components/confirmation/ConfirmationRecap.tsx:60-62,210-220`, `src/lib/whatsapp.ts:52-54,74-75` (`Total a coordinar` inclut le frais).
- **Catégorie** : logique-métier | data
- **Constat** : `ShippingStep` propose deux livraisons **payantes** (`santo_domingo` 300 DOP, `interior` 600 DOP, `src/lib/shipping.ts:23-27`) en plus du retrait gratuit. Le tunnel additionne ce frais dans le total affiché et dans le message WhatsApp. Mais la réservation persistée (`reservations`) **n'a aucune colonne shipping** (vérifié en DB : `total_price` est `NUMERIC` = SUM articles, pas de `shipping_zone`/`shipping_cost`/`delivery_*`) et la RPC ne stocke que le sous-total. Donc : (a) l'admin voit dans `/admin/reservations` un `total_price` qui ne correspond **pas** au total annoncé au client (écart de 300/600 DOP) ; (b) la zone/adresse de livraison choisie n'est persistée **nulle part** — elle ne vit que dans `sessionStorage` (`farmau:reservation:draft` → `farmau:reservation:last`), donc perdue au changement d'appareil ou si l'utilisateur n'ouvre pas WhatsApp dans la foulée.
- **Impact** : promesse de livraison payante affichée et chiffrée mais ni réservée ni transmise de façon fiable. Le marché est documenté **click&collect uniquement** (mémoire `click-and-collect-only`, `_BRIEF.md §3`) : ce tunnel ré-expose des tarifs livraison orphelins, ce qui crée un écart de montant client↔admin et une attente de livraison non tenue. Risque commercial (litige sur le prix) et de confiance.
- **Reco** : aligner sur la décision click&collect — soit retirer les deux `ZoneCard` payantes de `ShippingStep` (ne garder que `pickup`) et purger l'addition `+ shippingCost` partout (Summary/Review/Recap/whatsapp), soit, si la livraison doit exister, persister zone+frais dans `reservations` (colonnes + paramètres RPC) pour que `total_price` et l'admin reflètent le vrai total. Tant que la décision reste click&collect, c'est une régression de cette décision (donc à corriger, pas à ignorer).
- **Confiance** : haute

### [WS05-02] Adresse / livraison / note jamais persistées : perdues cross-device et dès que `sessionStorage` est vidé — P1
- **Fichier** : `src/app/[locale]/(checkout)/reservation/ReservationClient.tsx:141-155` (écrit `farmau:reservation:last` dans sessionStorage), `src/app/[locale]/(checkout)/reservation/confirmation/[id]/ConfirmationClient.tsx:64-74` (relit ce snapshot, sinon fallback dégradé).
- **Catégorie** : data | logique-métier
- **Constat** : l'adresse de livraison, la zone, et la note client saisies aux étapes 1-3 ne sont **jamais écrites en base** — la RPC `create_reservation` ne reçoit que `p_cart_id` et n'enregistre ni adresse ni note. Le seul transport est `sessionStorage`. Conséquences concrètes : (1) si l'utilisateur réserve sur mobile puis ouvre la confirmation/WhatsApp sur desktop (lien partagé, autre device) → adresse/note **perdues**, le message WhatsApp tombe sur le fallback « pickup » même si « delivery » avait été choisi (`ConfirmationClient.tsx:95-109`) ; (2) la **note client** (jusqu'à 500 car., `ReviewStep.tsx:200-206`) n'atteint l'admin que si l'utilisateur envoie effectivement le WhatsApp pré-rempli — sinon elle est définitivement perdue ; (3) l'admin n'a aucune trace serveur de l'adresse/note.
- **Impact** : perte d'information métier saisie par le client (note = demandes spéciales, adresse = livraison). Le commentaire du code l'admet (`ConfirmationClient.tsx:61-62`, `ConfirmationRecap.tsx:37` « non persistés en DB »). Sur un parcours de réservation, c'est une fuite de données fonctionnelles.
- **Impact aggravé par WS05-01** : si la livraison reste, l'adresse devient indispensable et son non-stockage est bloquant.
- **Reco** : persister `customer_note` (et, si livraison conservée, l'adresse) dans `reservations`/`reservation_items` via paramètres de la RPC. A minima stocker la note (champ peu coûteux) pour ne pas dépendre du bon vouloir d'envoi WhatsApp.
- **Confiance** : haute

### [WS05-03] Numéros de contact placeholders et contradictoires dans le fallback WhatsApp — P1
- **Fichier** : `src/components/confirmation/WhatsappHero.tsx:61` (`href="tel:+18091234567"`) et `:69` (`href="mailto:hola@farmau.do"`) ; texte i18n `src/messages/{fr,es,en}.json:449` (`+1 (809) 123-4567`).
- **Catégorie** : bug | data
- **Constat** : le bloc « Pas d'accès à WhatsApp ? Appelez-nous au … » affiche un numéro **bidon** `+1 (809) 123-4567` (i18n) et le `tel:` pointe vers un **autre** numéro bidon `+18091234567`, alors que le vrai numéro de la pharmacie est `+1 809 724 3940` partout ailleurs (`src/lib/shipping.ts:40`, `AboutPartner.tsx:60`, `AboutVisit.tsx:136`, `legal/mentions-legales`). L'email `hola@farmau.do` est aussi en dur ici alors que la source de vérité contact est `shop_settings` (lu via `getShopSettings()` côté serveur, déjà disponible dans `confirmation/[id]/page.tsx:69`).
- **Impact** : un client qui ne peut pas utiliser WhatsApp appelle/écrit un numéro/email **faux** → impossible de finaliser la réservation par ce canal. Le `tel:` lié diffère du numéro affiché (incohérence visible). Va en prod tel quel.
- **Reco** : remplacer par les coordonnées issues de `shop_settings` (passées en props depuis `page.tsx`, comme `pickupLocation`) ou au moins par les vraies constantes, et faire correspondre le `tel:`/`mailto:` au texte affiché.
- **Confiance** : haute

### [WS05-04] `total_price` de confirmation ≠ total affiché (subtotal vs subtotal+envío) selon présence du draft — P2
- **Fichier** : `src/app/[locale]/(checkout)/reservation/confirmation/[id]/ConfirmationClient.tsx:84,154` + `src/components/confirmation/ConfirmationRecap.tsx:60-62,215`.
- **Catégorie** : bug | logique-métier
- **Constat** : `ConfirmationRecap` recalcule `total = subtotal + shippingCost` **uniquement** si `draft.shipping` existe (sessionStorage présent). `subtotal` vient de `draft.subtotal ?? totalPrice` (DB). Donc : même réservation, deux totaux possibles — avec draft (même device, juste après) → subtotal+envío ; sans draft (reload tardif, autre device) → subtotal nu (`shipping` absent → bloc envío masqué, `total = subtotal`). L'utilisateur voit un total différent selon le contexte pour la **même** réservation. Couplé à WS05-01, aucun des deux ne correspond au `total_price` stocké si une livraison payante a été choisie.
- **Impact** : montant de confirmation instable / non fiable. Confusion client, écart avec l'admin.
- **Reco** : faire de `reservations.total_price` (DB) la **seule** source du total affiché en confirmation (déjà passé en prop `totalPrice`), et n'afficher la ligne « envío » que si elle est réellement persistée. Découle de la correction WS05-01/02.
- **Confiance** : haute

### [WS05-05] `NEXT_PUBLIC_WHATSAPP_NUMBER` non documenté → lien WhatsApp silencieusement remplacé par `/contact` en prod — P2
- **Fichier** : `src/lib/whatsapp.ts:39,87-92` (`buildReservationWhatsappLink` : si `NEXT_PUBLIC_WHATSAPP_NUMBER` absent → retourne `/contact?ref=…`). Var absente de `.env.local.example` (vérifié : seule occurrence est dans `whatsapp.ts`).
- **Catégorie** : dette | bug
- **Constat** : tout le CTA central de la page confirmation (WhatsappHero, StickyMobileCta) dépend de `NEXT_PUBLIC_WHATSAPP_NUMBER`. Cette variable n'est **pas** listée dans `.env.local.example` ni dans la section « Variables d'environnement requises » du CLAUDE.md. Si elle n'est pas définie en prod (oubli probable vu l'absence de doc), le bouton « Coordinar por WhatsApp » pointe vers `/contact` au lieu de wa.me, sans aucune erreur visible — le cœur du flux de coordination est cassé silencieusement.
- **Impact** : risque élevé de déploiement où la réservation ne peut pas être coordonnée par WhatsApp (le canal principal annoncé). Échec silencieux difficile à diagnostiquer.
- **Reco** : ajouter `NEXT_PUBLIC_WHATSAPP_NUMBER` à `.env.local.example` + CLAUDE.md ; idéalement dériver le numéro de `shop_settings.contact_phone`/`whatsapp` (déjà en DB) côté serveur et le passer en prop, plutôt qu'une env publique séparée qui peut diverger du reste.
- **Confiance** : haute

### [WS05-06] Redirect « panier vide » peut renvoyer vers `/cart` juste après une réservation réussie (course `router.push` ↔ effect) — P2
- **Fichier** : `src/app/[locale]/(checkout)/reservation/ReservationClient.tsx:170-172` (effect `if (!cartLoading && totalItems === 0) router.replace('/cart')`) vs `:142-156` (succès : vide le cart côté DB puis `router.push('/reservation/confirmation/...')`).
- **Catégorie** : bug
- **Constat** : la RPC `create_reservation` fait `DELETE FROM cart_items` (vidage panier). Après succès, le client appelle `router.push(confirmation)`. Mais `useCart` (SWR) va revalider et `totalItems` passera à 0 ; tant que la navigation vers la confirmation n'a pas démonté `ReservationClient`, l'effect ligne 171 peut se déclencher (`!cartLoading && totalItems === 0`) et lancer `router.replace('/cart')`, entrant potentiellement en concurrence avec la navigation vers la confirmation. Le gate `!cartLoading` corrige bien la course **d'arrivée** (documentée), mais pas la course **de sortie** post-réservation.
- **Impact** : cas limite où, après une réservation réussie, un `replace('/cart')` parasite se superpose au `push(confirmation)`. Selon le timing, flash/ambiguïté de navigation. Non systématique (dépend de l'ordre push vs revalidation SWR).
- **Reco** : poser un flag `submittedRef`/état `reserved` après succès et l'inclure dans la garde : `if (!reserved && !cartLoading && totalItems === 0) router.replace('/cart')`.
- **Confiance** : moyenne

### [WS05-07] `ReservationPage` et `reserve` route s'appuient sur `getSession()` (cookie non revalidé) au lieu de `getUser()` — P2
- **Fichier** : `src/app/[locale]/(checkout)/reservation/page.tsx:40-42`, `src/app/[locale]/(checkout)/reservation/confirmation/[id]/page.tsx:31-33`, `src/app/api/cart/reserve/route.ts:27-30`.
- **Catégorie** : sécurité
- **Constat** : le gating utilise `supabase.auth.getSession()` (lit le cookie sans revalider le JWT auprès de Supabase), alors que le projet a explicitement migré middleware + `requireAdmin` vers `getUser()` pour valider le token serveur (CLAUDE.md, audit security #8/#11). Ici, l'IDOR sur la confirmation est **correctement** fermé par ailleurs (filtre `reservation.user_id !== session.user.id` + RLS `Users read own reservations` `auth.uid() = user_id` — vérifié en DB, client server-cookie scopé, pas de service-role) ; et la RPC re-vérifie `auth.uid()`. Donc pas de faille exploitable directe. Mais l'incohérence de méthode reste un smell sécurité sur des pages transactionnelles : `getSession` peut accepter un cookie au JWT expiré/altéré jusqu'à refresh.
- **Impact** : faible (défense en profondeur assurée par RLS + RPC). Risque résiduel : décision d'autorisation prise sur une session non revalidée.
- **Reco** : uniformiser avec le reste du code en `getUser()` pour les checks d'auth de ces 3 endroits (cohérence + robustesse), comme déjà fait pour l'admin.
- **Confiance** : moyenne

### [WS05-08] `maxLength` sur input contrôlé non re-validé : la longueur n'est pas garantie + code postal non numérique accepté — P2
- **Fichier** : `src/components/reservation/AddressStep.tsx:99-104` (CP `maxLength={5}` + `inputMode="numeric"`, mais validation ligne 35-45 ne teste que `.trim()` non vide) ; `ReviewStep.tsx:200-206` (note `maxLength={500}`).
- **Catégorie** : bug | data
- **Constat** : `maxLength` sur un `<input>/<textarea>` **contrôlé** ne borne pas une valeur injectée par programme/autofill/collage multi-ligne dans tous les cas, et surtout la **validation métier** d'`AddressStep` n'impose ni format ni longueur du code postal (juste « non vide »). Un CP `« abc »` ou `« 1 »` passe l'étape ; `zoneFromPostalCode` (`shipping.ts:47-54`) renvoie alors `interior` par défaut (donc tarif 600 DOP silencieux). Le `maxLength` côté input est purement cosmétique vis-à-vis de la zone calculée.
- **Impact** : zone de livraison (et donc le frais affiché, cf. WS05-01) déterminée à partir d'un CP non validé → tarif potentiellement erroné sans signal à l'utilisateur. Faible gravité tant que la livraison reste cosmétique, mais smell de validation.
- **Reco** : valider le CP (`/^\d{5}$/`) dans `AddressStep.handleSubmit` avec message dédié, ou — si click&collect — supprimer la dépendance CP→zone avec la livraison (WS05-01).
- **Confiance** : moyenne

### [WS05-09] `ReservationTimeline` code en dur une progression fictive (étape 2 « en cours » toujours) — P3
- **Fichier** : `src/components/confirmation/ReservationTimeline.tsx:8-13` (`STATES` constant : 1=done, 2=current, 3/4=pending) ; le `status` réel de la réservation (`pending`/`confirmed`/`collected`) est récupéré dans `page.tsx:42` mais **jamais** passé à la timeline.
- **Catégorie** : logique-métier | dette
- **Constat** : la timeline affiche toujours « réservation reçue (✓) → confirmation en cours (•) → … » indépendamment de l'état réel. Une réservation déjà `confirmed` ou `collected` montrera quand même « confirmation en cours ». L'info d'état est disponible côté serveur mais non câblée.
- **Impact** : information de suivi trompeuse pour le client revenant sur une réservation déjà avancée. Cosmétique/UX, pas bloquant.
- **Reco** : dériver `STATES` de `reservation.status` (passer `status` en prop de `ConfirmationClient` → `ReservationTimeline`).
- **Confiance** : haute

### [WS05-10] Exports morts dans `lib/shipping.ts` : `shippingCostFor` et `getPickupLocation` — P3
- **Fichier** : `src/lib/shipping.ts:56-58` (`shippingCostFor`), `:60-62` (`getPickupLocation`).
- **Catégorie** : dette (code mort)
- **Constat** : `grep -rn` sur tout `src/` (hors la définition) ne renvoie **aucun** usage de `shippingCostFor` ni de `getPickupLocation` ; les consommateurs lisent directement `SHIPPING_COSTS[...]` et `PICKUP_LOCATION`. (`zoneFromPostalCode` et `PICKUP_LOCATION`/`SHIPPING_COSTS`, eux, sont utilisés.)
- **Impact** : ~6 lignes mortes. Négligeable.
- **Reco** : supprimer les deux helpers wrappers, ou les conserver si une API publique stable est voulue (mais alors documenter).
- **Confiance** : haute

### [WS05-11] Labels ARIA en dur (anglais) dans des composants par ailleurs i18n — P3
- **Fichier** : `src/components/reservation/StepIndicator.tsx:30` (`aria-label="reservation steps"`), `src/components/confirmation/ReservationTimeline.tsx:52` (`aria-label={`Step ${step}`}`).
- **Catégorie** : a11y | i18n
- **Constat** : ces deux libellés lus par lecteurs d'écran sont codés en anglais dur, dans un produit tri-langue FR/EN/ES où tout le reste passe par `useTranslations`. Sur `/fr/` ou `/es/`, un lecteur d'écran annonce « reservation steps » / « Step 2 » en anglais.
- **Impact** : incohérence a11y/i18n pour les utilisateurs de technologies d'assistance non anglophones. Mineur.
- **Reco** : passer par des clés i18n (`Reservation.stepIndicator.listLabel`, `…stepN`).
- **Confiance** : haute

### [WS05-12] Clé i18n `Reservation.errors.shipping_required` jamais utilisée (i18n mort) — P3
- **Fichier** : `src/messages/{fr,es,en}.json:427` (`shipping_required`). Aucune référence dans le code (`ReservationClient.handleFinalSubmit` ne mappe que `auth_required`/`phone_required`/`already_active`/`cart_empty`/`generic`).
- **Catégorie** : dette | i18n
- **Constat** : la clé existe dans les 3 locales mais aucun chemin ne l'affiche (la zone est toujours pré-sélectionnée via `zoneFromPostalCode`, jamais « non choisie »). Vestige.
- **Impact** : ~3 lignes de traduction inertes × 3 fichiers. Négligeable (n'altère pas la parité 115×3, intacte).
- **Reco** : retirer la clé des 3 fichiers, ou l'utiliser si une validation « zone obligatoire » est ajoutée.
- **Confiance** : haute

### [WS05-13] `aria-current="step"` porté par la pastille `<span>` plutôt que le `<li>` de l'étape — P3
- **Fichier** : `src/components/reservation/StepIndicator.tsx:49-61` (`aria-current` sur le `<span>` badge, pas sur le `<li>`).
- **Catégorie** : a11y
- **Constat** : sémantiquement `aria-current="step"` devrait marquer l'élément de liste représentant l'étape courante. Posé sur le `<span>` interne (qui n'est pas l'item), l'annonce peut être moins fiable selon les AT.
- **Impact** : a11y mineure, dégradation marginale de l'annonce de l'étape active.
- **Reco** : déplacer `aria-current={isCurrent ? 'step' : undefined}` sur le `<li>`.
- **Confiance** : moyenne

## Points positifs (court)
- **IDOR confirmation correctement fermé** : double barrière — filtre applicatif `reservation.user_id !== session.user.id` (`confirmation/[id]/page.tsx:47`) **et** RLS `Users read own reservations` (`auth.uid() = user_id`) sur un client server-cookie scopé (pas de service-role). Un autre user ne peut ni lire la réservation ni ses items.
- **Pas de tampering de prix** : le client poste `/api/cart/reserve` avec un corps vide ; `total_items`/`total_price` sont **recalculés** serveur par la RPC depuis `cart_items × products.price`, jamais reçus du client. CSRF géré (`guardMutation`).
- **Mapping d'erreurs RPC→HTTP→UI complet et cohérent** (`reserve/route.ts:86-152` ↔ `ReservationClient:120-138`), codes machine-readable pour rediriger (`phone_required`, `auth_required`).
- **WhatsApp : encodage et injection maîtrisés** — `encodeURIComponent(buildReservationMessage(...))` (`whatsapp.ts:88`) ; le numéro est nettoyé en chiffres (`.replace(/\D/g,'')`), pas d'interpolation non encodée dans l'URL. Fallback gracieux vers `/contact` si numéro absent (mais voir WS05-05 pour le risque silencieux).
- **Race condition d'arrivée bien gérée** : gate `!cartLoading` avant le redirect `/cart` (`ReservationClient:170-172`), exactement le correctif documenté ; évite le redirect parasite à l'hydratation SWR.
- **Format référence `FAR-YYYYMMDD-XXXX`** factorisé proprement (`lib/reservation.ts`), UTC-stable, réutilisé confirmation + admin (variante compacte).

## Signalements hors périmètre (1 ligne chacun, max 5)
- `src/lib/whatsapp.ts` (hors périmètre) porte la logique d'addition `subtotal + shipping` dans le total WhatsApp — cause amont de WS05-01 ; à corriger en même temps.
- La RPC `create_reservation` ne prend aucun paramètre adresse/note/shipping (DB) — schéma à étendre si la persistance (WS05-02) est retenue ; relève de WS24 (DB/RLS).
- `reservation_items.product_id` est `ON DELETE` non vérifié ici, mais la confirmation join `products` peut renvoyer `null` si un produit a été supprimé (déjà géré par `?.` côté lecture) — à confirmer côté WS24.

## Zones non couvertes / à re-vérifier humainement
- Comportement réel cross-device du lien de confirmation partagé (perte du draft sessionStorage) — décrit en théorie (WS05-02), à reproduire en navigateur.
- Valeur effective de `NEXT_PUBLIC_WHATSAPP_NUMBER` en prod/Vercel (WS05-05) — non vérifiable depuis le repo ; confirmer qu'elle est bien définie.
- Décision produit définitive sur la livraison payante vs click&collect strict (WS05-01) : si la livraison est volontairement conservée pour le futur, le statut bascule de « régression » à « feature inachevée à persister » — à trancher humainement.
