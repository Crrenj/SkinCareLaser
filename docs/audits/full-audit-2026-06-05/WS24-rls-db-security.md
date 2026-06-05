# WS24 — Sécurité base de données / RLS

**Périmètre** : `supabase/migrations/*.sql` (37 fichiers, dont la migration récemment ajoutée `20260605120000_cart_rls_withcheck_and_revokes.sql`), `docs/audits/rls-idor-audit-2026-06-05.md`, état live du projet `adxpoxcynrpnbbxnncsk` via MCP (read-only : `list_tables`, `list_migrations`, `list_extensions`, `get_advisors`, `execute_sql` SELECT sur `pg_policy`/`pg_proc`/`pg_class`/`pg_default_acl`/`pg_event_trigger`), recoupé avec les call-sites `src/app/api/cart/*`.
**Fichiers lus** : ~22 migrations + 4 routes API + 2 docs · **Lignes parcourues (approx.)** : ~2 400
**Synthèse** : P0=0 · P1=2 · P2=5 · P3=4

> **Note de contexte fort.** Toutes les affirmations RLS/grant/ACL ci-dessous sont **vérifiées contre la base live** (pas seulement contre les fichiers SQL), car les migrations se superposent. Là où le code/doc diverge du live, c'est un constat explicite.

---

## Le verdict sur la migration non-commitée (demande explicite du brief)

**État réel au moment de l'audit** : la migration `20260605120000_cart_rls_withcheck_and_revokes.sql` est **APPLIQUÉE au remote** (présente dans `list_migrations` sous version `20260605082451`, name `cart_rls_withcheck_and_revokes`) **ET committée** (commit `358adc0` « migration RLS hardening (appliquée au remote) »). Le brief et l'en-tête du fichier la décrivent comme « NON COMMITÉE / NON APPLIQUÉE » — c'était vrai au début de la session, ce ne l'est plus. Je la juge donc comme du code en production.

**La migration fait-elle ce qu'il faut ? Casse-t-elle quelque chose ?**

| Bloc | Verdict | Vérification live |
|---|---|---|
| 1. `cart_items` `WITH CHECK` | **Correct, mais no-op de sécurité** | `pg_policy.polwithcheck` = miroir EXACT du `polqual` (EXISTS corrélé). Posé. |
| 2. `carts` `WITH CHECK` (UPDATE) | **Correct, mais no-op de sécurité** | idem, posé. |
| 3. `REVOKE … FROM anon` sur default privileges `FOR ROLE postgres` | **Correct mais INCOMPLET** | `pg_default_acl` pour `postgres`/`public` ne liste plus `anon` (tables = `postgres,authenticated,service_role`). **MAIS** le default-ACL parallèle `FOR ROLE supabase_admin` grante toujours `anon=arwdDxtm` (tables) + `anon=X` (fonctions) → voir WS24-02. |
| 4. `REVOKE EXECUTE … rls_auto_enable` | **Correct et sûr** | `pg_proc.proacl` = `postgres,service_role` only. L'event-trigger `ensure_rls` (owner `postgres`, `evtenabled='O'`) continue de tourner — un event trigger n'exige PAS le privilège EXECUTE → l'auto-RLS n'est PAS cassé. |
| 5. Assertions `DO $$` finales | **Correctes** | Qualifiées par `polrelid` (anti « more than one row »). Idempotent : tous les `ALTER POLICY` sont gardés par `IF EXISTS`. |

**Conclusion** : la migration est **techniquement saine, idempotente, et ne casse rien** (les 2 `WITH CHECK` n'interceptent jamais un chemin applicatif — 100 % des écritures cart passent par `supabaseAdmin` service-role qui bypasse RLS, cf. `src/app/api/cart/route.ts:44-49,302-307`). Sa **valeur réelle est modeste** : les `WITH CHECK` sont cosmétiques (cf. WS24-05, faux positif IDOR confirmé), seuls les `REVOKE` apportent un durcissement prospectif — et le `REVOKE` default-privileges est **incomplet** (WS24-02). Le diagnostic auto-critique du doc IDOR (P1-1 = faux positif, valeur « modeste ») est **exact**.

**Ce qui reste OUVERT dans le doc IDOR** (non traité par la migration) : WS24-01 (grants TABLE larges), WS24-02 (default-ACL `supabase_admin`), WS24-03 (vues SECURITY DEFINER), WS24-06 (buckets listables), WS24-07 (leaked-password). Le doc les liste correctement comme hors-SQL/hors-scope ; je confirme leur statut réel ci-dessous.

---

## Findings

### [WS24-01] `anon` et `authenticated` ont le privilège TABLE `arwdDxtm` (ALL) sur toutes les tables sensibles — RLS = unique barrière — P1
- **Fichier** : `supabase/migrations/00000000000000_baseline.sql:611-612` (`GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated`) + héritage default-ACL (WS24-02)
- **Catégorie** : sécurité
- **Constat** : `pg_class.relacl` live montre pour **chaque** table (`carts`, `cart_items`, `reservations`, `reservation_items`, `contact_messages`, `profiles`, `newsletter_subscribers`, `admin_users`, `rate_limit_buckets`, `shop_settings`, `wishlists`, `posts`, `products`, `banners`) : `anon=arwdDxtm/postgres | authenticated=arwdDxtm/postgres`. C.-à-d. `INSERT/SELECT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER` accordés au niveau privilège-table à anon **et** authenticated. La seule chose qui empêche un client PostgREST direct de lire/écrire ces tables est la **policy RLS** (RLS est `enabled` partout — vérifié, `relrowsecurity=true` sur les 27 tables). Aucune table n'a `FORCE RLS` mais c'est sans effet ici (les rôles applicatifs ne sont pas owner).
- **Impact** : la posture « default-deny » repose entièrement sur la justesse de chaque policy. Une seule policy `USING(true)` de trop, ou une table future sans policy, expose tout. C'est une **surface d'attaque large et fragile** même si, aujourd'hui, les policies tiennent (les tables sans policy = `admin_users`/`newsletter_subscribers`/`rate_limit_buckets` sont en deny-all correct). Le risque concret : la moindre régression de policy = fuite/écriture directe via `/rest/v1/<table>`.
- **Reco** : resserrer les grants TABLE au strict nécessaire, comme déjà fait pour les RPC en `20260528160000`. Concrètement : `REVOKE INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER ON <tables service-role-only> FROM anon, authenticated` pour les tables jamais écrites par un rôle client (`carts`, `cart_items`, `contact_messages`, `reservations`, `reservation_items`, `newsletter_subscribers`, `shop_settings`, `posts`, `banners`, catalogue) ; ne laisser à `authenticated` que ce dont il a réellement besoin en accès direct (`profiles` UPDATE own, `wishlists` ALL own). `anon` ne devrait avoir que `SELECT` sur les tables en lecture publique. C'est le finding « À TRAITER SÉPARÉMENT #1 » déjà identifié dans `20260528160000_harden_rpc_execute_grants.sql:69-72` — toujours non fait.
- **Confiance** : haute (ACL live lue directement).

### [WS24-02] `REVOKE` default-privileges incomplet : le default-ACL `FOR ROLE supabase_admin` continue d'exposer `anon` sur les FUTURS objets — P1
- **Fichier** : `supabase/migrations/20260605120000_cart_rls_withcheck_and_revokes.sql:27-29`
- **Catégorie** : sécurité
- **Constat** : la migration révoque les default-privileges anon **uniquement** `FOR ROLE postgres`. Vérification live de `pg_default_acl` : pour `postgres`/`public` → `anon` est bien retiré (✅) ; mais il existe un **second** default-ACL `FOR ROLE supabase_admin` / schéma `public` qui grante toujours `anon=arwdDxtm` (tables), `anon=X` (fonctions), `anon=rwU` (séquences). Tout objet futur créé **par le rôle `supabase_admin`** dans `public` (ce qui arrive selon le contexte de migration / certaines opérations Dashboard) sera donc **auto-exposé à anon** malgré la migration.
- **Impact** : le durcissement « prospectif » que la migration prétend apporter n'est que partiel. Une future table créée dans le mauvais contexte de rôle hérite quand même de `anon=ALL` → re-création du risque WS24-01 sur les nouvelles tables. **Atténué** par l'event-trigger `ensure_rls` (active RLS automatiquement sur toute nouvelle table) — mais RLS sans policy = deny-all seulement si on n'ajoute pas de policy laxiste, et le grant reste. Ce n'est pas une régression (état pré-existant), mais le commit le laisse croire « fermé ».
- **Reco** : ajouter le bloc déjà présent **en commentaire** dans la migration (`20260605120000:33-36`) : `ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public REVOKE ALL ON TABLES/SEQUENCES FROM anon; REVOKE EXECUTE ON FUNCTIONS FROM anon;`. À exécuter avec un rôle qui a l'autorité sur `supabase_admin` (probablement via Dashboard/support, sinon no-op silencieux). À défaut, documenter que le hardening default-priv est partiel.
- **Confiance** : haute (deux lignes distinctes dans `pg_default_acl`, caveat déjà relevé par la lentille « Signatures » du doc IDOR §Vérification).

### [WS24-03] 2 vues `SECURITY DEFINER` exposées à anon (`v_bestsellers`, `tags_with_types`) — P2
- **Fichier** : `supabase/migrations/20260527110000_drop_orders_order_items.sql:6-16` (`v_bestsellers`) ; `supabase/migrations/00000000000000_baseline.sql:131-142` (`tags_with_types`)
- **Catégorie** : sécurité
- **Constat** : advisor `security_definer_view` (level **ERROR**) sur les deux. Vérifié live : `reloptions` ne contient pas `security_invoker=on`, owner = `postgres`. Une vue sans `security_invoker` exécute ses SELECT avec les droits/RLS du **créateur** (`postgres`, qui bypasse RLS), pas de l'appelant. `v_bestsellers` est lue par anon (home/nav-search) et `GRANT SELECT … TO anon` est posé.
- **Impact** : réel mais faible — les deux vues n'exposent que des colonnes déjà publiquement lisibles via les policies `Public read …` (produits actifs filtrés par `WHERE p.is_active IS DISTINCT FROM false`, tags publics). Le risque serait l'ajout futur d'une colonne sensible à `products`/`tags` qui deviendrait visible en contournant une éventuelle policy par-colonne. Advisor ERROR persistant = bruit qui masque de vrais problèmes.
- **Reco** : `ALTER VIEW public.v_bestsellers SET (security_invoker = on);` + idem `tags_with_types`. Vérifier ensuite que les lectures anon passent toujours (elles devraient : les policies SELECT publiques couvrent products actifs + tags). C'est le finding « À TRAITER SÉPARÉMENT #2 » de `20260528160000`.
- **Confiance** : haute.

### [WS24-04] `merge_anon_cart_to_user` fait confiance au paramètre `p_anon_id` (vol de panier anonyme abandonné) — P2
- **Fichier** : `supabase/migrations/20260523095131_merge_anon_cart_to_user_rpc.sql:10-54` ; call-site `src/app/api/cart/merge/route.ts:27-29`
- **Catégorie** : sécurité / logique-métier
- **Constat** : la RPC `SECURITY DEFINER` (GRANT `authenticated`+`service_role`) prend `p_anon_id` en paramètre et reclaim/merge le cart `WHERE anonymous_id = p_anon_id AND user_id IS NULL` vers `auth.uid()`. Elle dérive bien le **destinataire** de `auth.uid()` (on ne peut pas merger vers autrui), mais elle **ne vérifie pas** que `p_anon_id` appartient à l'appelant. La route `/api/cart/merge` lit `p_anon_id` depuis le cookie httpOnly `cart_id` (sain), MAIS la RPC reste exposée en `authenticated` : un utilisateur connecté appelant `/rest/v1/rpc/merge_anon_cart_to_user` directement peut passer un `anon_id` arbitraire.
- **Impact** : faible. Les `anonymous_id` sont des UUIDv4 aléatoires non énumérables, jamais exposés (cookie httpOnly), et seuls les carts anon **non encore réclamés** (`user_id IS NULL`) matchent. Le pire cas = un attaquant qui devine/intercepte un UUID anon vole les *items* d'un panier abandonné dans le sien. Pas de fuite de données perso (un cart anon n'a ni user_id ni PII). C'est une IDOR théorique d'impact négligeable.
- **Reco** : acceptable en l'état pour V1. Pour la défense-en-profondeur : la RPC pourrait exiger que `p_anon_id` corresponde à un claim, ou la route pourrait rester l'unique entrée (revoke `authenticated`, garder `service_role` + appel via `supabaseAdmin` avec user_id explicite, comme `remove_from_cart`). À noter, pas à corriger d'urgence.
- **Confiance** : haute.

### [WS24-05] Policies admin `FOR ALL` sans `WITH CHECK` explicite (≈10 tables) — P2
- **Fichier** : live — `banners`/`brands`/`products`/`product_images`/`product_tags`/`ranges`/`tags`/`tag_types`/`contact_messages`/`profiles` policies « Admin manage … » (origine `00000000000000_baseline.sql` + `20260527100000_rls_select_auth_uid_and_stable_is_admin.sql`)
- **Catégorie** : sécurité / dette
- **Constat** : ces policies sont `FOR ALL USING (is_user_admin(...))` avec `polwithcheck = NULL` (vérifié live). **Important — non exploitable** : en Postgres, pour `FOR ALL`/`FOR UPDATE`, l'absence de `WITH CHECK` fait que **l'expression `USING` est réutilisée comme `WITH CHECK`** pour les commandes INSERT/UPDATE. L'ownership admin est donc déjà appliqué en écriture. C'est exactement le même mécanisme qui rend WS24 (cart) un no-op. (Les policies plus récentes — `posts`, `shop_settings`, `wishlists`, `profiles Update own` — posent le `WITH CHECK` explicitement, ce qui est la bonne hygiène.)
- **Impact** : nul fonctionnellement (toutes ces écritures passent de toute façon par `supabaseAdmin` service-role). Pur défaut de cohérence/lisibilité : un futur mainteneur peut croire à un trou.
- **Reco** : par cohérence avec les policies récentes, ajouter `WITH CHECK (is_user_admin((SELECT auth.uid())))` lors d'une prochaine passe. Non urgent. **Ne PAS** présenter comme une faille (c'est ce que fait correctement le doc IDOR).
- **Confiance** : haute (sémantique Postgres documentée + état live).

### [WS24-06] 2 buckets Storage publics autorisent le LISTING (énumération de fichiers) — P2
- **Fichier** : `supabase/migrations/00000000000000_baseline.sql:600,604` (policies « Public read product-image » / « Public read brand-fiche »)
- **Catégorie** : sécurité
- **Constat** : advisor `public_bucket_allows_listing` (WARN) sur `product-image` + `brand-fiche`. Vérifié live : policy SELECT sur `storage.objects` = `USING (bucket_id = 'product-image')` (resp. `brand-fiche`), rôle `public`, sans scope dossier. Un client peut donc `storage.from('product-image').list('')` et énumérer **tous** les fichiers. L'accès par URL d'objet public ne nécessite PAS cette policy large.
- **Impact** : faible — énumération de chemins d'images produits et de PDF de marques (contenu non confidentiel). Pas de fuite de données privées, mais expose la structure de stockage et tout fichier mal rangé.
- **Reco** : via **Dashboard Storage** (seul `supabase_storage_admin` peut modifier `storage.objects` ; hors migration SQL standard). Remplacer la policy SELECT large par une lecture d'objet ciblée, ou retirer le listing public et lister via service-role. Finding « À TRAITER SÉPARÉMENT #4 » de `20260528160000`.
- **Confiance** : haute.

### [WS24-07] Leaked-password protection désactivée — P2
- **Fichier** : config Auth (hors repo) ; mémo dans `20260528160000_harden_rpc_execute_grants.sql:79`
- **Catégorie** : sécurité
- **Constat** : advisor `auth_leaked_password_protection` (WARN) — la vérification HaveIBeenPwned est off. Combiné à l'auth volontairement simple (pas de confirmation email, signup = auto-login), des mots de passe compromis connus peuvent être utilisés.
- **Impact** : faible-modéré ; facilite le credential-stuffing sur les comptes clients. Aucun impact sur l'admin (gating séparé via `admin_users`).
- **Reco** : toggle Dashboard Auth → « Leaked password protection ». 1 clic, aucun code. (Reste un choix produit, mais peu coûteux.)
- **Confiance** : haute.

### [WS24-08] `rls_enabled_no_policy` sur 3 tables (deny-all correct, advisor bruyant) — P3
- **Fichier** : `admin_users` (`00000000000000_baseline.sql:46-49`), `newsletter_subscribers` (`20260520085055:22`), `rate_limit_buckets` (`20260519143501:13`)
- **Catégorie** : dette / sécurité
- **Constat** : RLS activée, **aucune** policy → deny-all pour anon/authenticated (correct, c'est l'intention : ces tables sont service-role-only). Advisor INFO `rls_enabled_no_policy` ×3. Combiné à WS24-01 (grant TABLE `arwdDxtm` à anon/authenticated), la **seule** chose qui protège ces tables est l'absence de policy — ce qui est suffisant (RLS active sans policy = tout refusé), mais fragile : ajouter une policy permissive par erreur ouvrirait tout.
- **Impact** : nul aujourd'hui ; advisor noise + fragilité conceptuelle.
- **Reco** : poser une policy explicite `FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)` pour documenter l'intention deny-all et taire l'advisor (et survivre à un futur grant). Optionnel.
- **Confiance** : haute.

### [WS24-09] Incohérence doc/code : la migration et le doc IDOR se disent « NON APPLIQUÉE » alors qu'ils sont appliqués + committés — P3
- **Fichier** : `supabase/migrations/20260605120000_cart_rls_withcheck_and_revokes.sql:1-7` (en-tête) ; `docs/audits/rls-idor-audit-2026-06-05.md:5,157` (« migration vérifiée GO mais NON APPLIQUÉE », « en attente du feu vert utilisateur »)
- **Catégorie** : dette (dérive de doc)
- **Constat** : `list_migrations` prouve l'application (version `20260605082451`) ; `git log` prouve le commit `358adc0` « migration RLS hardening (appliquée au remote) ». Or le corps du doc IDOR (et le brief qui s'en inspire) affirment l'inverse. Le titre du doc (« Audit RLS / IDOR ») garde le ⚠️ « PAS été appliquée ».
- **Impact** : un mainteneur qui lit le doc croira la migration en attente et pourrait la ré-appliquer (idempotent, donc sans dégât) ou, pire, croire le durcissement non fait. La `db/schema.sql` (snapshot dérivé) est par ailleurs documentée comme périmée (CLAUDE.md) — divergence de source de vérité.
- **Reco** : mettre à jour l'en-tête de la migration + la conclusion du doc IDOR pour refléter « appliquée + committée le 2026-06-05 (commit 358adc0) ». Régénérer `db/schema.sql` via `supabase db dump`.
- **Confiance** : haute.

### [WS24-10] Stale finding dans le doc IDOR : `rls_auto_enable` est déjà revoke (P1-3 du doc obsolète) — P3
- **Fichier** : `docs/audits/rls-idor-audit-2026-06-05.md:24-25` (P1-3 décrit `rls_auto_enable` comme « exécutable par anon + authenticated »)
- **Catégorie** : dette (dérive de doc)
- **Constat** : depuis l'application de `20260605120000`, `pg_proc.proacl` de `rls_auto_enable()` = `postgres=X | service_role=X` (vérifié live) — plus d'anon/authenticated. Le finding P1-3 du doc est donc **résolu**, mais le doc le présente toujours comme ouvert (le doc a été écrit avant l'application). De même l'advisor `anon_security_definer_function_executable` ne liste plus que `is_user_admin` (intentionnel) + les 2 `authenticated_security_definer_function_executable` attendus (`create_reservation`, `merge_anon_cart_to_user`) — la régression « 11 fonctions » est bien retombée.
- **Impact** : confusion sur le statut réel ; risque de retravailler un sujet clos.
- **Reco** : marquer P1-3 « RÉSOLU par 20260605120000 » dans le doc.
- **Confiance** : haute.

---

## Points positifs (court)
- **RLS activée sur 100 % des tables `public`** (27/27, `relrowsecurity=true`) ; les tables service-role-only (`admin_users`, `newsletter_subscribers`, `rate_limit_buckets`) sont en deny-all correct (RLS ON, 0 policy).
- **`search_path` figé sur TOUTES les fonctions** (`proconfig` = `public, pg_temp` ou `public`) — l'advisor `function_search_path_mutable` est à 0, vrai durcissement anti-shadowing (migrations `20260522092810` + créations ultérieures cohérentes).
- **GRANT EXECUTE des RPC bien resserré** (`20260528160000`) : panier/messages/tickets/rate-limit/reservations = `service_role` only ou `authenticated`+`service_role` ciblé ; `is_user_admin` correctement laissée à anon (et le commentaire `:47-58` documente précisément POURQUOI ne jamais y toucher).
- **`create_reservation` est exemplaire** : `SECURITY DEFINER` dérivant l'identité de `auth.uid()` (jamais en paramètre), valide ownership du cart, snapshot atomique, ERRCODE mappés proprement côté route, GRANT `authenticated` only.
- **Chemins d'écriture cart 100 % service-role** avec identité dérivée serveur (`getUser()`/cookie httpOnly) — l'auto-critique du doc IDOR (P1-1 = faux positif) est techniquement juste et bien argumentée par la vérif 5-agents.
- **Snapshot pattern réservations** (`product_name`/`unit_price` figés, `ON DELETE SET NULL`) — intégrité des données soignée.

## Signalements hors périmètre (1 ligne chacun, max 5)
- `src/app/api/cart/route.ts:218-225` : `add_to_cart` en mode user authentifié passe `p_anon_id=undefined` → la RPC ne vérifie AUCUN ownership ; sain UNIQUEMENT parce que `cartId` vient de `get_or_create_cart(p_user_id)` dérivé server-side (WS sécu API à confirmer).
- `src/app/api/cart/reserve/route.ts:30` utilise `getSession()` (cookie) au lieu de `getUser()` pour le gating — `getSession()` ne revalide pas le JWT côté serveur (le risque est mitigé car `create_reservation` re-dérive `auth.uid()`, mais incohérent avec le reste du code qui a migré vers `getUser()`).
- `db/schema.sql` documenté périmé (CLAUDE.md) : liste encore `orders`/`product_ranges` droppées, omet `newsletter`/`wishlists`/`shop_settings`/`posts`/`reservations`/tickets — source de vérité de lecture trompeuse (WS dette/DX).
- Les colonnes `shop_settings.shipping_santo_domingo/shipping_interior` (`20260522203505:30-31`) sont orphelines (click-&-collect only) — connu/intentionnel, ne pas recâbler.

## Zones non couvertes / à re-vérifier humainement
- **Modification des default-ACL `FOR ROLE supabase_admin`** (WS24-02) : nécessite un rôle privilégié que je ne peux ni tester ni appliquer (read-only) — vérifier côté Dashboard/support Supabase si le REVOKE est possible, sinon acter le hardening partiel.
- **Policies Storage** (WS24-06) : `storage.objects` n'est modifiable que par `supabase_storage_admin` (Dashboard) — la remédiation ne peut pas passer par une migration SQL standard ; à valider manuellement.
- **Comportement runtime PostgREST exact** des policies `FOR ALL` sans `WITH CHECK` (WS24-05) : conclusion fondée sur la sémantique Postgres documentée, non testée en live (j'ai refusé tout INSERT/UPDATE conformément au read-only). Très haute confiance théorique, mais un test d'écriture authentifié direct le confirmerait formellement.
- **Leaked-password / config Auth** (WS24-07) : état lu via advisor uniquement ; le toggle effectif est côté Dashboard.
