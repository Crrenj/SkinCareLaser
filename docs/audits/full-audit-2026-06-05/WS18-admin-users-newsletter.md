# WS18 — Admin Users + Admins + Newsletter

**Périmètre** : `src/app/admin/users/page.tsx`, `src/app/admin/admins/page.tsx`, `src/app/admin/newsletter/page.tsx`, `src/components/admin/users/UsersClient.tsx`, `src/components/admin/admins/AdminsClient.tsx`, `src/components/admin/newsletter/NewsletterClient.tsx` (+ lecture des routes API et i18n associées pour recouper).
**Fichiers lus** : 6 (périmètre) + 5 (recoupage : `api/admin/users/route.ts`, `api/admin/users/[id]/route.ts`, `api/admin/admins/route.ts`, `api/admin/newsletter/route.ts`, `api/admin/newsletter/[id]/route.ts`, `lib/requireAdmin.ts`, messages FR/ES/EN)
**Lignes parcourues (approx.)** : ~1 050 (périmètre) + ~480 (recoupage)
**Synthèse** : P0=0 · P1=0 · P2=4 · P3=6

## Findings

### [WS18-01] Recherche utilisateurs limitée à la page courante (50 lignes) — P2
- **Fichier** : `src/components/admin/users/UsersClient.tsx:41-61` ; cause serveur `src/app/api/admin/users/route.ts:32-89`
- **Catégorie** : bug / logique-métier
- **Constat** : la recherche (`search`) est appliquée **après** `auth.admin.listUsers({ page, perPage })`, donc elle ne filtre que les ≤ 50 utilisateurs de la page courante, pas l'ensemble de la base. Le client envoie `page`/`search` et fait confiance au résultat. Un admin qui tape un email/nom présent sur la page 2 obtient « Aucun utilisateur pour cette recherche » alors que la personne existe. Combiné à la pagination (cf. WS18-02), la recherche devient peu fiable dès que la base dépasse une page.
- **Impact** : faux négatifs de recherche ; un client réel introuvable côté admin. Inoffensif tant que la base < 50 (état actuel : 1 admin, base de comptes très petite), mais latent et trompeur à mesure que les inscriptions croissent.
- **Reco** : soit faire la recherche côté serveur sur l'ensemble (parcourir les pages `listUsers` jusqu'au cap, ou indexer email/nom dans `profiles` et requêter `profiles` puis enrichir avec l'email), soit afficher dans l'UI que la recherche ne porte que sur la page affichée. Idéalement : recherche server-side full-base.
- **Confiance** : haute

### [WS18-02] Pagination « Suivant » désactivée à tort quand un filtre est actif — P2
- **Fichier** : `src/components/admin/users/UsersClient.tsx:259-266`
- **Catégorie** : bug
- **Constat** : le bouton **Suivant** est `disabled` si `rows.length < PER_PAGE`. Or `rows` est la liste **filtrée** renvoyée par le serveur (`filtered`, route ligne 93-99). Quand une recherche réduit la page à < 50 résultats, Suivant se grise même s'il reste des pages d'utilisateurs à parcourir. De plus, sans `total` renvoyé, il n'existe aucun moyen fiable de savoir s'il y a une page suivante (la page peut contenir pile 50 résultats filtrés et être la dernière).
- **Impact** : navigation paginée cassée dès qu'un filtre est saisi ; couplé à WS18-01, l'admin ne peut pas atteindre des utilisateurs au-delà de la première page lorsqu'il cherche.
- **Reco** : se baser sur le **count brut de la page non filtrée** (`usersData.users.length === perPage`) pour décider de l'état de Suivant, pas sur `filtered.length` ; faire remonter ce count par la route (ex. `totalForPage` actuel = filtré, ajouter `pageCount` = brut). Mieux : renvoyer le `total` global de `listUsers` et paginer dessus.
- **Confiance** : haute

### [WS18-03] Recherche « ajouter un admin » bornée aux 50 premiers comptes — P2
- **Fichier** : `src/components/admin/admins/AdminsClient.tsx:116-134` (appelle `/api/admin/users?search=…&perPage=50`)
- **Catégorie** : bug / logique-métier
- **Constat** : même cause racine que WS18-01. Pour promouvoir un inscrit en admin, le super-admin tape un email ; la requête ne cherche que dans **la première page de 50 utilisateurs** (`page` non précisé → 1, `perPage=50`, filtre appliqué sur cette page seulement côté route). Un utilisateur à promouvoir hors des 50 premiers comptes (par ordre de `listUsers`, non trié par pertinence) est **introuvable** → impossible de le promouvoir via l'UI.
- **Impact** : le seul chemin documenté pour créer un admin (« promouvoir un inscrit ») peut échouer silencieusement (« Aucun utilisateur trouvé ») pour tout compte au-delà de la 1ʳᵉ page. Bloquant fonctionnel à terme pour la gestion d'équipe ; bénin aujourd'hui (très peu de comptes).
- **Reco** : recherche server-side sur l'ensemble des comptes (cf. WS18-01). Tant que ce n'est pas fait, augmenter `perPage` au cap (200) atténue sans résoudre.
- **Confiance** : haute

### [WS18-04] Le téléphone (donnée non saisie par l'utilisateur) sert de cible WhatsApp sans normalisation pays — P2
- **Fichier** : `src/components/admin/users/UsersClient.tsx:187-197`
- **Catégorie** : bug / data
- **Constat** : le lien contact construit `https://wa.me/${r.phone.replace(/[^\d]/g, '')}`. `wa.me` exige un numéro **international complet (indicatif pays inclus)**. Les numéros saisis au signup peuvent être locaux (RD = `809/829/849 …` à 10 chiffres sans `+1`). Sans préfixe `1`, le lien `wa.me/809…` ouvre un numéro invalide. Aucune normalisation/validation E.164 n'est faite ici (ni, d'après le recoupage, garantie en amont).
- **Impact** : liens WhatsApp morts ou pointant vers un mauvais numéro pour les clients ayant entré un format local — l'admin croit contacter le client mais l'ouverture WhatsApp échoue.
- **Reco** : normaliser en E.164 (préfixer l'indicatif RD `1` si numéro à 10 chiffres sans indicatif) côté affichage, idéalement avec une garantie de format à la saisie (`signup`/`ProfileEditForm`). Au minimum, factoriser un helper `toWhatsappNumber(phone)` réutilisé partout (mêmes liens `wa.me` ailleurs dans l'admin).
- **Confiance** : moyenne (dépend du format réellement stocké ; à confirmer sur données live)

### [WS18-05] Re-fetch complet à chaque frappe de recherche (pas de debounce) — P3
- **Fichier** : `src/components/admin/users/UsersClient.tsx:59-61, 126-133` et `src/components/admin/newsletter/NewsletterClient.tsx:51-53, 99-105`
- **Catégorie** : perf
- **Constat** : `useEffect([load, page, search])` (Users) et `useEffect([load, search, lang])` (Newsletter) déclenchent un `fetch` à **chaque caractère** tapé dans le champ recherche (le `setSearch` est direct, sans debounce). Sur Users, chaque frappe ré-appelle `auth.admin.listUsers` + 2 requêtes Postgres ; sur Newsletter, un SELECT jusqu'à 500 lignes.
- **Impact** : rafales de requêtes service-role inutiles, charge serveur et clignotement de l'état `loading` à chaque touche. Impact modéré (admin, faible trafic) mais évitable.
- **Reco** : debounce ~300 ms sur `search` avant de déclencher le `load`. (AdminsClient gère déjà ça correctement via un formulaire submit explicite — à aligner.)
- **Confiance** : haute

### [WS18-06] Branches d'erreur inatteignables / code défensif mort dans le mapping d'erreurs Users — P3
- **Fichier** : `src/components/admin/users/UsersClient.tsx:79-84`
- **Catégorie** : dette
- **Constat** : `handleToggleAdmin` mappe `json?.error === 'cannot_demote_self'` (ligne 79) — mais la route `PATCH /api/admin/users/[id]` ne renvoie **jamais** ce code (uniquement `cannot_modify_self`, `cannot_modify_super_admin`, `super_admin_required`, validation Zod). De plus, le bouton promote/demote n'est rendu que si `isSuper` (ligne 213), donc `super_admin_required` (ligne 83) ne peut pas non plus se produire en flux normal. Ces branches sont du garde-fou défensif inerte (pas faux, mais mort).
- **Impact** : aucun à l'exécution ; bruit de maintenance et fausse impression de cas gérés. Le `cannot_modify_self`/`cannot_demote_self` côté Users est par ailleurs déjà couvert par le masquage du bouton (un super ne se voit jamais proposer son propre toggle car `r.role === 'super_admin'`).
- **Reco** : retirer la branche `cannot_demote_self` (code serveur inexistant) ; garder éventuellement `super_admin_required` comme filet mais le documenter comme défensif. Cohérent : `AdminsClient.mapError` (lignes 78-92) ne mappe que les codes réellement émis — aligner Users dessus.
- **Confiance** : haute

### [WS18-07] Mise à jour optimiste du compteur de stats incohérente après promote/demote — P3
- **Fichier** : `src/components/admin/users/UsersClient.tsx:90-110`
- **Catégorie** : bug (cosmétique)
- **Constat** : après un toggle réussi, seul `rows` est patché optimistiquement (ligne 90-96) ; les `stats` (lignes 104-110, `useMemo` sur `rows`) se recalculent donc et `statAdmins` se met bien à jour — OK pour Users. En revanche, **aucun re-`load()`** n'est déclenché, donc `lastSignInAt`/données fraîches ne sont pas resynchronisées (acceptable). À noter : l'optimisme pose `role: 'admin'` à la promotion (ligne 93) alors que le body n'envoie que `isAdmin:true` et que le serveur applique `nextRole='admin'` par défaut — ici cohérent, mais fragile si un jour la promotion permettait un rôle initial différent.
- **Impact** : faible ; risque de dérive si la sémantique de promotion évolue.
- **Reco** : pour la robustesse, re-`load()` après mutation (comme `AdminsClient` qui appelle `load()`), au prix d'un fetch. Au minimum, dériver le `role` optimiste du body envoyé.
- **Confiance** : moyenne

### [WS18-08] Champs de recherche sans `<label>` associé + tables sans `scope`/`caption` — P3
- **Fichier** : `UsersClient.tsx:124-133, 151-160` · `AdminsClient.tsx:314-321, 210-218` · `NewsletterClient.tsx:99-105, 142-151`
- **Catégorie** : a11y
- **Constat** : les `<input type="search">` n'ont qu'un `placeholder` (pas de `<label>` ni `aria-label`) → lecteur d'écran annonce un champ sans nom accessible. Les `<table>` n'ont ni `<caption>` ni `scope="col"` sur les `<th>`. Le `<select>` langue (Newsletter:107-116) est sans label associé. Les états `loading` (spinner) n'ont pas de `role="status"`/`aria-live`, donc le changement « chargement → données » n'est pas annoncé.
- **Impact** : navigation au lecteur d'écran dégradée sur ces écrans admin. Surface interne (impact limité au staff), d'où P3.
- **Reco** : ajouter `aria-label` aux inputs/`select`, `scope="col"` aux `<th>`, `role="status" aria-live="polite"` au conteneur de chargement.
- **Confiance** : haute

### [WS18-09] Effet de survol de ligne inopérant (`hover:bg-sand-50` sur fond déjà `bg-sand-50`) — P3
- **Fichier** : `UsersClient.tsx:166` · `AdminsClient.tsx:228` · `NewsletterClient.tsx:156`
- **Catégorie** : dette (cosmétique)
- **Constat** : les `<tr>` portent `hover:bg-sand-50` alors que le conteneur tableau est déjà `bg-sand-50` (lignes 137 / 198 / 128). Le survol ne change donc rien visuellement (aucun feedback de ligne survolée). Probable intention : `hover:bg-sand-100`.
- **Impact** : feedback de survol absent ; purement cosmétique.
- **Reco** : passer le hover à `sand-100` (ou un ton distinct du fond).
- **Confiance** : haute

### [WS18-10] `force-dynamic` + `Intl.DateTimeFormat('es-DO')` codé en dur (dates non localisées) — P3
- **Fichier** : `UsersClient.tsx:281-291` · `AdminsClient.tsx:410-420` · `NewsletterClient.tsx:213-223`
- **Catégorie** : i18n / dette
- **Constat** : `formatDate` est dupliqué à l'identique dans les 3 composants et force toujours `es-DO`, indépendamment de la locale admin active (FR/EN). Les libellés UI sont bien traduits (parité i18n FR/ES/EN complète, vérifiée), mais les **dates** restent en format espagnol même en interface FR ou EN.
- **Impact** : incohérence mineure de localisation des dates (ex. « 5 jun. 2026 » en interface anglaise). Acceptable pour un panneau interne, mais c'est de la duplication (3 copies du helper).
- **Reco** : factoriser un seul `formatAdminDate(iso, locale)` partagé, prenant la locale courante (`useLocale()`), ou assumer explicitement `es-DO` comme choix produit. Aligné avec la remarque transverse sur la duplication des `StatCard`/`RoleBadge`.
- **Confiance** : haute

## Points positifs (court)
- **Gating super-admin correctement reflété dans l'UI ET garanti serveur** : `AdminsClient` masque/affiche les contrôles selon `isSuper` (lignes 56, 188-193, 300) et `canManage = isSuper && !isSuperRow` (ligne 223), miroir fidèle de `requireSuperAdmin` + des garde-fous `cannot_modify_self`/`cannot_modify_super_admin` dans `PATCH /api/admin/users/[id]`. Le masquage UI n'est jamais la seule défense — l'auto-modif et la modif d'un autre super-admin sont **bloquées côté serveur** (route lignes 58-66).
- **Le client ne fuite pas l'IP des abonnés** : `NewsletterClient` déclare `ip` dans son type (ligne 14) mais ne l'affiche **jamais** dans le tableau et ne construit aucun export côté client ; la divulgation d'IP via CSV (WS21-01) vient exclusivement de la route serveur `format=csv` — hors périmètre WS18.
- **Garde-fous d'erreur explicites et localisés** : codes serveur (`cannot_modify_self`, `cannot_modify_super_admin`, `super_admin_required`) mappés vers des toasts traduits, avec parité FR/ES/EN complète sur `Admin.users` / `Admin.admins` / `Admin.newsletter` (vérifiée clé à clé) — y compris `Admin.common.search`/`loading` consommés par AdminsClient.
- **Confirmations destructives** : promote-super, revoke et delete passent tous par `window.confirm` avant mutation (UsersClient:65 ; AdminsClient:151, 163 ; NewsletterClient:56).
- **Liens externes corrects** : `wa.me` en `target="_blank" rel="noopener noreferrer"` (UsersClient:189-191).

## Signalements hors périmètre (1 ligne chacun, max 5)
- `GET /api/admin/newsletter?format=csv` inclut la colonne `ip` (PII) dans l'export et `escapeCsv` ne neutralise pas l'injection de formule (`=`/`+`/`-`/`@` en tête de cellule) — recoupe WS21-01, à traiter côté route.
- `GET /api/admin/users` et `/api/admin/admins` exposent l'email + téléphone + `last_sign_in_at` de tous les comptes à **tout** admin (pas seulement super) — acceptable par design mais à confirmer comme intentionnel.
- `escapeCsv` (newsletter route) n'échappe pas non plus le `\r` (CRLF) — robustesse CSV, hors périmètre.
- La recherche server-side `ilike` newsletter sur `email` est OK, mais celle de `users`/`admins` (filtrage post-page) est la même cause racine que WS18-01/03 — le correctif doit vivre dans `api/admin/users/route.ts`.

## Zones non couvertes / à re-vérifier humainement
- **Format réel des numéros de téléphone stockés** (WS18-04) : impossible de trancher sans données live — vérifier si les `profiles.phone` sont en E.164 ou en local RD pour confirmer la gravité des liens `wa.me`.
- **Taille réelle de la base de comptes** : les bugs de recherche/pagination (WS18-01/02/03) sont latents et bénins tant que la base tient sur une page (50). À re-prioriser en P1 si une croissance des inscriptions est attendue avant le correctif.
