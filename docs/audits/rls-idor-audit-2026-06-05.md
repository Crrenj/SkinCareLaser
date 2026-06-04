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

## Prochaine étape

Avant `apply_migration` : lancer les **5 agents de vérification indépendants**. Points d'attention prioritaires : (a) le `WITH CHECK` sur `carts` ne doit pas bloquer un flux légitime (merge = SECURITY DEFINER, OK ; vérifier qu'aucune route ne fait un UPDATE direct de `carts.user_id` hors service-role) ; (b) confirmer qu'aucune table existante ne dépend des default privileges anon (elles ont des grants explicites) ; (c) `rls_auto_enable` n'est appelée par aucune policy/trigger en prod.
