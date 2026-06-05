# Audit RLS / IDOR — FARMAU (2026-06-05)

Audit **lecture seule** de la base live (`adxpoxcynrpnbbxnncsk`) via MCP, inspiré des leçons Lanjo (B2 `WITH CHECK`, B3 IDOR RPC, B4 default privileges, B7 storage, B9 deny-all). Preuves = `pg_policy` / `pg_proc` / `pg_default_acl` / advisors.

⚠️ **La migration en §Remédiation n'a PAS été appliquée.** Conformément aux préférences d'orchestration, tout `apply_migration` est gaté sur une vérification par 5 agents indépendants (call-sites, RLS/dépendances, signatures, idempotence, red-team) — à lancer avant application.

---

## Findings

### P1-1 — `WITH CHECK` manquant : `cart_items` (ALL) + `carts` (UPDATE) → IDOR écriture
Les deux policies user-facing ont un `USING` (filtre la cible) mais **aucun `WITH CHECK`** (ne contraint pas la **nouvelle** ligne) :
- `cart_items` / *Manage own cart items* (ALL) : `USING EXISTS(carts WHERE carts.id=cart_items.cart_id AND (user_id=auth.uid() OR anonymous_id=jwt))`, `WITH CHECK = NULL`.
- `carts` / *Update own cart* (UPDATE) : `USING (auth.uid()=user_id OR anonymous_id=jwt)`, `WITH CHECK = NULL`.

**Impact** : un utilisateur authentifié appelant PostgREST **directement** (`/rest/v1/cart_items`, `/rest/v1/carts` avec son JWT) pourrait INSERT/UPDATE une ligne pointant vers le cart **d'autrui** (ou re-parenter son cart vers un autre `user_id`). **Mitigé pour les flux applicatifs** (les routes `/api/cart/*` passent par `supabaseAdmin` service-role + valident l'ownership côté route), mais l'accès API direct reste ouvert. Classe d'IDOR confirmée par Lanjo (B2).

> ⚠️ **CORRECTION (vérif 5-agents, 2026-06-05) — P1-1 est un FAUX POSITIF.** En Postgres, une policy `FOR ALL`/`FOR UPDATE` avec `USING` mais **sans** `WITH CHECK` utilise **l'expression `USING` comme `WITH CHECK` par défaut** pour INSERT/UPDATE. L'ownership est donc **déjà** appliqué en écriture. Les deux `ALTER POLICY … WITH CHECK` de la migration sont des **no-op fonctionnels** (clarté/explicite seulement, **aucun gain de sécurité**). Aucun IDOR réel ici. Confirmé indépendamment par les lentilles RLS-sémantique (#2) et red-team (#5).

### P1-2 — Default privileges : `anon` hérite de TOUT sur les futurs objets
`pg_default_acl` (owner `postgres`, schéma `public`) : `anon=arwdDxtm` sur les **tables** (a,r,w,d,D,x,t,m), `anon=X` sur les **fonctions**, `anon=rwU` sur les **séquences**.
**Impact** : chaque future table créée par `postgres` est **auto-exposée à anon** (lecture/écriture) tant qu'on ne pose pas RLS + policies ; oublier `ENABLE ROW LEVEL SECURITY` = table grand ouverte. Chaque future fonction est anon-exécutable par défaut (origine des advisors `*_security_definer_function_executable`). **N'affecte PAS les tables existantes** (grants déjà figés). Lanjo B4.

### P1-3 — `rls_auto_enable()` exécutable par `anon` + `authenticated`
Advisor `anon_security_definer_function_executable` : fonction `SECURITY DEFINER` exposée via `/rest/v1/rpc/rls_auto_enable` à anon. Aucune raison qu'un visiteur déclenche cette fonction d'administration → **révoquer**. (≠ `is_user_admin`, qui DOIT rester anon-exécutable car appelée par les policies RLS publiques — **ne pas y toucher**.)

### P1-4 — 2 buckets publics listables (énumération)
Advisor `public_bucket_allows_listing` : `brand-fiche` + `product-image` ont une policy SELECT large permettant `storage.from(...).list('')` → énumération de tous les fichiers. Les URLs publiques d'objet fonctionnent sans cette policy. **Fix via Dashboard Storage** (seul `supabase_storage_admin` possède `storage.objects`) : remplacer la policy SELECT large par un scope dossier, ou retirer le listing et lister via service-role. Lanjo B7.

### P2 (reliquats / cosmétique)
- **`remove_from_cart(p_product_id, p_anon_id, p_user_id)`** : `SECURITY DEFINER`, `v_user_id := COALESCE(p_user_id, auth.uid())` → **trust le param** `p_user_id`/`p_anon_id`. MAIS **service-role-only** (absent de la liste anon/authenticated des advisors) et la route dérive `user_id` de la session (`getUser()`), pas du client. → **acceptable** (le param-trust est by-design pour un appelant service-role). Noté pour défense-en-profondeur.
- **`rls_enabled_no_policy`** sur `admin_users`, `newsletter_subscribers`, `rate_limit_buckets` (INFO) : RLS active sans policy = deny-all (correct). Ajouter une policy `USING(false) WITH CHECK(false)` documente l'intention + tait l'advisor (Lanjo B9).
- **`security_definer_view`** (ERROR) sur `tags_with_types` + `v_bestsellers` : reliquat connu ; `v_bestsellers` est lue par anon (home). Arbitrer advisor-clean vs fonctionnel (Lanjo B8).
- **Policies admin `ALL` sans `WITH CHECK`** (banners, brands, products, product_images, product_tags, ranges, tags, tag_types, contact_messages, profiles) : `USING is_user_admin(auth.uid())`. Risque faible (admin de confiance + écritures via service-role). Ajouter `WITH CHECK is_user_admin(...)` pour la complétude.
- **Leaked password protection** désactivée (WARN) : toggle Dashboard Auth.

---

## Remédiation — migration DRAFT (NON appliquée)

```sql
-- supabase/migrations/<timestamp>_rls_idor_hardening.sql  — DRAFT
-- ⚠️ NE PAS appliquer sans la vérif 5 agents (call-sites / RLS-deps / signatures / idempotence / red-team).

-- P1-1 : WITH CHECK miroir du USING (ferme l'IDOR écriture en accès API direct).
ALTER POLICY "Manage own cart items" ON public.cart_items
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.carts
    WHERE carts.id = cart_items.cart_id
      AND (carts.user_id = (SELECT auth.uid())
           OR carts.anonymous_id::text = (auth.jwt() ->> 'anonymous_id'))
  ));

ALTER POLICY "Update own cart" ON public.carts
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    OR (anonymous_id)::text = (auth.jwt() ->> 'anonymous_id')
  );
-- Vérifier que le flux merge anon→user (merge_anon_cart_to_user, SECURITY DEFINER)
-- n'est pas impacté : il bypasse RLS, donc le WITH CHECK ne s'y applique pas. OK.

-- P1-2 : fermer la fuite anon sur les FUTURS objets (n'affecte pas l'existant).
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon;
-- Conséquence : toute future table publique-lecture devra GRANT SELECT TO anon explicitement,
-- et toute future RPC anon devra GRANT EXECUTE TO anon. is_user_admin (existant) NON affecté.

-- P1-3 : retirer rls_auto_enable de l'API publique.
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;

-- P2 (optionnel) : deny-all explicite (0 changement d'accès, tait l'advisor).
-- CREATE POLICY "deny all (service-role only)" ON public.admin_users
--   FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
-- idem newsletter_subscribers, rate_limit_buckets.

-- Bloc de vérification post-migration (à exécuter dans la même transaction) :
DO $$
BEGIN
  IF (SELECT polwithcheck FROM pg_policy WHERE polname = 'Manage own cart items') IS NULL THEN
    RAISE EXCEPTION 'cart_items WITH CHECK non posé';
  END IF;
  IF (SELECT polwithcheck FROM pg_policy WHERE polname = 'Update own cart') IS NULL THEN
    RAISE EXCEPTION 'carts WITH CHECK non posé';
  END IF;
END $$;
```

**P1-4 (storage)** et **leaked-password** : via Dashboard, pas de migration SQL (privilèges `storage.objects` / config Auth).

---

## Vérification 5-agents (2026-06-05) — verdict **GO** sur la version corrigée

5 agents Opus indépendants (lecture seule, base live + code) : **call-sites, RLS-sémantique, signatures, idempotence, red-team**.

| Lentille | Verdict | Point clé |
|---|---|---|
| Call-sites | **GO** | 100 % des écritures cart passent par service-role (`supabaseAdmin`) ou RPC SECURITY DEFINER → le WITH CHECK n'est jamais sur un chemin applicatif. Aucun script seed ne fait de DDL/ne dépend des default-priv anon. |
| RLS-sémantique | **GO** | Les 2 `ALTER POLICY WITH CHECK` = **no-op** (USING déjà utilisé comme WITH CHECK). Merge anon→user = SECURITY DEFINER → bypass RLS, non impacté. `is_user_admin` non touchée. |
| Signatures | **GO** | Noms de policies / signature `rls_auto_enable()` / rôles exacts. **Caveat** : un default-ACL **parallèle owné par `supabase_admin`** grante aussi anon → le REVOKE `FOR ROLE postgres` est **incomplet** (hardening partiel, pas une régression). |
| Idempotence | **NO-GO sur le draft** → corrigé | Draft : placeholder `(...)` non rempli, `ALTER POLICY` sans garde (pas de `IF EXISTS` natif en PG17), sous-SELECT scalaire fragile. **Version corrigée fournie ci-dessous.** |
| Red-team | **GO** | Aucune régression de lecture anon (grants existants intacts), `is_user_admin` garde EXECUTE, event-trigger `ensure_rls` non cassé par le REVOKE, aucun reload PostgREST, locks instantanés (métadonnées, 263 lignes carts). |

**Conclusion : GO unanime sur la version corrigée ci-dessous.** Mais **valeur réelle modeste** : les 2 `WITH CHECK` sont cosmétiques (faux positif IDOR) ; seuls les `REVOKE` (default-privileges + `rls_auto_enable`) apportent un durcissement **prospectif** (futurs objets) + nettoient 2 advisors. Le double filet `ensure_rls` (auto-RLS sur nouvelles tables) mitige déjà l'essentiel.

### Migration corrigée (idempotente, rejouable) — **TOUJOURS NON APPLIQUÉE**

```sql
-- supabase/migrations/20260605120000_cart_rls_withcheck_and_revokes.sql

-- 1. cart_items : WITH CHECK = miroir EXACT du USING (EXISTS corrélé). No-op de sécurité, explicite.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname='Manage own cart items' AND polrelid='public.cart_items'::regclass) THEN
    EXECUTE $sql$ ALTER POLICY "Manage own cart items" ON public.cart_items
      WITH CHECK (EXISTS (SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id
        AND (carts.user_id = (SELECT auth.uid()) OR (carts.anonymous_id)::text = (auth.jwt() ->> 'anonymous_id')))) $sql$;
  END IF;
END $$;

-- 2. carts : WITH CHECK = miroir du USING (FOR UPDATE).
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname='Update own cart' AND polrelid='public.carts'::regclass) THEN
    EXECUTE $sql$ ALTER POLICY "Update own cart" ON public.carts
      WITH CHECK ((SELECT auth.uid()) = user_id OR (anonymous_id)::text = (auth.jwt() ->> 'anonymous_id')) $sql$;
  END IF;
END $$;

-- 3. Default privileges : ferme l'exposition anon des FUTURS objets (postgres-owned). Idempotent.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon;
-- (Optionnel, si le runner a le rôle supabase_admin — hardening complet :)
-- ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
-- ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
-- ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon;

-- 4. rls_auto_enable() : hygiène advisor (event-trigger → REVOKE sans effet sur l'auto-RLS).
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname='rls_auto_enable' AND pg_get_function_identity_arguments(p.oid)='') THEN
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
  END IF;
END $$;

-- 5. Assertions finales (qualifiées par table — anti "more than one row").
DO $$ BEGIN
  IF (SELECT polwithcheck FROM pg_policy WHERE polname='Manage own cart items' AND polrelid='public.cart_items'::regclass) IS NULL
    THEN RAISE EXCEPTION 'cart_items WITH CHECK non posé'; END IF;
  IF (SELECT polwithcheck FROM pg_policy WHERE polname='Update own cart' AND polrelid='public.carts'::regclass) IS NULL
    THEN RAISE EXCEPTION 'carts WITH CHECK non posé'; END IF;
END $$;
```

⚠️ **Ne PAS toucher `is_user_admin`** (appelée par 15 policies `TO public` dont les lectures anon de `products`/`banners` — la révoquer casse le catalogue). L'advisor `is_user_admin` restera (intentionnel). **P1-4 buckets** + **leaked-password** = Dashboard, hors SQL.

**Statut : migration vérifiée GO mais NON appliquée** — en attente du feu vert utilisateur (pause demandée).
