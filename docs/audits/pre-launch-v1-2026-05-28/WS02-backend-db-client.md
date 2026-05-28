# WS02 — Backend & DB côté client (FARMAU · audit PRE-V1)

**Date** : 2026-05-28 · **Mode** : LECTURE SEULE (aucune modif code/DB/config, pas de MCP Supabase) · **Scope** : RPC `SECURITY DEFINER` exposées au client, 3 clients Supabase, dépendance RLS, routes service-role (`/api/cart`, `/api/cart/merge`, `/api/contact`, …), gestion d'erreurs DB & patterns de requêtes.
**Sources lues** : `supabase/migrations/*.sql` (28 fichiers, corps RPC intégraux), `db/schema.sql`, `src/app/api/**`, `src/lib/{requireAdmin,supabaseAdmin,csrf,rateLimit}.ts`, `src/middleware.ts`, `docs/audits/{rpc-route-authz-2026-05-28/WS03,database,security}.md`, `CLAUDE.md`.
**Mapping sévérité** : WS03 utilise P1/P2/P3. Je re-mappe sur P0/P1/P2 (P0 = bloquant V1). En clair : **les 2 « P1 » de WS03 restent P1 chez moi** (IDOR panier griefing, pas de PII/argent/perte de données critique → important mais non bloquant). Aucun finding ne mérite P0.

---

## Verdict

**La re-vérification confirme la thèse centrale de WS03 : les RPC panier `SECURITY DEFINER` font confiance à un identifiant fourni par le client et bypassent la RLS. F-RPC-1, F-RPC-2, F-RPC-3 TIENNENT.** Le surface routing est sain (gating `requireAdmin()` uniforme, identité dérivée serveur partout).

**MAIS deux corrections matérielles à WS03 :**

1. **F-RPC-4 est largement INFIRMÉ.** WS03 cite le corps **baseline** de `create_contact_message` (qui distinguait email connu/inconnu → énumération). Ce corps a été **remplacé** par la migration `20260520092235_open_create_contact_message.sql` (lue intégralement) : la version courante n'a **plus aucune branche d'énumération** — elle insère toujours et renvoie toujours `success:true`, `user_id` devient nullable. L'énumération de comptes décrite par F-RPC-4 **n'existe plus**. Reste un résiduel réel mais mineur : injection de messages non-rate-limités en appel RPC direct (re-classé **WS02-04, P2**).

2. **La cause racine « baseline GRANT » est INCOMPLÈTE et trompeuse pour les tables, correcte pour les fonctions.** Le `GRANT ALL ON ALL TABLES … TO authenticated` du baseline (`baseline.sql:612`) ne s'applique **qu'aux tables existant au moment du baseline**. Les tables créées après (reservations, reservation_items, newsletter_subscribers, wishlists, shop_settings, posts, rate_limit_buckets) **ne reçoivent AUCUN `GRANT` table-level dans les migrations du repo** — j'ai vérifié : `grep ALTER DEFAULT PRIVILEGES` = 0 hit, aucun `GRANT` explicite sur ces tables. Or `/api/wishlist` et `/api/account/preferences` fonctionnent en client **session (authenticated)** sur `wishlists`/`profiles`. Donc soit (a) le projet repose sur les **default privileges Supabase de provisioning** (`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role`, posés hors-repo par Supabase au bootstrap), soit (b) ces routes seraient cassées. Comme elles sont testées et marchent (cf. tests Playwright wishlist), (a) est quasi-certain. **Conséquence pour la sécurité** : c'est bien ce default privilege Supabase (et non le `GRANT … ON ALL FUNCTIONS` du baseline) qui donne `EXECUTE` aux RPC créées après le baseline (`remove_from_cart` 3-arg, `merge_anon_cart_to_user`). Cela **renforce** F-RPC-1 (la `remove_from_cart` 3-arg, créée hors baseline, est exécutable par anon via le default privilege, pas par hasard). À confirmer en DB live (requête fournie).

**Sur les RPC bien durcies** : `create_reservation`, `check_rate_limit`, `expire_stale_reservations` ont toutes `REVOKE … FROM PUBLIC, anon` + `GRANT TO service_role`/`authenticated` explicite dans leur migration — CONFIRMÉ. Le pattern de durcissement existe ; il n'a juste pas été appliqué aux RPC panier/messages.

**Correctif structurel (inchangé vs WS03, je le confirme)** : `REVOKE EXECUTE … FROM PUBLIC, anon` + `GRANT … TO service_role` sur `get_or_create_cart`, `add_to_cart`, `remove_from_cart(uuid,uuid,uuid)`, `create_contact_message`, `get_messages_stats`, `mark_message_as_read` ; `is_user_admin` → `REVOKE anon` + `GRANT authenticated`. 1 migration, effort S. Aligne sur `create_reservation`.

**Posture globale** : B / B-. Aucun bloqueur V1 « dur » (pas de fuite PII, pas d'argent, pas de perte de données). Les findings P1 sont du griefing/IDOR destructif à précondition (connaître un UUID victime non énuméré). À traiter avant V1 par principe (frontière d'autorisation), mais la boutique peut techniquement lancer.

---

## Re-vérification des 10 findings WS03

| WS03 | Sév WS03 → WS02 | Statut | Détail re-vérif |
|---|---|---|---|
| **F-RPC-1** `remove_from_cart` `COALESCE(p_user_id, auth.uid())` | P1 → **P1** | ✅ **CONFIRME-TIENT** | Corps confirmé `20260523111500:16`. `SECURITY DEFINER`, aucun `REVOKE`/`GRANT` dans la migration → repose sur le default privilege Supabase (anon a EXECUTE). Route OK (`route.ts:266-270` passe `userId` de `getUser()`). IDOR destructif sur panier d'autrui via appel RPC direct. **Nuance** : la cause racine n'est pas le `GRANT ON ALL FUNCTIONS` baseline (l'overload 3-arg est postérieur) mais le default privilege Supabase — même effet, à confirmer DB live. |
| **F-RPC-2** `get_or_create_cart` identité 100 % client | P1 → **P1** | ✅ **CONFIRME-TIENT** | Corps confirmé `baseline:331-352`. `SECURITY DEFINER`, GRANT baseline (table existait au baseline) → anon EXECUTE. Aucune ref à `auth.uid()`. Fuite/appropriation `cart_id` + insertion de carts junk. |
| **F-RPC-3** `add_to_cart` check propriété sauté si `p_anon_id` NULL | P2 → **P2** | ✅ **CONFIRME-TIENT** | Corps confirmé `20260519092026:17-22`. Check `IF p_anon_id IS NOT NULL AND NOT EXISTS(...)` → si `p_anon_id=null` + `p_cart_id` arbitraire, INSERT passe. Griefing write-only, précondition = connaître `cart_id` (fourni par F-RPC-2). |
| **F-RPC-4** `create_contact_message` énumération + messages usurpés | P2 → **P2** | ⚠️ **INFIRME (partiel) / NUANCE FORTE** | **L'énumération est INFIRMÉE** : la migration `20260520092235_open_create_contact_message.sql` (postérieure au baseline) a **supprimé** la branche `IF v_user_id IS NULL THEN RETURN error 'Email non trouvé'`. Le corps courant insère toujours et renvoie toujours `success:true`. **Pas de réponse différenciée → pas d'énumération.** Reste un résiduel mineur (injection de messages non-rate-limités en RPC directe, `user_email`/`user_id` non lié au caller) → repris en **WS02-04 P2**. WS03 a lu le mauvais corps (baseline au lieu de la migration de remplacement). |
| **F-RPC-5** `mark_message_as_read` RPC morte, anon, sans check | P2 → **P2** | ✅ **CONFIRME-TIENT** | Corps `baseline:450-458`, aucun check admin/propriété. `SECURITY DEFINER`, anon EXECUTE. `grep` confirme **0 call-site** dans `src/` (admin marque lu via `.update()` service-role dans `api/admin/messages/route.ts`). Sabotage du triage admin → `DROP` recommandé. |
| **F-RPC-6** `get_messages_stats` fuite compteurs | P3 → **P2** | ✅ **CONFIRME-TIENT** | `baseline:461-478` agrégat global. anon EXECUTE → fuite total/unread/today. Faible. (Je remonte légèrement à P2 car c'est une fuite d'info business par défaut, mais reste mineur.) |
| **F-RPC-7** `is_user_admin` sonde admin | P3 → **P2** | ✅ **CONFIRME-TIENT** | `baseline:277-282`. Gating CONFIRMÉ sain : tous les call-sites passent un `user.id` dérivé de `getUser()` (`middleware:106`, `requireAdmin` n'utilise même pas la RPC). anon peut sonder « UUID X est-il admin ? » → énumération sans escalade. `REVOKE anon` + `GRANT authenticated`. |
| **F-RPC-8** `merge_anon_cart_to_user` vol panier anon connu | P2 → **P2** | ✅ **CONFIRME-TIENT (suspecté)** | Corps `20260523095131:10-54`. `v_user_id := auth.uid()` (`:17`, correct) mais `p_anon_id` arbitraire (`:25-27`). `GRANT … TO authenticated` explicite (`:56`), pas de `REVOKE PUBLIC`. Vol d'un panier anon **dont on connaît l'UUID** (cookie httpOnly secret). Précondition forte → exploitation étroite. Inhérent au merge cross-session. |
| **F-ROUTE-1** RLS `contact_messages` INSERT trop large | P3 → **P2** | ✅ **CONFIRME-TIENT** | `baseline:588-590` : `WITH CHECK (user_email IN (SELECT email FROM auth.users))`. `contact_messages` est une **table baseline** → `authenticated` a bien `GRANT ALL` (`baseline:612`). Un user connecté peut INSERT un message avec **n'importe quel** email enregistré ≠ le sien. Usurpation. Resserrer à `user_email = (SELECT email FROM auth.users WHERE id = auth.uid())`. |
| **F-ROUTE-2** `/api/admin/upload` fileName/contentType client + upsert | P3 → **P2** | ✅ **CONFIRME-TIENT** | `upload/route.ts:21-26` confirmé : `uploadBody` (`schemas.ts:148-152`) valide `min(1)` mais **pas** le charset du `fileName` ni un allowlist `contentType` ; `.upload(fileName, …, {upsert:true})`. Bucket `product-image` public (`baseline:600`). Admin-gated → faible. **Atténuation non notée par WS03** : le bucket a `allowed_mime_types = [png,jpeg,jpg,webp]` au niveau bucket (`baseline:254`) → un `contentType:text/html` serait rejeté côté Storage. Le risque XSS-SVG est donc bloqué par le bucket ; reste l'écrasement de path arbitraire (upsert:true). |

**Bilan re-vérif** : 9/10 TIENNENT, 1 INFIRMÉ partiellement (F-RPC-4, énumération supprimée par migration que WS03 n'avait pas tracée).

---

## Nouveaux findings (WS02)

### WS02-01 · P1 · `remove_from_cart` overload 3-arg — exposition via default privilege (extension F-RPC-1) · confirmé
**Preuve.** `supabase/migrations/20260523111500_remove_from_cart_explicit_user_id.sql:5-26` crée l'overload 3-arg **sans aucun `REVOKE`/`GRANT`**. `supabase/migrations/20260523112000:4` droppe le 2-arg. Le 3-arg n'existait pas au baseline → le `GRANT EXECUTE ON ALL FUNCTIONS` du baseline (`:614`) ne le couvre **pas**. Son `EXECUTE` à anon provient donc des **default privileges Supabase** (hors-repo). `grep "ALTER DEFAULT PRIVILEGES"` sur tout `supabase/migrations/` + `db/schema.sql` = **0 hit**.
**Impact.** Précise F-RPC-1 : la fonction est exploitable parce que le projet hérite du default privilege Supabase, pas par un GRANT explicite. Le fix `REVOKE FROM PUBLIC, anon` reste valide et nécessaire.
**Reco.** Idem F-RPC-1 + auditer les **default privileges du schéma public** (requête fournie). **Effort : S.** 

### WS02-02 · P2 · Tables post-baseline sans `GRANT` explicite — dépendance silencieuse au provisioning Supabase · suspecté
**Preuve.** `reservations`, `reservation_items` (`20260519182512`), `newsletter_subscribers` (`20260520085055`), `wishlists` (`20260520131704:51`), `shop_settings` (`20260522203505`), `posts` (`20260527210629`), `rate_limit_buckets` (`20260519143501`) : aucune ligne `GRANT` dans leurs migrations. Le baseline `GRANT ALL ON ALL TABLES TO authenticated` ne s'applique qu'aux tables existant au baseline. `/api/wishlist` (`wishlist/route.ts:22`) et `/api/account/preferences` (`preferences/route.ts:39`) écrivent sur ces tables via le client **session (authenticated)**, pas service-role → ils dépendent d'un GRANT au rôle `authenticated`.
**Impact.** (1) Fragilité : si Supabase change ses default privileges ou si le schéma est rejoué sur un projet sans ces defaults (ex : self-host, `supabase db reset` propre), `/api/wishlist` et `/api/account/preferences` cassent silencieusement (RLS OK mais 0 privilège table). (2) Surface mal documentée : la sécurité réelle de ces tables dépend d'un objet (default privileges) absent du repo et donc non audité. (3) Le `db/schema.sql` (censé être rejouable « sur un projet vierge », en-tête ligne 4) ne reproduirait PAS l'état prod pour ces tables.
**Reco.** Rendre les grants explicites dans les migrations (`GRANT … TO authenticated`/`anon` selon le besoin réel, principe du moindre privilège — ex : `wishlists` n'a besoin que de `authenticated`, pas `anon`). **Effort : M.**

### WS02-03 · P2 · `merge_anon_cart_to_user` : pas de `REVOKE FROM PUBLIC` (extension F-RPC-8) · suspecté
**Preuve.** `20260523095131:56` fait `GRANT … TO authenticated` mais **aucun `REVOKE EXECUTE … FROM PUBLIC`**. Comme le `GRANT TO authenticated` est additif, `PUBLIC` (qui inclut `anon`) peut conserver l'`EXECUTE` par default privilege. Pour `anon`, le corps `RAISE EXCEPTION 'auth_required'` si `auth.uid() IS NULL` (`:21-22`) neutralise l'abus → impact réel nul pour anon. Mais l'absence de `REVOKE` est une dette par rapport au pattern `create_reservation`.
**Impact.** Aucun supplémentaire vs F-RPC-8 (le corps protège). Hygiène / cohérence du durcissement.
**Reco.** `REVOKE EXECUTE … FROM PUBLIC, anon` pour aligner sur `create_reservation`. **Effort : S.**

### WS02-04 · P2 · `create_contact_message` : injection de messages non-rate-limités en appel RPC direct (résiduel de F-RPC-4) · confirmé
**Preuve.** Corps courant `20260520092235:10-37` : insère pour **tout** `p_email` (lié à un compte si match, sinon `user_id` NULL), renvoie toujours `success:true`. `SECURITY DEFINER`, anon EXECUTE (baseline `:614`). La route `contact/route.ts` ajoute `checkOrigin` (`:12`) + rate-limit 5/min (`:17`) + regex email (`:53`), **mais un appel direct `POST /rest/v1/rpc/create_contact_message` les contourne**.
**Impact.** (1) **Injection de messages usurpés** : `p_email` arbitraire (ex : email d'un client connu) → message attribué à un tiers dans l'inbox admin. (2) **Spam non-rate-limité** sur `contact_messages` (write-amplification). **PAS d'énumération** (corrigé). `checkOrigin` renvoie `null` si pas de header `Origin` (`csrf.ts:22`) → ne bloque pas les scripts non-navigateur.
**Reco.** `REVOKE EXECUTE … FROM PUBLIC, anon` + `GRANT … TO service_role` (la route appelle déjà en service-role, `contact/route.ts:65`). **Effort : S.**

### WS02-05 · P2 · Fuite de `error.message` PG brut au client sur `/api/contact` GET et `/api/wishlist`/`/api/search` (partiel) · confirmé
**Preuve.** `contact/route.ts:149` : `return NextResponse.json({ error: error.message }, { status: 500 })` — renvoie le **message Postgres brut** au client. Les autres routes loggent + renvoient un code générique (`fetch_failed`, `search_failed`) — bon pattern. Le GET `/api/contact` est l'exception : `error.message` PostgREST peut révéler des noms de colonnes/contraintes/structure.
**Impact.** Fuite mineure de structure DB (noms de tables/colonnes/contraintes) via messages d'erreur. Pas de données. Faible mais non conforme au pattern du reste du code.
**Reco.** Remplacer par un code d'erreur générique (`{ error: 'fetch_failed' }`) + `logger.error` (déjà présent `:148`). **Effort : S.**

### WS02-06 · P2 · `/api/cart` POST : check de stock TOCTOU + race condition sur la quantité cumulée · confirmé
**Preuve.** `cart/route.ts:182-200` lit `product.stock` puis compare `< quantity` (`:195`), **mais** `add_to_cart` (`20260519092026:24-29`) fait `quantity = cart_items.quantity + EXCLUDED.quantity` (cumul). Le check `:195` valide `quantity` (le delta) contre `stock`, **pas** la quantité cumulée résultante. Deux requêtes concurrentes, ou plusieurs ajouts successifs, peuvent dépasser le stock dans `cart_items` sans déclencher d'erreur.
**Impact.** Modèle = réservation click&collect, stock **non bloquant** (admin arbitre, cf. `20260519182512:6`). Donc impact réel **faible** : un cart peut contenir plus que le stock, l'admin tranche manuellement. Pas de survente financière (pas de paiement). À noter pour V1 mais pas bloquant vu le modèle métier.
**Reco.** Si on veut un garde-fou : vérifier `cart_items.quantity + delta <= stock` dans la RPC `add_to_cart` (atomique), ou accepter le comportement et le documenter. **Effort : S.**

### WS02-07 · P2 · `GRANT ALL ON ALL TABLES TO authenticated` (baseline) — sur-privilège sur tables baseline · confirmé
**Preuve.** `baseline.sql:612` : `GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated`. Le rôle `authenticated` détient INSERT/UPDATE/DELETE/SELECT sur **toutes** les tables baseline (products, brands, contact_messages, carts, …), pas seulement les siennes. La RLS rattrape l'**accès ligne**, mais c'est elle seule qui protège — il n'y a pas de défense en profondeur au niveau GRANT. F-ROUTE-1 (INSERT contact_messages usurpé) en est une conséquence directe.
**Impact.** Toute faille RLS future (policy mal écrite, table sans policy adéquate) devient immédiatement exploitable car le GRANT est maximal. Sur-privilège. Acceptable si la RLS est parfaite, fragile sinon.
**Reco.** Resserrer au moindre privilège : `authenticated` n'a besoin que de SELECT sur le catalogue (déjà couvert par `anon`), et d'écriture seulement sur `profiles`/`wishlists`/`cart_items`/`carts` (via RLS). Remplacer `GRANT ALL ON ALL TABLES` par des GRANTs ciblés. **Effort : M.** (chantier, pas bloquant V1).

### WS02-08 · P2 · `cart_items` INSERT par `authenticated` sans validation de `quantity` max ni contrôle applicatif · suspecté
**Preuve.** `authenticated` a `GRANT ALL` sur `cart_items` (baseline) + policy `Manage own cart items` (RLS, `20260527100000:23-31`) autorise tout item dont le cart appartient au user. Un user connecté peut donc INSERT directement dans `cart_items` (en bypassant `/api/cart` et son check de stock) avec `quantity` arbitraire (seul `CHECK (quantity > 0)` au schéma, `baseline:162`). `MAX_CART_QUANTITY` (cf. `lib/constants.ts`) est appliqué **côté client/route uniquement**, pas en DB.
**Impact.** Un user peut gonfler sa propre quantité (write sur son propre cart → impact limité à lui-même + réservation ensuite plafonnée par l'arbitrage admin). Faible (self-only). Cohérent avec le modèle non-bloquant.
**Reco.** Si garde-fou voulu : `CHECK (quantity <= 99)` au niveau colonne. **Effort : S.** Sinon accepter (self-impact only).

### WS02-09 · P3 · `/api/contact` GET : client anon-key construit à la main, pas de validation du Bearer côté serveur · confirmé
**Preuve.** `contact/route.ts:131-139` : crée un client `@supabase/supabase-js` avec l'anon key + header `Authorization: Bearer <token>` repris **tel quel** du header client. La validation du JWT est déléguée à PostgREST via RLS (`Users view own messages`, `baseline:584`). Pattern fonctionnel et sûr (RLS filtre par `auth.uid()`), mais inhabituel vs le reste du code qui passe par `createSupabaseServerClient`/cookies. Pas de `getUser()` explicite → pas de log d'échec d'auth distinct du 500.
**Impact.** Aucun (RLS protège). Incohérence de pattern + lisibilité.
**Reco.** Migrer vers `createSupabaseServerClient()` (cookies) comme `/api/wishlist`. **Effort : S.** Cosmétique.

### WS02-10 · P3 · `reorder_banners` / `cleanup_banner_positions` : SECURITY INVOKER mais anon EXECUTE · confirmé
**Preuve.** `baseline:391-422` : les deux fonctions sont déclarées **sans** `SECURITY DEFINER` → INVOKER (s'exécutent avec les privilèges de l'appelant). anon a EXECUTE (baseline `:614`) mais les UPDATE sur `banners` sont soumis à la RLS `Admin manage banners` (`20260527100000:9`) → un anon obtient 0 ligne modifiée. `cleanup_banner_positions` n'a **aucun call-site** dans `src/` (grep). `reorder_banners` appelée en service-role gardé (`api/admin/banners/route.ts:132`).
**Impact.** Aucun (RLS rattrape, INVOKER respecte la RLS). Hygiène : exposer des fonctions inutiles/admin à anon est du bruit d'attaque.
**Reco.** `REVOKE EXECUTE … FROM PUBLIC, anon` sur les deux ; `DROP cleanup_banner_positions` si confirmé sans usage (vérifier qu'aucun trigger ne l'appelle — la migration ne crée pas de trigger dessus). **Effort : S.**

### Observations (non-findings)
- **N+1 / requêtes** : `/api/cart` GET fait **1 requête** avec joins imbriqués (`route.ts:69-87`), pas de boucle. `/api/search` 1 requête. Pas de N+1 détecté côté routes. ✅
- **`.limit()` manquants** : `/api/wishlist` GET (`:22`) et `/api/contact` GET (`:142`) n'ont pas de `.limit()` — volume par user faible (favoris/messages perso), impact négligeable. `/api/search` plafonne à 20 (`:49`). Acceptable à cette échelle.
- **`.select('*')`** : `/api/contact` GET `:144` `select('*')` sur `contact_messages` (inclut `admin_notes`, `replied_by` — internes). RLS limite aux lignes du user mais expose des colonnes admin (`admin_notes`) à l'auteur du message. Mineur → fusionné dans la reco WS02-05/09 (resserrer le SELECT). 
- **3 clients Supabase** : usage correct. `supabaseAdmin` (`supabaseAdmin.ts`) n'est jamais importé en client (grep src/app/admin/page.tsx = Server Component gardé par middleware). Toutes les routes service-role dérivent l'identité de `getUser()`/cookie httpOnly, **jamais du body** — CONFIRMÉ pour `/api/cart` (`resolveCartContext` `:13-34`), `/api/cart/merge` (`:7-8`), `/api/contact`, `/api/newsletter`. ✅
- **cart_id cookie** : `httpOnly: true` CONFIRMÉ (`cart/route.ts:30`) — la note security.md #3 « httpOnly:false » est **stale**, c'est fermé. ✅

---

## Tableau récapitulatif (tous les findings WS02)

| ID | Sév | RPC/Route/Objet | Problème | Preuve | Effort | Conf. |
|---|---|---|---|---|---|---|
| (F-RPC-1) WS02-01 | P1 | `remove_from_cart(3-arg)` | `COALESCE(p_user_id, auth.uid())` + anon EXECUTE via default priv → vider panier d'autrui | `20260523111500:16` | S | confirmé |
| F-RPC-2 | P1 | `get_or_create_cart` | identité 100 % client, anon EXECUTE → fuite/appropriation `cart_id` | `baseline:331-352` | S | confirmé |
| F-RPC-3 | P2 | `add_to_cart` | check propriété sauté si `p_anon_id` NULL → write panier arbitraire | `20260519092026:17-22` | S | confirmé |
| WS02-04 (≈F-RPC-4) | P2 | `create_contact_message` | injection messages usurpés non-rate-limités (énumération INFIRMÉE) | `20260520092235:10-37` | S | confirmé |
| F-RPC-5 | P2 | `mark_message_as_read` | RPC morte, anon, sans check admin → DROP | `baseline:450-458` | S | confirmé |
| F-RPC-6 | P2 | `get_messages_stats` | anon → fuite compteurs messages | `baseline:461-478` | S | confirmé |
| F-RPC-7 | P2 | `is_user_admin` | anon → sonde « UUID admin ? » (gating sain) | `baseline:277-282` | S | confirmé |
| F-RPC-8 | P2 | `merge_anon_cart_to_user` | vol panier anon **connu** (UUID secret) | `20260523095131:25-27` | M | suspecté |
| WS02-03 | P2 | `merge_anon_cart_to_user` | pas de `REVOKE FROM PUBLIC` (hygiène) | `20260523095131:56` | S | suspecté |
| F-ROUTE-1 | P2 | RLS INSERT `contact_messages` | `authenticated` peut INSERT avec email d'autrui | `baseline:588-590` | S | confirmé |
| F-ROUTE-2 | P2 | `/api/admin/upload` | `fileName`/`contentType` client + `upsert:true` (admin-only, MIME bloqué par bucket) | `upload/route.ts:21-26` | S | confirmé |
| WS02-02 | P2 | tables post-baseline | aucun GRANT explicite → dépend du default priv Supabase hors-repo | `20260520131704:51` + 0 hit `ALTER DEFAULT PRIVILEGES` | M | suspecté |
| WS02-05 | P2 | `/api/contact` GET | renvoie `error.message` PG brut au client | `contact/route.ts:149` | S | confirmé |
| WS02-06 | P2 | `/api/cart` POST | check stock TOCTOU vs quantité cumulée (modèle non-bloquant) | `cart/route.ts:195` + `20260519092026:28` | S | confirmé |
| WS02-07 | P2 | GRANT baseline | `GRANT ALL ON ALL TABLES TO authenticated` (sur-privilège) | `baseline:612` | M | confirmé |
| WS02-08 | P2 | `cart_items` | INSERT direct sans cap `quantity` en DB (self-only) | `baseline:162` | S | suspecté |
| WS02-09 | P3 | `/api/contact` GET | client anon-key manuel + Bearer non re-validé (RLS protège) | `contact/route.ts:131-139` | S | confirmé |
| WS02-10 | P3 | `reorder_banners`/`cleanup_banner_positions` | INVOKER mais anon EXECUTE (RLS rattrape) ; cleanup sans call-site | `baseline:391-422` | S | confirmé |

**Total** : 2 P1, 14 P2, 2 P3. Aucun P0.

---

## À confirmer en DB live (requêtes SQL exactes — read-only, MCP non utilisé ici)

1. **Default privileges du schéma `public`** (cause racine réelle des EXECUTE/GRANT post-baseline) :
   ```sql
   SELECT defaclrole::regrole AS grantor, defaclobjtype, defaclacl
   FROM pg_default_acl d JOIN pg_namespace n ON n.oid = d.defaclnamespace
   WHERE n.nspname = 'public';
   ```
   Confirme si `ALTER DEFAULT PRIVILEGES … GRANT … TO anon/authenticated/service_role` est posé (hors-repo, par Supabase) — explique WS02-01/WS02-02.

2. **GRANT EXECUTE réel sur les RPC panier/messages** (provabilité F-RPC-1→7, WS02-01) :
   ```sql
   SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args,
          p.prosecdef AS security_definer, p.proacl
   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public'
     AND p.proname IN ('remove_from_cart','get_or_create_cart','add_to_cart',
       'create_contact_message','mark_message_as_read','get_messages_stats',
       'is_user_admin','merge_anon_cart_to_user','reorder_banners',
       'cleanup_banner_positions','create_reservation','check_rate_limit',
       'expire_stale_reservations')
   ORDER BY p.proname;
   ```
   Vérifie : (a) `proacl` contient `anon=X` ou est NULL (= default PUBLIC EXECUTE) ; (b) `create_reservation`/`check_rate_limit`/`expire_stale_reservations` n'ont PAS `anon` (REVOKE confirmé code) ; (c) `prosecdef` = true sauf `reorder_banners`/`cleanup_banner_positions`/`update_updated_at_column`.

3. **GRANT table-level réel sur les tables post-baseline** (WS02-02) :
   ```sql
   SELECT table_name, grantee, privilege_type
   FROM information_schema.role_table_grants
   WHERE table_schema = 'public'
     AND table_name IN ('reservations','reservation_items','newsletter_subscribers',
       'wishlists','shop_settings','posts','rate_limit_buckets')
     AND grantee IN ('anon','authenticated','service_role','PUBLIC')
   ORDER BY table_name, grantee;
   ```
   Si `authenticated` a des privilèges sur `wishlists`/`shop_settings` alors qu'aucune migration ne les accorde → confirme la dépendance au default privilege Supabase (WS02-02).

4. **`overload` actif de `remove_from_cart`** (confirmer que le 2-arg est bien droppé, seul le 3-arg subsiste — `20260523112000`) :
   ```sql
   SELECT pg_get_function_identity_arguments(oid) FROM pg_proc
   WHERE proname = 'remove_from_cart' AND pronamespace = 'public'::regnamespace;
   ```

5. **RLS activée + policies sur toutes les tables** (vérifier qu'aucune table n'a RLS OFF ou policy manquante) :
   ```sql
   SELECT c.relname, c.relrowsecurity AS rls_enabled,
          (SELECT count(*) FROM pg_policies p WHERE p.tablename = c.relname) AS n_policies
   FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public' AND c.relkind = 'r'
   ORDER BY c.relname;
   ```
   Attendu : `newsletter_subscribers` & `rate_limit_buckets` = RLS ON, 0 policy (= service-role only, OK). Toutes les autres ON avec ≥1 policy.

6. **Buckets storage publics + policies d'écriture** (CLAUDE.md mentionne un flag advisor) :
   ```sql
   SELECT id, public, file_size_limit, allowed_mime_types FROM storage.buckets
   WHERE id IN ('product-image','brand-fiche');
   SELECT policyname, cmd, roles, qual, with_check FROM pg_policies
   WHERE schemaname = 'storage' AND tablename = 'objects';
   ```
   Confirme `public=true` + que les policies INSERT/UPDATE/DELETE exigent bien `is_user_admin` (atténue F-ROUTE-2).

7. **Supabase advisors** (security + performance) via MCP `get_advisors` lors de la passe DB-live — non exécuté ici (consigne no-MCP).
