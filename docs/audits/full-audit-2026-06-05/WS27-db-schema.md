# WS27 — Intégrité du schéma DB

**Périmètre** : `supabase/migrations/*.sql` (35 fichiers) · `db/schema.sql` (snapshot dérivé) · `src/lib/database.types.ts` (généré, comparé via MCP) · recoupement DB live (projet `adxpoxcynrpnbbxnncsk`) via MCP read-only (`list_tables`, `list_migrations`, `get_advisors`, `generate_typescript_types`, `execute_sql` SELECT)
**Fichiers lus** : 36 (35 migrations + schema.sql) + types comparés · **Lignes parcourues (approx.)** : ~2 200 SQL + ~1 140 types + recoupement live
**Synthèse** : P0=0 · P1=0 · P2=3 · P3=6

> Verdict express : le schéma est **sain et bien tenu**. Toutes les migrations récentes sont idempotentes/replay-safe, l'ordre des dépendances est correct, et l'état live correspond aux migrations. Aucun objet référencé avant création, aucun enum réutilisé dans la même transaction, aucune migration qui casse au rejeu. Les constats sont de la **dette mesurable** (index redondants, FK non couvertes) et de la **dérive de snapshot/types** (sans impact runtime). Recoupé en base live : code↔schéma alignés pour les features récentes (tickets, réservation manuelle, home_layout, admin roles).

---

## Findings

### [WS27-01] 4 clés étrangères sans index couvrant — P2
- **Fichier** : `supabase/migrations/20260519182512_reservations_schema.sql:56-65` (`reservation_items.product_id`) ; `supabase/migrations/00000000000000_baseline.sql:230,237` (`contact_messages.user_id`, `contact_messages.replied_by`) ; `supabase/migrations/20260522203505_shop_settings_table.sql:34` (`shop_settings.updated_by`)
- **Catégorie** : perf | data
- **Constat** : 4 FK n'ont aucun index couvrant (confirmé en live via `pg_constraint` ET advisor `unindexed_foreign_keys`). `reservation_items` ne crée un index que sur `reservation_id` (`idx_reservation_items_reservation_id`), pas sur `product_id`. `contact_messages` indexe `user_email/status/created_at` mais pas les 2 FK `user_id`/`replied_by`. `shop_settings.updated_by` n'est pas indexée.
- **Impact** : seq-scan sur la table référencée lors d'un `DELETE`/`UPDATE` du parent (ex. supprimer un produit → scan complet de `reservation_items` pour vérifier la FK ; supprimer/anonymiser un user → scan de `contact_messages`). À l'échelle actuelle (3 reservation_items, 0 message) l'impact est nul, mais c'est un piège latent et `reservation_items.product_id` est aussi joint en lecture (`reservation_items(product_id)`).
- **Reco** : `CREATE INDEX IF NOT EXISTS idx_reservation_items_product_id ON reservation_items(product_id);` (le plus utile). Les 3 autres (`contact_messages.user_id`, `contact_messages.replied_by`, `shop_settings.updated_by`) sont des FK sur tables admin/à faible cardinalité — index optionnels mais recommandés pour faire taire l'advisor. `shop_settings` (1 ligne) n'en a pas réellement besoin.
- **Confiance** : haute

### [WS27-02] Index dupliqués (même table, mêmes colonnes, noms différents) — P2
- **Fichier** : `supabase/migrations/20260519140420_add_missing_fk_indexes.sql:14-15` vs `supabase/migrations/20260520131704_sprint2_consolidated.sql:87,89`
- **Catégorie** : perf | dette
- **Constat** : deux migrations créent le **même** index FK sous deux noms. Live confirme :
  - `product_tags(tag_id)` : `idx_product_tags_tag_id` (migration 0519140420) **et** `idx_product_tags_tag` (migration 0520131704) — identiques.
  - `product_images(product_id)` : `idx_product_images_product_id` (0519140420) **et** `idx_product_images_product` (0520131704) — identiques.
  Comme les noms diffèrent, les deux `CREATE INDEX IF NOT EXISTS` réussissent → doublon. Advisor `duplicate_index` les signale tous deux.
- **Impact** : double coût d'écriture (INSERT/UPDATE sur `product_tags`/`product_images` maintient 2 index identiques) + stockage doublé pour rien. 844 `product_tags`, 299 `product_images`.
- **Reco** : dropper l'un de chaque paire (`DROP INDEX IF EXISTS idx_product_tags_tag, idx_product_images_product;` ou l'inverse) dans une nouvelle migration. À l'avenir, centraliser les noms d'index pour éviter qu'une migration ultérieure recrée un FK déjà indexé.
- **Confiance** : haute

### [WS27-03] Index redondants avec le préfixe d'une PK/unique composite — P3
- **Fichier** : `supabase/migrations/20260520131704_sprint2_consolidated.sql:87,90` (`idx_product_tags_product`, `idx_cart_items_cart`)
- **Catégorie** : perf | dette
- **Constat** : `idx_product_tags_product(product_id)` fait doublon avec le préfixe de `product_tags_pkey(product_id, tag_id)` ; `idx_cart_items_cart(cart_id)` fait doublon avec le préfixe de `unique_cart_product(cart_id, product_id)`. Postgres utilise déjà le prefix-scan de la PK/unique pour ces colonnes — ironie : le commentaire de `20260519140420` (lignes 6-9) explique justement ce principe pour *justifier* de ne PAS créer 4 index, mais `sprint2_consolidated` les a quand même ajoutés. Advisor `unused_index` les flagge.
- **Impact** : surcoût d'écriture/stockage marginal (mêmes tables que WS27-02). Pas de bug.
- **Reco** : dropper `idx_product_tags_product` et `idx_cart_items_cart` (couverts par PK/unique). Optionnel.
- **Confiance** : haute

### [WS27-04] `database.types.ts` commité contient une fonction droppée (`mark_message_as_read`) — P3
- **Fichier** : `src/lib/database.types.ts:980`
- **Catégorie** : data | dette
- **Constat** : le fichier de types commité déclare encore `mark_message_as_read: { Args: { p_message_id: string }; Returns: boolean }`. Or cette RPC a été **droppée** par `20260528160000_harden_rpc_execute_grants.sql:45` (et la régénération MCP `generate_typescript_types` ne la contient plus). Aucun call-site live (`grep` sur `src/` hors types = 0). À part cette entrée, les types commités sont **à jour** (admin_users.role, create_ticket, home_layout, reservations.user_id/contact_email nullables, posts, banner enums — tout présent).
- **Impact** : nul au runtime (le build passe — c'est une entrée *en trop*, pas manquante). Risque : un dev pourrait autocompléter `.rpc('mark_message_as_read')`, ça type-checke mais renvoie un 404 PostgREST à l'exécution.
- **Reco** : regénérer `src/lib/database.types.ts` via MCP `generate_typescript_types` (1 ligne de diff : suppression de `mark_message_as_read`). Le brief note d'ailleurs ce point comme attendu.
- **Confiance** : haute

### [WS27-05] `db/schema.sql` (snapshot) : 2 objets live absents — P3
- **Fichier** : `db/schema.sql` (RPC `merge_anon_cart_to_user` absente ; colonne `shop_settings.home_layout` absente)
- **Catégorie** : dette (dérive de doc)
- **Constat** : le snapshot a été reconstruit le 2026-05-28 et son en-tête prévient explicitement qu'il peut diverger (source de vérité = migrations). Deux écarts confirmés (grep + recoupement live) :
  1. **`merge_anon_cart_to_user`** (RPC `SECURITY DEFINER` critique pour le merge panier au login, migration `20260523095131`) est **totalement absente** de schema.sql — c'est une omission antérieure au rebuild, pas un retard.
  2. **`shop_settings.home_layout`** (colonne JSONB, migration `20260529095909`) est absente — postérieure au rebuild.
  À noter (contre la doc) : `orders`/`order_items`/`product_ranges` ne sont **PAS** des définitions stale dans schema.sql — ils n'apparaissent qu'en **commentaires** documentant leur suppression. La mention « orders/product_ranges droppés encore listés » dans le "Reste à faire" de CLAUDE.md est elle-même périmée. De même newsletter/wishlists/shop_settings/posts/admin_users.role/category/ticket-statuts sont bien présents dans schema.sql.
- **Impact** : un humain qui relit schema.sql croit (à tort) qu'il n'y a pas de RPC de merge panier, et ignore `home_layout`. Aucun impact runtime (le code lit les migrations, pas ce snapshot ; `home_layout` est consommé via `shop_settings` réel).
- **Reco** : full regen via `supabase db dump --schema public` (déjà recommandé dans CLAUDE.md), ou ajout manuel des 2 objets. Mettre aussi à jour le "Reste à faire" qui décrit une dérive inexistante.
- **Confiance** : haute

### [WS27-06] `search_path` incohérent : 3 RPC sans `pg_temp` — P3
- **Fichier** : `supabase/migrations/20260519183407_rpc_create_reservation.sql:127` · `20260519184500_pg_cron_expire_reservations.sql:30` · `20260519143501_rate_limit_buckets_and_check_fn.sql:56`
- **Catégorie** : sécurité (durcissement) | dette
- **Constat** : `create_reservation`, `expire_stale_reservations` et `check_rate_limit` posent `SET search_path = public` (confirmé live : `proconfig = {search_path=public}`), alors que **toutes** les autres RPC `SECURITY DEFINER` utilisent la forme recommandée `public, pg_temp` (cf. `20260522092810`). Omettre `pg_temp` laisse théoriquement un attaquant pouvant créer des objets temporaires shadow-er un objet non-qualifié — ici les 3 fonctions qualifient déjà tout en `public.`, donc le risque réel est nul.
- **Impact** : aucun en pratique (objets pleinement qualifiés + RPC réservées à `authenticated`/`service_role`). Pure incohérence de style de durcissement.
- **Reco** : `ALTER FUNCTION … SET search_path = public, pg_temp;` sur les 3, pour uniformiser. Faible priorité.
- **Confiance** : haute

### [WS27-07] RPC bannières (`reorder_banners`, `cleanup_banner_positions`) restées exécutables par `anon`/`authenticated` — P3
- **Fichier** : `supabase/migrations/00000000000000_baseline.sql:391-422` (jamais resserrées par `20260528160000`)
- **Catégorie** : sécurité (surface) | dette
- **Constat** : live, l'ACL de `reorder_banners` et `cleanup_banner_positions` reste `anon=X | authenticated=X` (héritée du `GRANT EXECUTE ON ALL FUNCTIONS … TO anon, authenticated` du baseline:614). Ces deux fonctions sont `SECURITY INVOKER` (pas DEFINER) → la RLS `Admin manage banners` bloque réellement tout UPDATE par un non-admin, donc l'appel est inoffensif. Mais elles restent invocables via `/rest/v1/rpc/*` par n'importe qui. La migration de durcissement `20260528160000` n'a couvert que les RPC panier/messages, pas celles-ci.
- **Impact** : surface d'API inutile, pas d'exploit (RLS-gated, fonctions invoker). Cosmétique sécurité.
- **Reco** : `REVOKE EXECUTE … FROM PUBLIC, anon, authenticated; GRANT … TO service_role;` sur les 2 (elles ne sont appelées que côté admin/service-role). Recouper avec WS24 (grants RPC).
- **Confiance** : haute

---

## Recoupements faits en base live (rassurants, pas des findings)

- **Idempotence/replay** : toutes les migrations récentes utilisent `IF NOT EXISTS` / `CREATE OR REPLACE` / `DROP … IF EXISTS` / `DO $$ … duplicate_object` pour les enums. Vérifié au cas par cas :
  - `20260604130000_tickets_system` : les `UPDATE status=…` de migration de données sont **no-op au rejeu** (statuts déjà migrés) ; DROP CHECK `IF EXISTS` ; `create_ticket` en `CREATE OR REPLACE` ; drop de l'ancienne `create_contact_message(text,text,text)` `IF EXISTS`. Safe.
  - `20260605120000_cart_rls_withcheck_and_revokes` : **déjà appliquée au remote** (ledger version `20260605082451`) ; les `ALTER POLICY` sont gardés par `IF EXISTS` (pg_policy) ; WITH CHECK posé et **vérifié live** sur `cart_items`/`carts` (miroir exact du USING). Assertions finales qualifiées par table → pas d'erreur « more than one row ».
  - `20260529120000_admin_roles` : `ADD COLUMN IF NOT EXISTS … DEFAULT 'admin' CHECK(...)` + UPDATE seed ciblé sur un UUID. Replay-safe.
  - `20260529090757` (banner_type CHECK élargi) : DROP+ADD constraint, purement additif. Vérifié live : 9 valeurs autorisées.
- **Ordre/dépendances** : aucun objet référencé avant sa création. `v_bestsellers` est correctement recréée **avant** chaque DROP de table dont elle dépend (`drop_products_image_url`, `drop_orders_order_items`). `reservation_status` créé avant `reservations`. Enums `banner_slot/banner_status` créés avant l'`ALTER … ADD COLUMN`. Trigger `update_updated_at_column` (baseline) réutilisé par toutes les tables ultérieures.
- **Enums** : pas de « ADD VALUE puis réutilisation dans la même transaction » (anti-pattern Postgres) — les `banner_type` sont gérés par CHECK texte (pas un type enum), donc immunisés.
- **Code ↔ schéma alignés** : `/api/contact` appelle bien `create_ticket` (plus `create_contact_message`) ; l'UI `/admin/messages` consomme les nouvelles clés stats (`open`/`in_progress`) ; la création de réservation manuelle (`/api/admin/reservations` POST) insère `user_id: null` + `contact_email` nullable, exactement ce que `20260604120000` autorise ; `resolveHomeLayout` accepte la forme JSONB seedée par `20260529095909`.
- **`order_status` enum vestigial** toujours présent (tables droppées) — **intentionnel et documenté** (CLAUDE.md), pas un finding.

## Points positifs (court)
- Discipline d'idempotence remarquable et constante sur 35 migrations — chaque fichier est rejouable sans crash.
- Migrations de données (statuts tickets, banner_type, range_id) protégées par des garde-fous (`RAISE EXCEPTION` si invariant violé, ex. `products_range_id_direct:33`).
- Le pattern snapshot (réservations, reservation_items) et les contraintes `CHECK` (quantités > 0, prix ≥ 0, partial unique 1 réservation active/user) sont cohérents avec la logique métier ET avec le code.
- La migration tickets **referme** l'ancienne policy `Insert valid email` : plus aucun INSERT direct non-admin possible sur `contact_messages` (RLS = admin ALL + 2 SELECT), tout passe par `create_ticket` service_role — tightening net.
- Types commités quasi parfaits (1 seule entrée stale sur ~1 140 lignes).

## Signalements hors périmètre (1 ligne chacun, max 5)
- **WS24 (RLS)** : advisor `auth_rls_initplan` flagge 5 policies cart/cart_items où `auth.jwt() ->> 'anonymous_id'` n'est PAS wrappé en `(SELECT …)` (re-éval par ligne) — `20260527100000` n'a wrappé que `auth.uid()`, et `20260605120000` a reposé le WITH CHECK avec le `auth.jwt()` toujours nu.
- **WS24 (RLS)** : advisor `security_definer_view` ERROR sur `v_bestsellers` + `tags_with_types` (jamais recréées avec `security_invoker = on` dans les migrations qui les définissent).
- **WS24 (RLS/sécurité)** : advisor `multiple_permissive_policies` (70) — conséquence du couple « Admin manage FOR ALL » + « Public read/View SELECT » sur la plupart des tables catalogue ; perf RLS à l'échelle.
- **Storage** : 2 buckets publics (`product-image`, `brand-fiche`) avec policy SELECT large → listables (advisor `public_bucket_allows_listing`) — connu, dans le TODO de `20260528160000`.
- **Archi route** : `/api/admin/reservations` POST insère réservation + items en 2 requêtes PostgREST non transactionnelles (rollback best-effort à la main, `route.ts:160`) — risque d'items orphelins si le 2e INSERT échoue après le 1er.

## Zones non couvertes / à re-vérifier humainement
- **Migration ledger vs filenames** : le remote applique des timestamps régénérés (ex. fichier `20260519182512` ↔ appliqué `20260519182724` ; fichier `20260605120000` ↔ appliqué `20260605082451`) et certains `name` du ledger incluent le préfixe timestamp du fichier, d'autres non. C'est le comportement normal du CLI Supabase et **non bloquant**, mais une réinitialisation `supabase db reset` sur un environnement vierge n'a pas été testée ici (je ne peux qu'auditer les fichiers + l'état live read-only). À valider si un nouvel environnement doit être provisionné depuis zéro.
- **`reorder_banners`/`cleanup_banner_positions` réellement appelées ?** Je n'ai pas tracé tous leurs call-sites src/ (hors périmètre strict) — la reco de REVOKE suppose qu'elles ne sont utilisées que côté admin/service-role ; à confirmer avant de resserrer.
- **Leaked-password protection** (advisor WARN) : réglage dashboard Auth, hors migrations.
