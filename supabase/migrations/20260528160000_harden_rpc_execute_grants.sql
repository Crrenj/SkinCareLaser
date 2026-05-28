-- Migration : durcissement des GRANT EXECUTE sur les RPC SECURITY DEFINER
--
-- Contexte (audit pré-V1 2026-05-28, WS02/WS03 + recoupement DB live) :
-- le baseline applique `GRANT EXECUTE ON ALL FUNCTIONS … TO anon, authenticated`.
-- Plusieurs RPC SECURITY DEFINER (panier/messages) restaient donc appelables
-- directement par `anon` via PostgREST (/rest/v1/rpc/*) en BYPASSANT la RLS —
-- confirmé en prod par l'advisor Supabase `anon_security_definer_function_executable`
-- (11 fonctions) et par `pg_proc.proacl` (anon=X).
--
-- Ces RPC sont en réalité toutes invoquées CÔTÉ SERVEUR :
--   * panier (get_or_create_cart, add_to_cart, remove_from_cart) + messages
--     (create_contact_message, get_messages_stats) : via supabaseAdmin (service_role),
--     l'identité étant dérivée serveur (getUser()/cookie httpOnly) ;
--   * is_user_admin : via le middleware/route en rôle `authenticated` ;
--   * merge_anon_cart_to_user : via le client de session (authenticated) ;
--   * handle_new_user : trigger uniquement (jamais appelé en RPC) ;
--   * mark_message_as_read : MORTE (0 call-site) -> drop.
--
-- On aligne donc sur le pattern déjà appliqué à create_reservation / check_rate_limit :
-- REVOKE EXECUTE FROM PUBLIC, anon (+ authenticated quand inutile) puis GRANT au
-- seul rôle qui en a besoin. Idempotent (REVOKE/GRANT/DROP IF EXISTS).
--
-- NB : NE corrige PAS les grants TABLE larges (anon/authenticated = ALL via baseline),
-- ni les 2 vues SECURITY DEFINER (v_bestsellers, tags_with_types), ni rls_auto_enable,
-- ni la leaked-password protection (dashboard Auth). Voir les notes en fin de fichier.

-- ── Panier : service_role uniquement ────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.get_or_create_cart(uuid, uuid)        FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_or_create_cart(uuid, uuid)        TO service_role;

REVOKE EXECUTE ON FUNCTION public.add_to_cart(uuid, uuid, integer, uuid) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.add_to_cart(uuid, uuid, integer, uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.remove_from_cart(uuid, uuid, uuid)    FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.remove_from_cart(uuid, uuid, uuid)    TO service_role;

-- ── Messages : service_role uniquement (route requireAdmin / rate-limit+CSRF) ─
REVOKE EXECUTE ON FUNCTION public.create_contact_message(text, text, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.create_contact_message(text, text, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_messages_stats()                  FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_messages_stats()                  TO service_role;

-- RPC morte (aucun call-site dans src/ ; l'admin marque "lu" via UPDATE service_role).
DROP FUNCTION IF EXISTS public.mark_message_as_read(uuid);

-- ── is_user_admin : NE PAS TOUCHER (doit rester exécutable par anon) ─────────
-- DANGER : `is_user_admin` est référencée dans des policies RLS `TO public` sur
-- des tables en lecture ANONYME (products « View active products », banners
-- « Public view active banners », brands/ranges/tags/tag_types/product_images/
-- product_tags/posts « Admin manage … »). L'appelant a besoin du privilège
-- EXECUTE même sur une fonction SECURITY DEFINER ; révoquer `anon` ferait donc
-- échouer toute lecture anonyme (« permission denied for function is_user_admin »)
-- → catalogue / home / blog cassés. On laisse les GRANT en l'état.
-- Le finding F-RPC-7 (anon peut sonder « tel UUID est-il admin ? ») reste un P3
-- résiduel : il ne fuit qu'un booléen pour un UUID deviné, et ne peut PAS être
-- corrigé par un REVOKE sans casser la RLS. Mitigation éventuelle = redesign
-- (ex. policies s'appuyant sur un claim JWT plutôt que sur la RPC), hors scope V1.

-- ── merge anon -> user : appelée par le client de session (authenticated) ─────
REVOKE EXECUTE ON FUNCTION public.merge_anon_cart_to_user(uuid)         FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.merge_anon_cart_to_user(uuid)         TO authenticated, service_role;

-- ── handle_new_user : trigger uniquement, jamais en RPC ──────────────────────
-- (le trigger AFTER INSERT sur auth.users s'exécute indépendamment du GRANT EXECUTE)
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                     FROM PUBLIC, anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- À TRAITER SÉPARÉMENT (hors de cette migration, listés pour mémoire) :
--   1. Grants TABLE : anon/authenticated possèdent INSERT/UPDATE/DELETE sur
--      carts/cart_items/contact_messages/profiles/reservations/newsletter_subscribers
--      (la RLS est l'unique frontière). Resserrer si seul le service_role écrit.
--   2. Vues SECURITY DEFINER (advisor ERROR 0010) : recréer v_bestsellers et
--      tags_with_types avec `security_invoker = on`.
--   3. rls_auto_enable() : fonction SECURITY DEFINER anon-exécutable, hors-repo —
--      investiguer/REVOKE/DROP.
--   4. Buckets storage public-listables (product-image, brand-fiche) : restreindre
--      la policy SELECT au GET d'objet (pas au LIST).
--   5. Auth : activer la leaked-password protection (HaveIBeenPwned) dans le dashboard.
-- ─────────────────────────────────────────────────────────────────────────────
