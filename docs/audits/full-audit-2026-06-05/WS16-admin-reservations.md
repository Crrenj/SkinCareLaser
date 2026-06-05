# WS16 — Admin Réservations

**Périmètre** : `src/app/admin/reservations/page.tsx` · `src/components/admin/reservations/{BulkActionBar,FilterBar,NewReservationDrawer,ReservationDrawer,ReservationsTable,types}.tsx/.ts`. Lectures de contexte (hors périmètre) : `src/app/api/admin/reservations/route.ts`, `src/lib/schemas.ts`, `src/lib/apiError.ts`, `src/lib/requireAdmin.ts`, `src/app/api/search/route.ts`, migrations `reservations_*` / `pg_cron_expire`, `useModalA11y`, `ConfirmDialog`, messages `Admin.reservations`.
**Fichiers lus** : 6 (périmètre) + ~10 (contexte) · **Lignes parcourues (approx.)** : ~1 700
**Synthèse** : P0=0 · P1=2 · P2=6 · P3=4

## Findings

### [WS16-01] i18n : tout le module sauf `page.tsx` + `NewReservationDrawer` est en espagnol codé en dur — P1
- **Fichier** : `src/components/admin/reservations/types.ts:44-50,70-76,87-108` · `FilterBar.tsx:6-22,55,90,102-105` · `BulkActionBar.tsx:28-34,39,43-52,63` · `ReservationsTable.tsx:62,74-80,114,144-152,167,179,197-208` · `ReservationDrawer.tsx:110,126,128-133,139,167-171,177,181,191,210,229,242`
- **Catégorie** : i18n
- **Constat** : confirme l'ampleur annoncée par WS30-01. `page.tsx` et `NewReservationDrawer.tsx` passent bien par `useTranslations('Admin.reservations[.create]')` (clés présentes, parité FR/ES/EN 27×3 / create 24×3, y compris les 4 clés WhatsApp). **Mais** les 4 autres fichiers du module rendent du texte en clair, exclusivement en espagnol : libellés de statut (`STATUS_LABEL_ES` `types.ts:44`), dates relatives (`'Justo ahora'`, `Hace … min/h/días`, `'Ayer'` `types.ts:102-108`), labels boutons étape suivante (`'Marcar confirmada'/'entregada'` `types.ts:73-74` + dupliqués `BulkActionBar.tsx:30-32` et `ReservationsTable.tsx:197-200`), en-têtes de table (`Referencia/Cliente/Artículos/Total/Estado/Fecha/Acciones` `ReservationsTable.tsx:74-80`), aria-labels (`'Seleccionar todo'`, `'Deseleccionar fila'`, `'Abrir WhatsApp con cliente'`, `'Ver detalle'`), onglets de filtre + placeholder de recherche + options de tri (`FilterBar`), toute la `BulkActionBar`, et l'intégralité du `ReservationDrawer` (sections, lignes, boutons, placeholder de note `'Ej. Stock confirmado…'`). En FR/EN l'admin verra de l'espagnol au milieu d'une UI traduite.
- **Impact** : régression d'i18n majeure sur une surface admin entière, incohérente avec le reste de l'admin (« entièrement localisé FR/ES/EN » selon CLAUDE.md). Un admin francophone/anglophone lit l'espagnol pour la table, les statuts, les dates et tout le drawer de détail.
- **Reco** : extraire ces chaînes vers le namespace `Admin.reservations` existant (ajouter `status.*`, `table.*`, `bulk.*`, `drawer.*`, `relative.*`) et faire de `STATUS_LABEL_ES`/`nextStatusLabel`/`relativeAndAbsolute` des fonctions prenant `t`/`format` plutôt que des constantes ES. Note : `Intl.DateTimeFormat('es-DO', …)` (`types.ts:87`) est aussi figé sur `es-DO` quelle que soit la locale admin.
- **Confiance** : haute

### [WS16-02] Le POST création manuelle renvoie le message d'erreur Postgres brut au client — P1
- **Fichier** : `src/app/api/admin/reservations/route.ts:138-141,161` (déclenché depuis `page.tsx:194-198` → toast affiché à l'admin)
- **Catégorie** : sécurité
- **Constat** : le projet a un helper dédié `apiError()` (`src/lib/apiError.ts`) dont le but documenté est de **ne jamais** renvoyer `error.message` brut (« peut divulguer noms de tables/colonnes/contraintes Postgres »). Les chemins GET/PATCH de cette même route l'utilisent correctement (`apiError('Erreur serveur', error, 500)`). Le chemin POST, lui, fait `NextResponse.json({ error: insertError?.message ?? … })` (l.139) et `{ error: itemsError.message }` (l.161), et `createReservation` (`page.tsx:196`) affiche ce message tel quel via `toast.error(json.error)`.
- **Impact** : fuite d'internes DB (noms de contraintes/colonnes, ex. `total_items > 0`, `reservation_items_quantity_check`, FK) dans un toast côté navigateur. Surface réduite (réservée aux admins authentifiés, `requireAdmin`), mais c'est une régression nette d'une politique sécurité explicitement codifiée dans le repo.
- **Reco** : remplacer les deux retours par `apiError('Erreur lors de la création', insertError, 500)` / `apiError('Erreur lors de la création', itemsError, 500)` comme le reste de la route. Le détail reste loggé serveur via `apiError`.
- **Confiance** : haute

### [WS16-03] Bulk advance/cancel : N refetches complets séquentiels + pas de gestion d'échec partiel — P2
- **Fichier** : `src/app/admin/reservations/page.tsx:255-275` (`bulkAdvance`, `bulkCancel`) appelant `updateStatus` (l.151-170) en boucle `for … await`
- **Catégorie** : perf | logique-métier
- **Constat** : chaque `updateStatus` fait un PATCH **puis** `await fetchData()` (refetch complet de toutes les réservations + recompte des statuts). Un bulk sur K lignes déclenche donc K PATCH **et** K GET complets en série, chacun re-déclenchant `setLoading(true)` (clignotement du loader). De plus, si un PATCH échoue au milieu, la boucle s'arrête (l'exception est avalée par `updateStatus` qui pose `setError` et `return`), laissant la sélection partiellement traitée sans signal clair ; `setSelectedIds(new Set())` (l.262/274) s'exécute quand même après la boucle même en cas d'échec intermédiaire.
- **Impact** : latence et UI saccadée sur les lots ; incohérence visuelle possible (certaines lignes avancées, d'autres non, sélection vidée). Sur de petits volumes c'est tolérable, mais le pattern ne passe pas à l'échelle.
- **Reco** : faire les PATCH en parallèle (`Promise.allSettled`) puis **un seul** `fetchData()` à la fin ; remonter le nombre de succès/échecs (toast). Idéalement un endpoint bulk côté API.
- **Confiance** : haute

### [WS16-04] Pagination/recherche/tri 100 % client : la liste charge toutes les réservations d'un statut, le filtre `all` charge tout — P2
- **Fichier** : `src/app/admin/reservations/page.tsx:48-110` (fetch sans pagination, `PAGE_SIZE` appliqué en mémoire l.106-110) · API `route.ts:35-55` (SELECT sans `.range()`/`.limit()`)
- **Catégorie** : perf
- **Constat** : `fetchData` ne passe que `status` à l'API ; le GET renvoie **toutes** les lignes du statut (ou toutes en `all`), avec leurs `reservation_items` joints. La recherche (`visible` l.77-104), le tri et la pagination sont tous faits côté client sur le tableau complet. Le compteur « showing X–Y of N » (l.379) reflète seulement le total chargé, pas un total DB paginé.
- **Impact** : avec la montée du volume de réservations (la cible est le lancement), le payload et le rendu grossissent linéairement ; le mode `all` tire l'historique entier (collected/expired/cancelled compris) à chaque ouverture de l'onglet. Pas bloquant au stade actuel (faible volume), mais dette de perf certaine.
- **Reco** : paginer côté serveur (`.range()` + `count: 'exact'`), pousser `search`/`sort` dans la query API, retourner `total` pour la pagination. À planifier avant que l'historique ne grossisse.
- **Confiance** : haute

### [WS16-05] Prix unitaire d'une ligne manuelle entièrement piloté par l'admin, jamais recoupé au catalogue — P2
- **Fichier** : `NewReservationDrawer.tsx:355-362` (input prix libre, même pour une ligne issue de la recherche `product_id != null`) · `route.ts:144-154` (insert `unit_price: round2(it.unit_price)` tel quel) · `schemas.ts:151-161` (`unit_price: z.number().nonnegative()`)
- **Catégorie** : logique-métier | data
- **Constat** : quand l'admin ajoute un produit du catalogue, le prix est pré-rempli depuis `/api/search` (`addHit` l.118), mais reste **librement éditable** et l'API ne revalide jamais ce prix contre `products.price`, même quand `product_id` est fourni. Le total est recalculé serveur-side (bien, `route.ts:109-113`) mais à partir des prix fournis. C'est cohérent avec le snapshot pattern et le besoin walk-in (prix négociés), donc plutôt un choix qu'un bug — mais aucun garde-fou n'existe (un `0` ou un montant aberrant passe).
- **Impact** : risque d'intégrité de revenu faible mais réel (faute de frappe → réservation à 0 DOP ou à un montant erroné, qui alimente ensuite les widgets « ingreso confirmado » du dashboard). Pas une faille (admin de confiance), plutôt une absence de validation métier.
- **Reco** : au minimum, quand `product_id != null`, soit verrouiller le prix au catalogue, soit afficher un avertissement visuel quand le prix saisi diverge du prix catalogue. À défaut, documenter explicitement que les prix manuels sont libres.
- **Confiance** : moyenne

### [WS16-06] `useConfirmDialog` : titres/labels par défaut en français codés en dur — P2
- **Fichier** : `src/components/admin/ConfirmDialog.tsx:43-45` (`'Confirmer'`/`'Annuler'`)
- **Catégorie** : i18n
- **Constat** : hors périmètre strict mais **consommé** par `page.tsx` pour `cancelReservation`/`bulkCancel`. La page passe bien `title`/`confirmLabel` traduits (l.245-247, 266-268), mais **pas** `cancelLabel` → le bouton « Annuler » du dialog s'affiche toujours en français, même en UI espagnole/anglaise. Les fallbacks `'Confirmer'`/`'Confirmer'`/`'Annuler'` du hook sont en dur.
- **Impact** : incohérence linguistique mineure sur les modales de confirmation (annulation simple + annulation groupée).
- **Reco** : depuis `page.tsx`, passer aussi `cancelLabel: tc('cancel')` (le namespace `Admin.common.cancel` existe, utilisé par `NewReservationDrawer`). Idéalement i18n-iser les défauts du hook côté `ConfirmDialog`.
- **Confiance** : haute

### [WS16-07] Boutons quantité/stepper sans `type` explicite cohérent et inputs `number` acceptant des valeurs vides transitoires — P2
- **Fichier** : `NewReservationDrawer.tsx:375-383` (input quantité), `355-362` (input prix), `145-149` (`canSubmit`)
- **Catégorie** : bug | a11y
- **Constat** : (a) les `aria-label` des boutons +/− sont littéralement `'−'` et `'+'` (l.369, 387) — un lecteur d'écran annonce le caractère, pas l'action (« moins/plus une unité »). (b) `parseInt(e.target.value, 10) || 1` (l.380) et `parseFloat(e.target.value) || 0` (l.360) : si l'admin efface le champ, la valeur saute à `1`/`0` immédiatement plutôt que de rester vide, rendant la saisie d'un nombre à plusieurs chiffres pénible (taper « 12 » après avoir vidé peut coincer). (c) `canSubmit` autorise `unit_price >= 0` donc une ligne à 0 DOP est soumissible (lié à WS16-05).
- **Impact** : friction de saisie + annonce a11y pauvre sur le stepper du formulaire de création.
- **Reco** : aria-labels descriptifs (clés i18n « décrémenter/incrémenter quantité ») ; gérer l'état vide des inputs `number` (state string + parse au blur/submit) ; décider si prix 0 est valide.
- **Confiance** : moyenne

### [WS16-08] Lien WhatsApp : encodage correct mais ouverture multi-onglets en bulk sans garde — P3
- **Fichier** : `page.tsx:208-223` (`buildWhatsappLink`), `277-283` (`bulkWhatsapp`)
- **Catégorie** : bug (cas limite) | sécurité (vérifié OK)
- **Constat** : **point positif sécurité** — le téléphone est nettoyé `replace(/\D/g, '')` (l.209) avant insertion dans `wa.me/<phone>`, et le corps du message passe par `encodeURIComponent` (l.222) ; les noms produits/contact (sources DB ou saisie admin) ne peuvent donc pas injecter de paramètres d'URL. Pas de faille d'injection. **Mais** `bulkWhatsapp` ouvre un `window.open` par ligne sélectionnée (l.279-282) : un lot de 25 ouvre 25 onglets d'un coup (les bloqueurs de pop-up en tueront la plupart après le 1er, donnant un comportement imprévisible). De plus, si `contact_phone` ne contient aucun chiffre (théoriquement possible), l'URL devient `wa.me/?text=…` (invalide) — la garde `if (!r.contact_phone)` (l.280) teste la présence de la chaîne, pas la présence de chiffres.
- **Impact** : UX dégradée sur le rappel WhatsApp groupé ; cas limite d'URL WhatsApp invalide pour un téléphone non numérique.
- **Reco** : pour le bulk, ouvrir séquentiellement avec confirmation au-delà de N, ou n'ouvrir que le premier et lister les autres. Garder sur `phone.replace(/\D/g,'').length >= 5`.
- **Confiance** : haute

### [WS16-09] Export CSV : bouton présent mais purement décoratif (toast « bientôt ») — P3
- **Fichier** : `page.tsx:296-306` (`onClick` → `toast.info(t('exportCsvSoon'))`)
- **Catégorie** : dette
- **Constat** : le bouton « Exportar CSV » n'exporte rien ; il affiche un toast « prochainement ». Fonctionnalité annoncée mais non branchée (alors que `/admin/newsletter` a un vrai export CSV).
- **Impact** : faux affordance dans l'UI admin ; clé `exportCsvSoon` traduite mais feature absente.
- **Reco** : soit implémenter l'export (réutiliser le pattern newsletter), soit masquer le bouton jusqu'à implémentation.
- **Confiance** : haute

### [WS16-10] Marqueurs de dette laissés en commentaire (placeholders 💬 / statut « Contactada ») — P3
- **Fichier** : `ReservationsTable.tsx:134` (`{/* Placeholder 💬 : nécessite whatsapp_sent_at en DB. */}`) · `types.ts:3-8` (commentaire « Contactada » manquant dans l'enum)
- **Catégorie** : dette
- **Constat** : indicateurs de fonctionnalités prévues mais non implémentées laissés en commentaire. Le statut « Contactada » du design n'existe pas dans l'enum DB (`reservation_status` = 5 valeurs) et le suivi `whatsapp_sent_at` n'existe pas. Non bloquant, mais signale un écart design↔implémentation à trancher.
- **Impact** : dette/dérive de doc ; le workflow « contacté » n'est pas matérialisé (un admin ne sait pas si un client a déjà été relancé).
- **Reco** : décider d'ajouter (migration `whatsapp_sent_at` + statut/colonne) ou retirer les commentaires. Tracker explicitement.
- **Confiance** : haute

### [WS16-11] `NewReservationDrawer` : Enter dans un input de la card client peut soumettre le formulaire prématurément — P3
- **Fichier** : `NewReservationDrawer.tsx:212` (`<form onSubmit={handleSubmit}>`) englobant les inputs nom/téléphone/email + l'input de recherche produit (qui, lui, intercepte Enter l.271-276)
- **Catégorie** : bug (cas limite)
- **Constat** : l'input de recherche gère Enter (`preventDefault` + ajoute le 1er résultat). Mais les inputs nom/téléphone/email (l.220-255) n'interceptent pas Enter ; appuyer sur Entrée depuis l'un d'eux soumet le `<form>`. Si `canSubmit` est faux (pas encore d'items), `handleSubmit` `return` sans effet (l.156) — donc bénin tant qu'il n'y a pas d'items, mais si des items existent déjà, une frappe Entrée dans le champ téléphone crée la réservation sans clic explicite sur « Crear ».
- **Impact** : soumission accidentelle possible. Faible probabilité, conséquence modérée (réservation créée par erreur, mais annulable).
- **Reco** : neutraliser Enter hors du bouton submit dans les champs texte de la card client, ou ne déclencher la création que sur clic du bouton.
- **Confiance** : moyenne

## Points positifs (court)
- **Sécurité WhatsApp solide** : sanitisation du téléphone (`/\D/g`) + `encodeURIComponent` du corps → aucune injection d'URL possible malgré des données semi-contrôlées (`page.tsx:208-223`).
- **Snapshot pattern respecté** côté création manuelle : totaux **recalculés serveur** (`route.ts:109-113`), prix/nom figés dans `reservation_items` — cohérent avec le flux client.
- **A11y modales correcte** : `NewReservationDrawer` et `ConfirmDialog` passent par `useModalA11y` (focus trap, Escape, scroll lock, restauration du focus) ; `role="dialog"`/`aria-modal`/`aria-labelledby` présents.
- **Garde-fous de cohérence bulk** : `sharedStatus` masque l'avancement quand la sélection mixe des statuts (`page.tsx:117-121`, `BulkActionBar.tsx:28-34`).
- **Migration `reservations_allow_manual` bien raisonnée** : `user_id`/`contact_email` nullables, RLS « own reservations » ne matchant jamais NULL (manuelles invisibles côté client), NULLS DISTINCT sur l'index unique partiel — documenté.

## Signalements hors périmètre (1 ligne chacun, max 5)
- `ConfirmDialog.tsx:43-45` : libellés par défaut FR en dur — touche tous les consommateurs du hook, pas seulement les réservations (cf. WS16-06).
- `route.ts` POST : pas de transaction réelle (rollback best-effort par `delete` l.160) — fenêtre d'incohérence si le delete de rollback échoue lui aussi.
- `Intl.DateTimeFormat('es-DO', …)` (`types.ts:87`) figé `es-DO` quelle que soit la locale (sous-cas de WS16-01).
- `/api/search` (consommé par le drawer) renvoie le prix produit en clair sans vérifier `is_active` — produits inactifs peut-être listables dans la recherche du drawer (à confirmer côté WS catalogue/API).

## Zones non couvertes / à re-vérifier humainement
- Comportement réel des popups WhatsApp en bulk selon le navigateur/bloqueur (WS16-08) — non testable en statique.
- Volume DB réel de réservations pour calibrer l'urgence de la pagination serveur (WS16-04) : faible au stade actuel, mais à surveiller post-lancement.
- L'intention exacte derrière « prix manuel libre » (WS16-05) : choix produit (négociation walk-in) vs oubli de garde-fou — à trancher avec le métier.
