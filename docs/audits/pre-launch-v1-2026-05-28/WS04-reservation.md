# WS04 — Réservation Click & Collect (audit PRE-V1, lecture seule)

Date : 2026-05-28 · Périmètre : flux réservation (RPC, TTL/cron, transitions, stock, route, UI) + confirmation « 0 flux argent ».
Méthode : lecture migrations + code + git log. **Aucune écriture, aucun MCP Supabase.** Les points nécessitant `psql`/MCP sont marqués « à confirmer DB live » avec la requête exacte.

---

## Verdict

**Le système de réservation tient pour la V1.** L'architecture documentée (catalogue + click & collect, snapshot, TTL 24h, expiration cron, pas de paiement en ligne) est correctement implémentée et défensive sur l'essentiel : RPC `SECURITY DEFINER` qui dérive `auth.uid()` (jamais `p_user_id`), vérifie la propriété du cart, fige prix/nom, vide le panier, et est protégée par un index partiel unique anti-race. GRANT correctement restreint (REVOKE anon).

**Aucun blocant P0.** Les findings sont 1 × P1 (incohérence livraison/snapshot — perte de données métier, pas de corruption) et plusieurs P2/P3 (transitions de statut non contraintes côté DB/route, cron à confirmer en live, stock non géré = risque de survente assumé par le modèle).

**Confirmation « 0 flux argent » : ✅ ATTEINTE** (détail ci-dessous).

---

## Confirmation « 0 flux argent » (point critique demandé)

**Confirmé : aucun flux d'argent (paiement, débit, intégration PSP, capture) n'est atteignable.**

Preuves :
- `grep -rniE "stripe|paypal|azul|cardnet|paymentintent|psp|capture|charge|process_payment|create_checkout"` sur `src/`, `supabase/`, `scripts/` → **0 intégration**. Le seul hit `stripe/paypal/cardnet/azul` dans le code est **décoratif** : `src/components/Footer.tsx:130` rend `['Visa','Mastercard','PayPal','Azul']` comme de simples `<span>` mono (aucun `href`, aucun handler, aucun SDK).
- **Aucune route** `/checkout`, `/payment`, `/pago` (`find src/app -type d` → NONE). Aucune route API de paiement (`src/app/api/**/route.ts` : 35 routes, aucune liée à un PSP).
- **`orders` + `order_items` supprimées** (migration `20260527110000_drop_orders_order_items.sql`) — 0 référence restante dans `src/`. Le seul scaffold de « commande » historique est mort et droppé.
- La RPC `create_reservation` **ne touche jamais à de l'argent** : elle calcule un `total_price` informatif (`SUM(quantity*price)`) stocké comme snapshot, sans aucune action de débit (migration `20260519183407:84-110`).
- L'UI affiche le prix comme **information** : `CartSummary` montre un « Subtotal », pas un « Total à payer » ; le bouton est `reserveButton` + sous-label `reserveSubLabel` = « Nous vous contacterons par WhatsApp » (`fr.json:249`).
- Le **disclaimer obligatoire** est explicite : « **Ceci est une réservation, pas un paiement.** … coordonner le paiement (espèces, virement ou en pharmacie). » (`fr.json:362`, composant `ReservationDisclaimer.tsx`).
- CGV alignées : « FARMAU ne vend pas en ligne … Le paiement s'effectue **exclusivement en pharmacie** » (`legal/cgv/page.tsx:43,125`).
- Le lien WhatsApp (`src/lib/whatsapp.ts:75`) écrit une ligne texte « *Total a coordinar: X DOP* » — **« à coordonner »**, pas un montant débité ; c'est un message pré-rempli côté `wa.me`.

**Aucun vestige de checkout exposant un flux argent.** (Le mot « paiement » apparaît uniquement dans des libellés informatifs/légaux qui renvoient au paiement physique en pharmacie.)

---

## Findings

### WS04-01 · P1 · confirmé — Le tunnel collecte livraison + adresse + frais d'envoi mais la réservation n'en garde RIEN

**Preuve :**
- UI : `ReservationClient.tsx:194-219` enchaîne `AddressStep` → `ShippingStep` (zones `santo_domingo`=300 DOP / `interior`=600 DOP / `pickup`=0, `src/lib/shipping.ts:23-27`) → `ReviewStep`.
- RPC : `create_reservation` (migration `20260519183407:99-110`) insère uniquement `total_price = SUM(quantity*price)` (sous-total produits). **Aucune colonne** `shipping_zone`, `shipping_cost`, `street`, `city`, `postal_code`, `fulfillment_method` n'existe sur `reservations` (schéma `20260519182512:29-49`). L'adresse, la zone et le coût d'envoi saisis sont **perdus à la création**.
- Le `total_price` snapshot **exclut les frais de port** (sous-total seul), alors que le client a vu un « Total » incluant l'envoi côté UI (`ReviewStep.tsx:178-188`) et dans le message WhatsApp (`whatsapp.ts:54,75`).

**Impact :** Incohérence métier importante. (1) L'admin (`/admin/reservations`) ne voit ni l'adresse de livraison ni le mode de fulfillment ni les frais — il doit redemander tout par WhatsApp. (2) `reservations.total_price` ≠ « total à coordonner » affiché au client → confusion possible. (3) Le draft (adresse/zone/note) ne vit que dans `sessionStorage` (`ReservationClient.tsx:18,142`) : un refresh sur la page confirmation, un autre device ou une perte de session ⇒ l'admin n'a aucune trace du mode de livraison choisi. Modèle annoncé « click & collect » mais le tunnel propose en réalité une **livraison à domicile** non persistée.

**Reco :** Soit (a) persister `shipping_zone` / `shipping_cost` / `address_*` / `fulfillment` sur `reservations` + les passer à la RPC (le `total_price` devient sous-total + envoi, ou ajouter une colonne `shipping_cost` séparée), soit (b) si la V1 est réellement pickup-only, **retirer les étapes adresse/envoi** du tunnel et ne garder que le retrait pharmacie. Décision produit requise (cf. mémoire projet « catalogue + réservation, checkout placeholder »).

**Effort :** M (1 migration + RPC + 3 composants si on persiste ; S si on simplifie en pickup-only).

---

### WS04-02 · P2 · confirmé — Aucune machine à états : un statut peut régresser ou sauter via l'API admin

**Preuve :**
- Route `PATCH /api/admin/reservations` (`route.ts:93-124`) : Zod `reservationPatch` (`schemas.ts:120-124`) valide seulement que `status ∈ enum`. **Aucune contrainte de transition.** Un `UPDATE` direct `collected → pending`, `expired → confirmed`, `cancelled → pending` est accepté.
- L'UI guide une progression linéaire (`nextStatusFor` : `pending→confirmed→collected`, terminal sinon — `types.ts:64-68`) mais ce n'est qu'un garde-fou **client** ; l'API ne le rejoue pas.
- Note secondaire : repasser une résa `expired`/`cancelled` → `pending`/`confirmed` peut **violer** `uniq_active_reservation_per_user` (index partiel sur `status IN ('pending','confirmed')`, schéma `20260519182512:87-89`) → l'UPDATE lèvera une 23505 renvoyée brute au client (`route.ts:127`), pas de mapping propre.

**Impact :** Intégrité du cycle de vie non garantie côté serveur ; un admin (ou un bug front) peut produire des transitions incohérentes. Pas de perte de données, mais statuts potentiellement faux (ex. une commande « collectée » repassée « en attente »).

**Reco :** Valider les transitions autorisées côté route (table de transitions : `pending→{confirmed,cancelled,expired}`, `confirmed→{collected,cancelled}`, terminaux figés) **ou** une RPC `set_reservation_status` `SECURITY DEFINER` avec `CHECK`. Mapper 23505 en 409 explicite.

**Effort :** S.

---

### WS04-03 · P2 · suspecté (à confirmer DB live) — Job pg_cron : présence et exécution réelles non vérifiables en statique

**Preuve :**
- Migration `20260519184500:42-46` appelle `cron.schedule('expire-stale-reservations','*/5 * * * *', …)`. C'est correct **si** `pg_cron` est activable et `cron.schedule` exécutable au moment du `apply_migration`. Sur Supabase, `pg_cron` doit être activé et le scheduling tourne dans la base `postgres` — un `CREATE EXTENSION` / `cron.schedule` dans une migration appliquée sur la base applicative peut être no-op ou échouer silencieusement selon la config du projet.
- La fonction `expire_stale_reservations` est saine : `SECURITY DEFINER`, `search_path` fixé, `GRANT … TO service_role` (REVOKE anon/authenticated) — `20260519184500:17-35`.

**Impact :** Si le job ne tourne pas, les résa `pending` ne passent jamais `expired` ⇒ `uniq_active_reservation_per_user` reste bloqué ⇒ le user ne peut **plus jamais re-réserver** (409 `already_active` permanent) tant qu'un admin ne ferme pas manuellement. C'est le scénario de blocage le plus plausible en prod.

**Reco :** Confirmer en live (requêtes ci-dessous). Filet de sécurité recommandé : appeler `expire_stale_reservations()` (ou un check inline) au début de `create_reservation` avant le test « déjà active », pour ne pas dépendre uniquement du cron.

**Effort :** S (vérif) / S (filet inline).

---

### WS04-04 · P2 · confirmé (par design, à acter) — Stock jamais réservé/décrémenté → risque de survente

**Preuve :**
- `create_reservation` ne touche pas `products.stock` (migration `20260519183407`, aucun `UPDATE products`). Recherche globale : aucun `UPDATE … stock = stock - …` / `decrement` dans `supabase/migrations/`. C'est **explicitement documenté** comme un choix : « Stock non bloqué (admin arbitre les conflits manuellement) » (`20260519182512:6`).
- Corollaire : pas de re-crédit à l'annulation/expiration (rien à recréditer). Les 353 produits à `stock=50` placeholder ne sont pas affectés par les réservations.

**Impact :** Deux users peuvent réserver le dernier exemplaire ; l'admin tranche par WhatsApp. Acceptable pour un modèle click & collect manuel à faible volume, **à condition que ce soit assumé** et que l'admin sache que `stock` n'est pas autoritatif. Aucun risque de stock négatif (jamais décrémenté).

**Reco :** Acter le choix dans la doc client/admin. Si un jour on veut éviter la survente, introduire une réservation de stock (décrément à la création + re-crédit sur `expired`/`cancelled` via trigger) — hors scope V1.

**Effort :** N/A (décision) ; M si implémentation future.

---

### WS04-05 · P2 · confirmé — `/api/cart/reserve` et pages réservation utilisent `getSession()` (cookie) au lieu de `getUser()` (JWT validé)

**Preuve :** `reserve/route.ts:24` `auth.getSession()` ; `reservation/page.tsx:43` et `confirmation/[id]/page.tsx:35` idem. Le projet a déjà migré middleware + `requireAdmin` vers `getUser()` pour la validation JWT serveur (CLAUDE.md, audit security #8/#11). Ces 3 surfaces réservation sont restées sur `getSession()`.

**Impact :** Faible ici — la RPC `create_reservation` re-dérive `auth.uid()` côté DB (autorité réelle) et la confirmation re-check `reservation.user_id === session.user.id` + RLS. Mais incohérence avec la convention sécurité du projet ; `getSession()` fait confiance au cookie sans revalider le JWT.

**Reco :** Aligner sur `getUser()` pour cohérence (la sécurité effective ne repose pas dessus, mais c'est la convention).

**Effort :** S.

---

### WS04-06 · P3 · confirmé — Pré-check applicatif « déjà active » redondant et non atomique (mais l'index couvre)

**Preuve :** `create_reservation:41-48` fait un `IF EXISTS (… status IN ('pending','confirmed'))` **avant** l'INSERT. Entre ce check et l'INSERT, deux POST concurrents passent tous deux le `EXISTS`. L'atomicité est **assurée par l'index partiel unique** `uniq_active_reservation_per_user` (le 2e INSERT lève 23505).

**Impact :** Le 2e appel concurrent lève une 23505 non mappée → tombe dans le `default` du switch (`reserve/route.ts:137`) → 500 `rpc_error` au lieu d'un 409 `already_active` propre. Cosmétique (race rare : un user double-cliquant), mais message d'erreur trompeur.

**Reco :** Catcher 23505 (et le `P0001`) → renvoyer 409 `already_active`. Ou retirer le `EXISTS` et se reposer sur l'index + mapping 23505.

**Effort :** XS.

---

### WS04-07 · P3 · confirmé — Référence de réservation : 2 implémentations divergentes + collision possible

**Preuve :** `src/lib/reservation.ts:25` (`buildReservationReference`) et `src/components/admin/reservations/types.ts:78` (`buildReservationRef`) dupliquent la même logique `FAR-YYYYMMDD-XXXX`. La partie variable n'est que les **4 premiers hex de l'UUID** (`idPart(id,4)`) → 65 536 combinaisons par jour ; collision d'affichage possible sur volume élevé (anniversaire). Non unique en base (purement cosmétique).

**Impact :** Très faible (la PK reste l'UUID). Risque d'ambiguïté à l'oral/WhatsApp si 2 résa du même jour partagent les 4 hex.

**Reco :** Factoriser les 2 helpers en un seul (`src/lib/reservation.ts`) ; éventuellement passer à 6 hex.

**Effort :** XS.

---

### WS04-08 · P3 · suspecté — Confirmation dépend de `sessionStorage` pour adresse/note/email (lien WhatsApp dégradé après refresh)

**Preuve :** `ConfirmationClient.tsx:84` lit `draft?.subtotal ?? totalPrice` et l'adresse/note depuis `farmau:reservation:last` (sessionStorage, posé en `ReservationClient.tsx:142`). La page serveur (`confirmation/[id]/page.tsx`) ne fournit que `total_items/total_price/contact_*` depuis la DB. Après refresh sur un autre onglet/device, le draft est absent → le message WhatsApp perd adresse/note (et la zone d'envoi, non persistée — cf. WS04-01).

**Impact :** Lien WhatsApp moins complet sur refresh/cross-device. Pas de perte côté DB (les items/totaux viennent de la base), mais l'expérience de coordination se dégrade. Conséquence directe de WS04-01.

**Reco :** Une fois WS04-01 corrigé (persistance livraison/adresse), reconstruire le message WhatsApp depuis les données serveur, pas depuis `sessionStorage`.

**Effort :** S (couplé à WS04-01).

---

## Tableau récap

| ID | Sév | Sujet | Statut |
|---|---|---|---|
| WS04-01 | **P1** | Livraison/adresse/frais collectés par le tunnel mais non persistés dans `reservations` ; `total_price` = sous-total seul | confirmé |
| WS04-02 | P2 | Transitions de statut non contraintes côté DB/route (régression/saut possible) | confirmé |
| WS04-03 | P2 | Job pg_cron `expire-stale-reservations` : exécution réelle non vérifiable en statique | suspecté (DB live) |
| WS04-04 | P2 | Stock jamais réservé/décrémenté → survente possible (par design, à acter) | confirmé |
| WS04-05 | P2 | `getSession()` au lieu de `getUser()` sur reserve + pages réservation | confirmé |
| WS04-06 | P3 | Pré-check « déjà active » → race renvoie 500 au lieu de 409 | confirmé |
| WS04-07 | P3 | Référence FAR dupliquée (2 helpers) + 4 hex = collision d'affichage | confirmé |
| WS04-08 | P3 | Confirmation/WhatsApp dépendent de sessionStorage (dégradé au refresh) | suspecté |

**0 P0.** Le cœur (RPC, snapshot, ownership, unicité, GRANT, 0 flux argent) est sain.

### Ce qui tient (re-vérifié OK)
- `create_reservation` dérive `auth.uid()`, **ne prend pas** `p_user_id` → pas d'usurpation (migration `20260519183407:25,35-38`).
- Ownership cart vérifiée : `WHERE id = p_cart_id AND user_id = v_user_id` (`:75-81`).
- Snapshot : `product_name` + `unit_price` figés dans `reservation_items` (`:113-120`).
- Cart vidé après création (`:123`).
- GRANT : `REVOKE ALL … FROM PUBLIC, anon` + `GRANT … TO authenticated` (`:130-131`) — anon ne peut pas réserver.
- Unicité 1 résa active/user : index partiel unique atomique (`20260519182512:87-89`).
- `expire_stale_reservations` : `SECURITY DEFINER` + `search_path` + REVOKE anon/authenticated + GRANT service_role (`20260519184500:17-35`).
- Route reserve : auth requise (401), mapping ERRCODE→HTTP des P0001-P0005, 409 sur `already_active` (`reserve/route.ts:36-148`).
- Confirmation : auth + ownership (`confirmation/[id]/page.tsx:37,49`) + RLS SELECT « own ».
- RLS `reservations`/`reservation_items` : SELECT own only, pas d'INSERT/UPDATE/DELETE user (tout via RPC/service_role) — `20260519182512:99-117`.

---

## À confirmer DB live (MCP / psql — non exécuté, lecture seule)

1. **Le job cron existe et est actif** (WS04-03) :
   ```sql
   SELECT jobid, schedule, command, active
   FROM cron.job
   WHERE jobname = 'expire-stale-reservations';
   ```
   Et l'historique d'exécution (doit montrer des runs `succeeded` toutes les 5 min) :
   ```sql
   SELECT status, return_message, start_time, end_time
   FROM cron.job_run_details
   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'expire-stale-reservations')
   ORDER BY start_time DESC LIMIT 10;
   ```

2. **Pas de résa `pending` périmée non expirée** (preuve que le cron travaille — WS04-03) :
   ```sql
   SELECT count(*) FROM public.reservations
   WHERE status = 'pending' AND expires_at < now();
   ```
   (Attendu : 0. Si > 0 → le cron ne tourne pas.)

3. **GRANT réels sur les fonctions** (WS04-01/03 — confirmer que les REVOKE/GRANT des migrations ont bien pris) :
   ```sql
   SELECT p.proname, r.rolname, has_function_privilege(r.rolname, p.oid, 'EXECUTE') AS can_exec
   FROM pg_proc p
   CROSS JOIN (VALUES ('anon'),('authenticated'),('service_role')) AS r(rolname)
   WHERE p.proname IN ('create_reservation','expire_stale_reservations')
     AND p.pronamespace = 'public'::regnamespace;
   ```
   (Attendu : `create_reservation` exécutable par `authenticated` seulement ; `expire_stale_reservations` par `service_role` seulement — anon = false partout.)

4. **L'index partiel unique existe bien** (WS04-02/06) :
   ```sql
   SELECT indexname, indexdef FROM pg_indexes
   WHERE tablename = 'reservations' AND indexname = 'uniq_active_reservation_per_user';
   ```

5. **Colonnes de `reservations` = pas de champ livraison/adresse** (confirme WS04-01) :
   ```sql
   SELECT column_name, data_type FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'reservations' ORDER BY ordinal_position;
   ```
