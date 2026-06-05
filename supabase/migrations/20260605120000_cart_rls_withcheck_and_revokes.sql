-- Durcissement RLS / hygiène privilèges (audit Lanjo→FARMAU, vérif 5 agents GO).
-- Idempotent / rejouable. Voir docs/audits/rls-idor-audit-2026-06-05.md.
--
-- NB : les 2 ALTER POLICY WITH CHECK sont des no-op de sécurité (Postgres utilise
-- déjà USING comme WITH CHECK par défaut) — posés pour l'explicite/lisibilité.
-- Le durcissement RÉEL = les REVOKE (prospectifs sur les futurs objets) + hygiène advisor.
-- NE JAMAIS révoquer is_user_admin (appelée par des policies TO public en lecture anon).

-- 1. cart_items : WITH CHECK = miroir EXACT du USING (EXISTS corrélé sur carts).
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Manage own cart items' AND polrelid = 'public.cart_items'::regclass) THEN
    EXECUTE $sql$ ALTER POLICY "Manage own cart items" ON public.cart_items
      WITH CHECK (EXISTS (SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id
        AND (carts.user_id = (SELECT auth.uid()) OR (carts.anonymous_id)::text = (auth.jwt() ->> 'anonymous_id')))) $sql$;
  END IF;
END $$;

-- 2. carts : WITH CHECK = miroir du USING (FOR UPDATE).
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Update own cart' AND polrelid = 'public.carts'::regclass) THEN
    EXECUTE $sql$ ALTER POLICY "Update own cart" ON public.carts
      WITH CHECK ((SELECT auth.uid()) = user_id OR (anonymous_id)::text = (auth.jwt() ->> 'anonymous_id')) $sql$;
  END IF;
END $$;

-- 3. Default privileges : ferme l'exposition anon des FUTURS objets postgres-owned (n'affecte pas l'existant).
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon;

-- 4. rls_auto_enable() : hygiène advisor (event-trigger → REVOKE sans effet sur l'auto-RLS).
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
             WHERE n.nspname = 'public' AND p.proname = 'rls_auto_enable' AND pg_get_function_identity_arguments(p.oid) = '') THEN
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
  END IF;
END $$;

-- 5. Assertions finales (qualifiées par table — anti "more than one row").
DO $$ BEGIN
  IF (SELECT polwithcheck FROM pg_policy WHERE polname = 'Manage own cart items' AND polrelid = 'public.cart_items'::regclass) IS NULL
    THEN RAISE EXCEPTION 'cart_items WITH CHECK non posé'; END IF;
  IF (SELECT polwithcheck FROM pg_policy WHERE polname = 'Update own cart' AND polrelid = 'public.carts'::regclass) IS NULL
    THEN RAISE EXCEPTION 'carts WITH CHECK non posé'; END IF;
END $$;
